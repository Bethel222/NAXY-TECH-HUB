(() => {
  const THEME_STORAGE_KEY = "naxy-theme";

  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  };

  const addThemeToggle = () => {
    if (document.querySelector("[data-theme-toggle]")) return;

    const navbar = document.querySelector(".navbar");
    const navToggle = document.querySelector(".nav-toggle");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.dataset.themeToggle = "true";

    const updateButton = () => {
      const isDark = document.documentElement.dataset.theme === "dark";
      button.innerHTML = isDark
        ? '<span aria-hidden="true">☀</span>'
        : '<span aria-hidden="true">☾</span>';
      button.title = isDark ? "Switch to light mode" : "Switch to dark mode";
      button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    };

    button.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
      updateButton();
    });

    updateButton();
    if (navbar && navToggle) {
      navbar.insertBefore(button, navToggle);
    } else if (navbar) {
      navbar.appendChild(button);
    } else {
      document.body.appendChild(button);
    }
  };

  const hideLoader = () => {
    const loader = document.querySelector("[data-site-loader]");
    if (!loader) return;

    loader.classList.add("site-loader--hidden");
    window.setTimeout(() => loader.remove(), 450);
  };

  applyTheme(getPreferredTheme());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      addThemeToggle();
      window.setTimeout(hideLoader, 80);
    });
  } else {
    addThemeToggle();
    window.setTimeout(hideLoader, 80);
  }

  window.addEventListener("pageshow", hideLoader);
  window.setTimeout(hideLoader, 1200);
})();
