const NAXY_ACCOUNT_KEY = "naxy-account";
const NAXY_SESSION_KEY = "naxy-session";
const PROTECTED_PAGES = [
  "phones.html",
  "laptops.html",
  "smartwatch.html",
  "powerbanks.html",
  "earpods.html",
  "tripods.html",
  "iphone.html",
  "samsung.html"
];

const getCurrentPage = () => {
  const page = window.location.pathname.split("/").pop();
  return page || "index.html";
};

const getRedirectTarget = () => {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return redirect && !redirect.startsWith("http") ? redirect : "index.html";
};

const getAccount = () => {
  try {
    return JSON.parse(localStorage.getItem(NAXY_ACCOUNT_KEY));
  } catch {
    return null;
  }
};

const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(NAXY_SESSION_KEY));
  } catch {
    return null;
  }
};

const isLoggedIn = () => Boolean(getSession()?.email);

const redirectToLogin = (target = getCurrentPage()) => {
  window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
};

const protectPage = () => {
  const page = getCurrentPage().toLowerCase();
  if (PROTECTED_PAGES.includes(page) && !isLoggedIn()) {
    redirectToLogin(page);
  }
};

const setupProtectedLinks = () => {
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    const page = href?.split("?")[0]?.toLowerCase();
    if (!PROTECTED_PAGES.includes(page)) return;

    link.addEventListener("click", (event) => {
      if (isLoggedIn()) return;
      event.preventDefault();
      redirectToLogin(href);
    });
  });
};

const createSiteNav = () => {
  if (document.querySelector(".site-nav")) return;

  const session = getSession();
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.innerHTML = `
    <a href="index.html" class="site-nav__brand">
      <img src="NAXY LOGO.png" alt="Naxy Tech Gadgets logo">
      <span>Naxy Tech Gadgets</span>
    </a>
    <div class="site-nav__links">
      <a href="index.html">Home</a>
      <a href="phones.html">Categories</a>
      <a href="cart.html">Cart</a>
      ${
        session?.name
          ? `<button class="site-nav__button" type="button" data-logout>Logout ${session.name.split(" ")[0]}</button>`
          : `<a href="login.html" class="site-nav__button">Login</a>`
      }
    </div>
  `;

  const loader = document.querySelector("[data-site-loader]");
  if (loader) {
    loader.insertAdjacentElement("afterend", nav);
  } else {
    document.body.prepend(nav);
  }

  nav.querySelector("[data-logout]")?.addEventListener("click", () => {
    localStorage.removeItem(NAXY_SESSION_KEY);
    window.location.href = "index.html";
  });
};

const showLoginMessage = (message, type = "error") => {
  const messageNode = document.querySelector("[data-login-message]");
  if (!messageNode) return;

  messageNode.textContent = message;
  messageNode.dataset.type = type;
  messageNode.hidden = false;
};

const setupLoginPage = () => {
  const loginForm = document.querySelector("[data-login-form]");
  const signupForm = document.querySelector("[data-signup-form]");
  const showSignup = document.querySelector("[data-show-signup]");
  const showLogin = document.querySelector("[data-show-login]");
  if (!loginForm || !signupForm) return;

  const switchMode = (mode) => {
    const isSignup = mode === "signup";
    loginForm.hidden = isSignup;
    signupForm.hidden = !isSignup;
    document.querySelector("[data-login-heading]").textContent = isSignup ? "Create Account" : "Welcome Back";
    document.querySelector("[data-login-eyebrow]").textContent = isSignup ? "New Customer" : "Customer Login";
    showLoginMessage("", "success");
    document.querySelector("[data-login-message]").hidden = true;
  };

  if (new URLSearchParams(window.location.search).get("mode") === "signup") {
    switchMode("signup");
  }

  showSignup?.addEventListener("click", () => switchMode("signup"));
  showLogin?.addEventListener("click", () => switchMode("login"));

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const account = getAccount();
    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.password.value;

    if (!account) {
      showLoginMessage("No account found yet. Please create an account first.");
      switchMode("signup");
      signupForm.email.value = email;
      return;
    }

    if (account.email !== email || account.password !== password) {
      showLoginMessage("Email or password is incorrect.");
      return;
    }

    localStorage.setItem(NAXY_SESSION_KEY, JSON.stringify({ name: account.name, email: account.email }));
    window.location.href = getRedirectTarget();
  });

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = signupForm.name.value.trim();
    const email = signupForm.email.value.trim().toLowerCase();
    const password = signupForm.password.value;
    const confirmPassword = signupForm.confirm_password.value;

    if (password !== confirmPassword) {
      showLoginMessage("Passwords do not match.");
      return;
    }

    localStorage.setItem(NAXY_ACCOUNT_KEY, JSON.stringify({ name, email, password }));
    localStorage.setItem(NAXY_SESSION_KEY, JSON.stringify({ name, email }));
    showLoginMessage("Account created successfully. Opening your selected category...", "success");
    window.setTimeout(() => {
      window.location.href = getRedirectTarget();
    }, 700);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  protectPage();
  createSiteNav();
  setupProtectedLinks();
  setupLoginPage();
});
