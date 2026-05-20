/**
 * Auth gate + login/register API wiring.
 */
(function () {
  const API_BASE = window.API_BASE || "/api";
  const PUBLIC_PATHS = ["/signin.html", "/signup.html", "/signin", "/signup"];

  function path() {
    let p = window.location.pathname.replace(/\/+$/, "") || "/";
    return p;
  }

  function isAuthPage() {
    const p = path();
    return p === "/" || PUBLIC_PATHS.some((x) => p.endsWith(x.replace(".html", "")) || p.endsWith(x));
  }

  function isAppPage() {
    const p = path();
    return p.endsWith("index.html") || p.includes("create-ad") || p.includes("notification") ||
      p.includes("settings") || p.endsWith("Dashboard.html");
  }

  function clearAuth() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  function goSignin() {
    if (!path().endsWith("signin.html") && path() !== "/signin") {
      window.location.replace("/signin.html");
    }
  }

  function goDashboard() {
    window.location.replace("/index.html");
  }

  async function validateToken() {
    const t = localStorage.getItem("access_token");
    if (!t) return false;
    try {
      const res = await fetch(API_BASE + "/auth/me/", {
        headers: { Authorization: "Bearer " + t },
      });
      if (!res.ok) {
        clearAuth();
        return false;
      }
      return true;
    } catch {
      clearAuth();
      return false;
    }
  }

  async function guard() {
    const loggedIn = await validateToken();

    if (loggedIn) {
      if (isAuthPage()) goDashboard();
      return;
    }

    clearAuth();
    if (isAppPage() || (path() === "/" && document.title.includes("AI Ads Studio") && !document.getElementById("login-email"))) {
      goSignin();
    }
  }

  async function apiPost(url, body) {
    const res = await fetch(API_BASE + url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.detail || (typeof data === "object" ? JSON.stringify(data) : res.statusText);
      throw new Error(msg);
    }
    return data;
  }

  function wireLogin() {
    const email = document.getElementById("login-email");
    const password = document.getElementById("login-pw");
    if (!email || !password) return;

    const btn = document.querySelector("#login button.bg-blue-accent");
    if (!btn) return;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const data = await apiPost("/auth/login/", {
          email: email.value.trim(),
          password: password.value,
        });
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        goDashboard();
      } catch (err) {
        alert("Sign in failed: " + err.message);
      }
    });
  }

  function wireSignupInSignin() {
    const signupBtn = document.querySelector("#signup button.bg-blue-accent");
    const email = document.getElementById("signup-email");
    const password = document.getElementById("signup-pw");
    const name = document.getElementById("signup-name");
    if (!signupBtn || !email) return;

    signupBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await apiPost("/auth/register/", {
          email: email.value.trim(),
          work_email: email.value.trim(),
          full_name: name?.value?.trim() || "",
          password: password.value,
          password_confirm: password.value,
        });
        const login = await apiPost("/auth/login/", {
          email: email.value.trim(),
          password: password.value,
        });
        localStorage.setItem("access_token", login.access);
        localStorage.setItem("refresh_token", login.refresh);
        goDashboard();
      } catch (err) {
        alert("Registration failed: " + err.message);
      }
    });
  }

  function wireSignupPage() {
    if (!path().endsWith("signup.html")) return;
    const form = document.querySelector("form");
    if (!form) return;

    const handler = async (e) => {
      e.preventDefault();
      const inputs = form.querySelectorAll("input");
      let emailInput, passInput, nameInput;
      inputs.forEach((inp) => {
        if (inp.type === "email") emailInput = inp;
        else if (inp.type === "password" || (inp.type === "text" && inp.placeholder?.toLowerCase().includes("8 character"))) passInput = inp;
        else if (inp.type === "text") nameInput = inp;
      });
      if (!emailInput?.value || !passInput?.value) {
        alert("Email and password required.");
        return;
      }
      try {
        await apiPost("/auth/register/", {
          email: emailInput.value.trim(),
          work_email: emailInput.value.trim(),
          full_name: nameInput?.value?.trim() || "",
          password: passInput.value,
          password_confirm: passInput.value,
        });
        const login = await apiPost("/auth/login/", {
          email: emailInput.value.trim(),
          password: passInput.value,
        });
        localStorage.setItem("access_token", login.access);
        localStorage.setItem("refresh_token", login.refresh);
        goDashboard();
      } catch (err) {
        alert("Registration failed: " + err.message);
      }
    };
    form.addEventListener("submit", handler);
    form.querySelectorAll("button").forEach((b) => b.addEventListener("click", handler));
  }

  guard().then(() => {
    wireLogin();
    wireSignupInSignin();
    wireSignupPage();
  });
})();
