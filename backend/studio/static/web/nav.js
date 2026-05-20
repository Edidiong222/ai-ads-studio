/**
 * Sidebar navigation + secure sign-out.
 */
(function () {
  const ROUTES = {
    "Create Ad": "/create-ad/",
    Pricing: "/pricing/",
    Settings: "/settings/",
    "Sign out": "/signin/",
  };

  function go(href) {
    if (href) window.location.href = href;
  }

  async function signOut() {
    const ui = window.StudioUI;
    const refresh = localStorage.getItem("refresh_token");
    if (ui && refresh) {
      try {
        await ui.api("/auth/logout/", {
          method: "POST",
          body: JSON.stringify({ refresh: refresh }),
        });
      } catch (_) {
        /* still clear local session */
      }
    }
    if (ui) ui.clearAuth();
    else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    go("/signin/");
  }

  function wireNavItem(el) {
    const label = (el.textContent || "").replace(/\s+/g, " ").trim();
    for (const [key, href] of Object.entries(ROUTES)) {
      if (!label.includes(key)) continue;
      el.style.cursor = "pointer";
      el.setAttribute("role", "link");
      el.setAttribute("tabindex", "0");
      el.addEventListener("click", function () {
        if (key === "Sign out") signOut();
        else go(href);
      });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          el.click();
        }
      });
      break;
    }
  }

  function highlightActiveNav() {
    const p = window.location.pathname;
    let active = "Create Ad";
    if (p.includes("create-ad")) active = "Create Ad";
    else if (p.includes("pricing")) active = "Pricing";
    else if (p.includes("settings")) active = "Settings";

    document.querySelectorAll("nav li").forEach(function (el) {
      const label = (el.textContent || "").replace(/\s+/g, " ").trim();
      const isActive = label.includes(active);
      el.classList.toggle("font-semibold", isActive);
      el.classList.toggle("text-blue-700", isActive);
      el.classList.toggle("bg-blue-100", isActive);
      el.classList.toggle("text-gray-600", !isActive);
    });
  }

  function wire() {
    document.querySelectorAll("nav li").forEach(wireNavItem);
    highlightActiveNav();

    document.querySelectorAll("button").forEach(function (el) {
      const t = (el.textContent || "").trim();
      if (/new ad/i.test(t)) {
        el.addEventListener("click", function (e) {
          e.preventDefault();
          go("/create-ad/");
        });
      }
    });

    document.querySelectorAll("nav h1").forEach(function (brand) {
      brand.style.cursor = "pointer";
      brand.addEventListener("click", function () {
        go("/create-ad/");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
