document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navbar = navToggle?.closest(".navbar");
  const navMenu = document.getElementById("navMenu");
  const navAuth = navbar?.querySelector(".nav-auth");
  const dropdownToggle = document.querySelector(".dropdown-toggle");
  const dropdownParent = dropdownToggle?.closest(".dropdown");

  if (navMenu && navAuth && !navMenu.contains(navAuth)) {
    const authItem = document.createElement("li");
    authItem.className = "nav-item nav-item--auth";
    authItem.appendChild(navAuth);
    navMenu.appendChild(authItem);
  }

  navToggle?.addEventListener("click", () => {
    const isOpen = navbar?.classList.toggle("is-open") || false;
    navToggle.classList.toggle("is-active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  dropdownToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    dropdownParent?.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    if (!navbar?.contains(event.target)) {
      navbar?.classList.remove("is-open");
      navToggle?.classList.remove("is-active");
      navToggle?.setAttribute("aria-expanded", "false");
      dropdownParent?.classList.remove("open");
    }
  });

  navMenu?.querySelectorAll("a:not(.dropdown-toggle)").forEach((link) => {
    link.addEventListener("click", () => {
      navbar?.classList.remove("is-open");
      navToggle?.classList.remove("is-active");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });
});
