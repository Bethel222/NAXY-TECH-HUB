const CART_STORAGE_KEY = "naxy-cart";
const PAYSTACK_PUBLIC_KEY = "pk_live_33e34f7feb231759c5e25f1392a519cef7f245e6";
const WEB3FORMS_ACCESS_KEY = "5be80d1c-7edb-4207-aa41-44f402ba65c0";
const DELIVERY_FEE_ONITSHA = 2000;
const DELIVERY_FEE_OTHER = 3000;

const parsePriceValue = (priceText) => {
  const match = (priceText || "").match(/N\s*([\d,]+)/i);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, ""));
};

const parseVariantOptions = (priceNode) => {
  const rawPrice = priceNode?.innerHTML || priceNode?.textContent || "";
  const lines = rawPrice
    .split(/<br\s*\/?>/i)
    .map((line) => line.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const priceValue = parsePriceValue(line);
      if (!priceValue) return null;

      const label = line
        .replace(/=\s*N[\d,]+/i, "")
        .replace(/N\s*[\d,]+/i, "")
        .replace(/\s*=\s*$/i, "")
        .trim();

      return {
        label,
        priceText: line,
        priceValue
      };
    })
    .filter(Boolean);
};

const COLOR_OPTIONS = ["Black", "White", "Silver"];

const formatPrice = (value) => `N${value.toLocaleString()}`;
const encodeMessage = (text) => encodeURIComponent(text);
const getDeliveryFee = (cityText) => /onitsha/i.test(cityText || "") ? DELIVERY_FEE_ONITSHA : DELIVERY_FEE_OTHER;

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
};

const buildWhatsAppMessage = (cart, customer, subtotal, deliveryFee, total, reference = "") => {
  const messageLines = cart.map((item) => `- ${item.name} x${item.quantity} (${item.priceText}${item.color ? `, Color: ${item.color}` : ""})`);
  const deliveryLines = [
    `Full name: ${customer.name || "-"}`,
    `Phone number: ${customer.phone || "-"}`,
    `Email address: ${customer.email || "-"}`,
    `Address: ${customer.address || "-"}`,
    `City/State: ${customer.city || "-"}`
  ];

  return [
    reference
      ? "Hello, I have completed payment for the order below via Paystack."
      : "Hello, I would like to confirm this order:",
    ...messageLines,
    "",
    `Items total: ${formatPrice(subtotal)}`,
    `Delivery fee: ${formatPrice(deliveryFee)}`,
    `Grand total: ${formatPrice(total)}`,
    reference ? `Payment reference: ${reference}` : "",
    reference ? "I will attach my payment slip in this chat for confirmation." : "",
    "",
    "Delivery details:",
    ...deliveryLines
  ].filter(Boolean).join("\n");
};

const buildEmailMessage = (cart, customer, subtotal, deliveryFee, total, reference = "") => {
  const items = cart
    .map((item) => `${item.name} x${item.quantity} | ${item.priceText}${item.color ? ` | Color: ${item.color}` : ""}`)
    .join("\n");

  return [
    reference ? "A paid order was placed on the website." : "A new order was placed on the website.",
    "",
    "Order items:",
    items || "-",
    "",
    `Items total: ${formatPrice(subtotal)}`,
    `Delivery fee: ${formatPrice(deliveryFee)}`,
    `Grand total: ${formatPrice(total)}`,
    reference ? `Payment reference: ${reference}` : "Payment reference: Not yet paid online",
    "",
    "Customer details:",
    `Full name: ${customer.name || "-"}`,
    `Phone number: ${customer.phone || "-"}`,
    `Email address: ${customer.email || "-"}`,
    `Address: ${customer.address || "-"}`,
    `City/State: ${customer.city || "-"}`
  ].join("\n");
};

const sendOrderEmail = async (cart, customer, subtotal, deliveryFee, total, reference = "") => {
  if (!WEB3FORMS_ACCESS_KEY) return false;

  const subject = reference
    ? `Paid Order - ${customer.name || "Website Customer"}`
    : `New Order - ${customer.name || "Website Customer"}`;

  const payload = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject,
    from_name: "Naxy Tech Gadgets Website",
    email: customer.email || "naxytechgadgets@gmail.com",
    replyto: customer.email || "naxytechgadgets@gmail.com",
    message: buildEmailMessage(cart, customer, subtotal, deliveryFee, total, reference)
  };

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch {
    return false;
  }
};

const updateCartBadge = () => {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count;
  });
};

const addProductButtons = () => {
  const cards = document.querySelectorAll(".product-card");
  if (!cards.length) return;

  cards.forEach((card) => {
    if (card.querySelector("[data-add-cart]")) return;

    const title = card.querySelector("h3")?.textContent?.trim() || "Product";
    const priceNode = card.querySelector(".price");
    const priceText = priceNode?.textContent?.trim() || "";
    const imageSrc = card.querySelector("img")?.getAttribute("src") || "";
    const variants = parseVariantOptions(priceNode);
    const orderButton = card.querySelector(".btn.green");
    let colorSelect = card.querySelector("[data-product-color]");

    if (!colorSelect) {
      const colorField = document.createElement("label");
      colorField.className = "product-option";
      colorField.innerHTML = `
        <span class="product-option__label">Choose color</span>
        <select class="product-option__select" data-product-color>
          <option value="">Select color</option>
          ${COLOR_OPTIONS.map((color) => `<option value="${color}">${color}</option>`).join("")}
        </select>
      `;

      if (orderButton) {
        orderButton.insertAdjacentElement("beforebegin", colorField);
      } else {
        card.appendChild(colorField);
      }

      colorSelect = colorField.querySelector("[data-product-color]");
    }

    const addItemToCart = ({ name, selectedPriceText, selectedPriceValue }, button) => {
      const selectedColor = colorSelect?.value?.trim() || "";
      if (!selectedColor) {
        alert("Please select a color before adding this product to your cart.");
        colorSelect?.focus();
        return;
      }

      const cart = getCart();
      const existing = cart.find((item) => item.name === name && item.color === selectedColor);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          name,
          color: selectedColor,
          priceText: selectedPriceText,
          priceValue: selectedPriceValue,
          image: imageSrc,
          quantity: 1
        });
      }

      saveCart(cart);
      updateCartBadge();
      const originalText = button.textContent;
      button.textContent = "Added to Cart";
      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1200);
    };

    if (variants.length > 1) {
      const buttonGroup = document.createElement("div");
      buttonGroup.className = "cart-variant-group";

      variants.forEach((variant) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn cart-btn cart-btn--variant";
        button.dataset.addCart = "true";
        button.textContent = `Add ${variant.label}`;
        button.addEventListener("click", () => {
          addItemToCart(
            {
              name: `${title} (${variant.label})`,
              selectedPriceText: variant.priceText,
              selectedPriceValue: variant.priceValue
            },
            button
          );
        });
        buttonGroup.appendChild(button);
      });

      if (orderButton) {
        orderButton.insertAdjacentElement("beforebegin", buttonGroup);
        orderButton.remove();
      } else {
        card.appendChild(buttonGroup);
      }
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn cart-btn";
    button.dataset.addCart = "true";
    button.textContent = "Add to Cart";
    button.addEventListener("click", () => {
      addItemToCart(
        {
          name: title,
          selectedPriceText: priceText,
          selectedPriceValue: parsePriceValue(priceText)
        },
        button
      );
    });

    if (orderButton) {
      orderButton.insertAdjacentElement("beforebegin", button);
      orderButton.remove();
    } else {
      card.appendChild(button);
    }
  });
};

const addFloatingCart = () => {
  if (document.querySelector(".cart-float")) return;

  const link = document.createElement("a");
  link.href = "/cart/";
  link.className = "cart-float";
  link.innerHTML = `
    <span>Cart</span>
    <span class="cart-float__count" data-cart-count>0</span>
  `;
  document.body.appendChild(link);
  updateCartBadge();
};

const renderCartPage = () => {
  const cartRoot = document.querySelector("[data-cart-root]");
  if (!cartRoot) return;

  const cart = getCart();
  const list = cartRoot.querySelector("[data-cart-list]");
  const empty = cartRoot.querySelector("[data-cart-empty]");
  const subtotalNode = cartRoot.querySelector("[data-cart-subtotal]");
  const deliveryNode = cartRoot.querySelector("[data-cart-delivery]");
  const totalNode = cartRoot.querySelector("[data-cart-total]");
  const checkout = cartRoot.querySelector("[data-cart-checkout]");
  const paystackButton = cartRoot.querySelector("[data-paystack-button]");
  const nameInput = cartRoot.querySelector("#customer-name");
  const phoneInput = cartRoot.querySelector("#customer-phone");
  const emailInput = cartRoot.querySelector("#customer-email");
  const addressInput = cartRoot.querySelector("#customer-address");
  const cityInput = cartRoot.querySelector("#customer-city");
  const requiredInputs = [nameInput, phoneInput, emailInput, addressInput, cityInput];
  const isPhoneValid = () => /^\+?[0-9\s-]{10,15}$/.test(phoneInput?.value?.trim() || "");
  const isEmailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput?.value?.trim() || "");
  let checkoutState = {
    canCheckout: false,
    customer: null,
    subtotal: 0,
    deliveryFee: 0,
    total: 0
  };

  const updateCheckoutLink = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.priceValue * item.quantity), 0);
    const customer = {
      name: nameInput?.value?.trim() || "",
      phone: phoneInput?.value?.trim() || "",
      email: emailInput?.value?.trim() || "",
      address: addressInput?.value?.trim() || "",
      city: cityInput?.value?.trim() || ""
    };
    const deliveryFee = getDeliveryFee(customer.city);
    const total = subtotal + deliveryFee;
    if (subtotalNode) subtotalNode.textContent = formatPrice(subtotal);
    if (deliveryNode) deliveryNode.textContent = formatPrice(deliveryFee);
    totalNode.textContent = formatPrice(total);
    const hasItems = cart.length > 0;
    const isDeliveryValid =
      requiredInputs.every((input) => input?.value?.trim()) &&
      isPhoneValid() &&
      isEmailValid();
    const message = buildWhatsAppMessage(cart, customer, subtotal, deliveryFee, total);

    const canCheckout = hasItems && isDeliveryValid;
    checkoutState = { canCheckout, customer, subtotal, deliveryFee, total };
    checkout.setAttribute("href", canCheckout ? `https://wa.me/2347049763653?text=${encodeMessage(message)}` : "#");
    checkout.classList.toggle("checkout-disabled", !canCheckout);
    if (paystackButton) {
      paystackButton.classList.toggle("checkout-disabled", !canCheckout);
      paystackButton.disabled = !canCheckout;
    }
  };

  if (!cart.length) {
    list.innerHTML = "";
    empty.hidden = false;
    if (subtotalNode) subtotalNode.textContent = formatPrice(0);
    if (deliveryNode) deliveryNode.textContent = formatPrice(0);
    totalNode.textContent = formatPrice(0);
    checkout.setAttribute("href", "#");
    checkout.classList.add("checkout-disabled");
    if (paystackButton) {
      paystackButton.classList.add("checkout-disabled");
      paystackButton.disabled = true;
    }
    updateCartBadge();
    return;
  }

  empty.hidden = true;
  list.innerHTML = cart.map((item, index) => `
    <article class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h3>${item.name}</h3>
        <p class="cart-item__meta">${item.priceText}${item.color ? `<br>Color: ${item.color}` : ""}</p>
      </div>
      <div class="cart-item__controls">
        <button class="cart-action" type="button" data-cart-dec="${index}">-</button>
        <span class="cart-item__qty">${item.quantity}</span>
        <button class="cart-action" type="button" data-cart-inc="${index}">+</button>
        <button class="cart-action" type="button" data-cart-remove="${index}">x</button>
      </div>
    </article>
  `).join("");

  updateCheckoutLink();

  [nameInput, phoneInput, emailInput, addressInput, cityInput].forEach((input) => {
    input?.addEventListener("input", updateCheckoutLink);
  });

  checkout.addEventListener("click", async (event) => {
    if (!cart.length) {
      event.preventDefault();
      alert("Please add at least one product to your cart before continuing.");
      return;
    }

    const missingField = requiredInputs.find((input) => !input?.value?.trim());
    if (missingField) {
      event.preventDefault();
      missingField.focus();
      alert("Please fill in your full name, phone number, email address, delivery address, and city/state before continuing.");
      return;
    }

    if (!isPhoneValid()) {
      event.preventDefault();
      phoneInput?.focus();
      alert("Please enter a valid phone number with 10 to 15 digits.");
      return;
    }

    if (!isEmailValid()) {
      event.preventDefault();
      emailInput?.focus();
      alert("Please enter a valid email address before checkout.");
      return;
    }

    event.preventDefault();
    sendOrderEmail(
      cart,
      checkoutState.customer,
      checkoutState.subtotal,
      checkoutState.deliveryFee,
      checkoutState.total
    );
    window.location.href = checkout.getAttribute("href");
  });

  paystackButton?.addEventListener("click", () => {
    if (!cart.length) {
      alert("Please add at least one product to your cart before payment.");
      return;
    }

    const missingField = requiredInputs.find((input) => !input?.value?.trim());
    if (missingField) {
      missingField.focus();
      alert("Please fill in your full name, phone number, email address, delivery address, and city/state before payment.");
      return;
    }

    if (!isPhoneValid()) {
      phoneInput?.focus();
      alert("Please enter a valid phone number with 10 to 15 digits.");
      return;
    }

    if (!isEmailValid()) {
      emailInput?.focus();
      alert("Please enter a valid email address before payment.");
      return;
    }

    if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.startsWith("pk_test_replace")) {
      alert("Add your Paystack public key in cart.js before accepting online payments.");
      return;
    }

    if (typeof window.PaystackPop !== "function") {
      alert("Paystack could not load. Please check your internet connection and try again.");
      return;
    }

    const popup = new window.PaystackPop();
    const [firstName = "", ...restNames] = checkoutState.customer.name.split(" ");
    const lastName = restNames.join(" ");

    popup.newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      email: checkoutState.customer.email,
      amount: checkoutState.total * 100,
      currency: "NGN",
      firstName,
      lastName,
      phone: checkoutState.customer.phone,
      metadata: {
        custom_fields: [
          {
            display_name: "Delivery Address",
            variable_name: "delivery_address",
            value: checkoutState.customer.address
          },
          {
            display_name: "City / State",
            variable_name: "city_state",
            value: checkoutState.customer.city
          }
        ]
      },
      onSuccess: async (transaction) => {
        await sendOrderEmail(
          cart,
          checkoutState.customer,
          checkoutState.subtotal,
          checkoutState.deliveryFee,
          checkoutState.total,
          transaction?.reference || ""
        );
        const message = buildWhatsAppMessage(
          cart,
          checkoutState.customer,
          checkoutState.subtotal,
          checkoutState.deliveryFee,
          checkoutState.total,
          transaction?.reference || ""
        );
        window.location.href = `https://wa.me/2347049763653?text=${encodeMessage(message)}`;
      },
      onCancel: () => {
        alert("Payment was cancelled. You can review your cart and try again anytime.");
      },
      onError: (error) => {
        alert(error?.message || "Payment could not be completed right now. Please try again in a moment.");
      }
    });
  });

  list.querySelectorAll("[data-cart-inc]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.cartInc);
      cart[index].quantity += 1;
      saveCart(cart);
      renderCartPage();
    });
  });

  list.querySelectorAll("[data-cart-dec]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.cartDec);
      cart[index].quantity -= 1;
      if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
      }
      saveCart(cart);
      renderCartPage();
    });
  });

  list.querySelectorAll("[data-cart-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.cartRemove);
      cart.splice(index, 1);
      saveCart(cart);
      renderCartPage();
    });
  });

  updateCartBadge();
};

const runWhenBrowserIsFree = (callback) => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 500 });
    return;
  }

  window.setTimeout(callback, 0);
};

const initCart = () => {
  addFloatingCart();
  renderCartPage();
  runWhenBrowserIsFree(addProductButtons);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCart, { once: true });
} else {
  initCart();
}
