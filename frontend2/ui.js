/**
 * Shared UI + secure API helpers for AI Ads Studio (instructor reference build).
 */
(function (global) {
  const TOKEN_KEY = "access_token";
  const REFRESH_KEY = "refresh_token";

  function apiBase() {
    const base = (global.API_BASE || "/api").replace(/\/$/, "");
    return base;
  }

  function escapeHtml(value) {
    if (value == null) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toastHost() {
    let host = document.getElementById("studio-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "studio-toast-host";
      host.className = "studio-toast-host";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    return host;
  }

  function toast(message, type) {
    const host = toastHost();
    const el = document.createElement("div");
    el.className = "studio-toast studio-toast--" + (type || "info");
    el.textContent = message;
    host.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 4200);
  }

  function formatApiError(data, fallback) {
    if (!data) return fallback || "Request failed";
    if (typeof data.error === "string" && data.error) return data.error;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) return data.detail.join(" ");
    if (typeof data.detail === "object" && data.detail) {
      return Object.entries(data.detail)
        .map(function (kv) {
          var k = kv[0];
          var v = kv[1];
          return k + ": " + (Array.isArray(v) ? v.join(", ") : v);
        })
        .join(" ");
    }
    var fieldMsgs = Object.entries(data)
      .filter(function (kv) {
        return kv[0] !== "detail" && kv[0] !== "error";
      })
      .map(function (kv) {
        var v = kv[1];
        return (Array.isArray(v) ? v.join(", ") : String(v));
      });
    if (fieldMsgs.length) return fieldMsgs.join(" ");
    return fallback || "Request failed";
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  function setAuth(access, refresh) {
    if (access) localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  }

  async function tryRefresh() {
    var refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) return false;
    try {
      var res = await fetch(apiBase() + "/auth/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refresh }),
      });
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        clearAuth();
        return false;
      }
      if (data.access) localStorage.setItem(TOKEN_KEY, data.access);
      if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
      return true;
    } catch {
      clearAuth();
      return false;
    }
  }

  async function api(path, options, retried) {
    options = options || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    var token = getToken();
    if (token) headers.Authorization = "Bearer " + token;

    var res = await fetch(apiBase() + path, Object.assign({}, options, { headers: headers }));
    var text = await res.text();
    var data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      data = {};
    }

    if (res.status === 401 && !retried && (await tryRefresh())) {
      return api(path, options, true);
    }

    if (!res.ok) {
      var msg = formatApiError(data, res.statusText);
      if (!msg || msg === res.statusText) {
        msg =
          (text && text.indexOf("<!DOCTYPE") === 0 ? res.status + " — server returned HTML (wrong URL?)" : null) ||
          (text ? text.slice(0, 180) : res.statusText);
      }
      var err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function setButtonLoading(btn, loading, label) {
    if (!btn) return;
    if (loading) {
      btn.dataset.studioLabel = btn.textContent;
      btn.classList.add("studio-btn-loading");
      btn.disabled = true;
      if (label) btn.textContent = label;
    } else {
      btn.classList.remove("studio-btn-loading");
      btn.disabled = false;
      if (btn.dataset.studioLabel) {
        btn.textContent = btn.dataset.studioLabel;
        delete btn.dataset.studioLabel;
      }
    }
  }

  function showAlert(containerId, message, type) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML =
      '<div class="studio-alert studio-alert--' +
      (type === "success" ? "success" : "error") +
      '" role="alert">' +
      escapeHtml(message) +
      "</div>";
    el.hidden = false;
  }

  function skeletonDashboard() {
    return (
      '<div class="max-w-6xl mx-auto animate-pulse">' +
      '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">' +
      [1, 2, 3, 4]
        .map(function () {
          return '<div class="studio-skeleton h-24 rounded-2xl"></div>';
        })
        .join("") +
      "</div>" +
      '<div class="grid md:grid-cols-2 gap-6">' +
      '<div class="studio-skeleton h-48 rounded-2xl"></div>' +
      '<div class="studio-skeleton h-48 rounded-2xl"></div>' +
      "</div></div>"
    );
  }

  global.StudioUI = {
    api: api,
    apiBase: apiBase,
    escapeHtml: escapeHtml,
    toast: toast,
    getToken: getToken,
    setAuth: setAuth,
    clearAuth: clearAuth,
    tryRefresh: tryRefresh,
    setButtonLoading: setButtonLoading,
    showAlert: showAlert,
    skeletonDashboard: skeletonDashboard,
    formatApiError: formatApiError,
  };
})(window);

