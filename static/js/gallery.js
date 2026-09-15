document.addEventListener("DOMContentLoaded", () => {
  const productImages = document.querySelectorAll(".product-card img");
  if (!productImages.length) return;

  const lightbox = document.createElement("div");
  lightbox.className = "image-lightbox";
  lightbox.innerHTML = `
    <div class="image-lightbox__backdrop"></div>
    <div class="image-lightbox__content">
      <button class="image-lightbox__close" type="button" aria-label="Close image preview">&times;</button>
      <img class="image-lightbox__image" alt="">
    </div>
  `;

  document.body.appendChild(lightbox);

  const previewImage = lightbox.querySelector(".image-lightbox__image");
  const closeButton = lightbox.querySelector(".image-lightbox__close");
  const backdrop = lightbox.querySelector(".image-lightbox__backdrop");

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    previewImage.removeAttribute("src");
    previewImage.alt = "";
    document.body.style.overflow = "";
  };

  productImages.forEach((image) => {
    image.setAttribute("tabindex", "0");
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `View larger image of ${image.alt || "product"}`);

    const openLightbox = () => {
      previewImage.src = image.currentSrc || image.src;
      previewImage.alt = image.alt || "Product image";
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    };

    image.addEventListener("click", openLightbox);
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox();
      }
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
});
