/**
 * Loads real data from the API into each page.
 */
(function () {
  const API = () => window.API_BASE || "/api";

  function token() {
    return localStorage.getItem("access_token");
  }

  function headers() {
    const h = { "Content-Type": "application/json" };
    if (token()) h.Authorization = "Bearer " + token();
    return h;
  }

  async function api(path, options = {}) {
    const res = await fetch(API() + path, {
      ...options,
      headers: { ...headers(), ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || res.statusText);
    return data;
  }

  function page() {
    const p = window.location.pathname;
    if (p.includes("create-ad")) return "create-ad";
    if (p.includes("notification")) return "notifications";
    if (p.includes("settings")) return "settings";
    if (p.includes("index") || p.endsWith("/")) return "dashboard";
    return "other";
  }

  function mainEl() {
    return document.querySelector("main");
  }

  function setMain(html) {
    const m = mainEl();
    if (m) m.innerHTML = html;
  }

  function statCard(title, value, sub) {
    return `<div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <p class="text-xs uppercase tracking-wide text-gray-400 font-semibold">${title}</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">${value}</p>
      ${sub ? `<p class="text-sm text-gray-500 mt-1">${sub}</p>` : ""}
    </div>`;
  }

  async function renderDashboard() {
    setMain('<p class="text-gray-500">Loading dashboard...</p>');
    try {
      const d = await api("/dashboard/");
      const a = d.analytics || {};
      const briefs = d.recent_briefs || [];
      const campaigns = d.recent_campaigns || [];

      const briefList =
        briefs.length === 0
          ? `<p class="text-gray-500 text-sm">No ad briefs yet. <a href="/create-ad.html" class="text-blue-600 font-semibold">Create your first ad</a></p>`
          : briefs
              .map(
                (b) => `<div class="border border-gray-100 rounded-xl p-4 mb-2">
              <p class="font-semibold">${b.product_service}</p>
              <p class="text-sm text-gray-500">${b.audience} · ${b.platform}</p>
            </div>`
              )
              .join("");

      setMain(`
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          ${statCard("Campaigns", d.total_campaigns, (d.active_campaigns || 0) + " active")}
          ${statCard("Ad briefs", d.total_briefs, "")}
          ${statCard("Variants", d.total_variants, "")}
          ${statCard("CTR", (a.ctr || 0) + "%", (a.impressions || 0) + " impressions")}
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 class="font-bold mb-3">Recent briefs</h2>${briefList}
          </div>
          <div class="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 class="font-bold mb-3">Recent campaigns</h2>
            ${
              campaigns.length
                ? campaigns
                    .map(
                      (c) => `<div class="border border-gray-100 rounded-xl p-4 mb-2">
                <p class="font-semibold">${c.name}</p>
                <p class="text-sm text-gray-500">${c.status} · ${c.platform}</p>
              </div>`
                    )
                    .join("")
                : '<p class="text-gray-500 text-sm">No campaigns yet.</p>'
            }
          </div>
        </div>
      `);
    } catch (e) {
      setMain(`<p class="text-red-600">Could not load dashboard: ${e.message}</p>`);
    }
  }

  async function renderCreateAd() {
    const main = mainEl();
    if (!main) return;

    let panel = document.getElementById("variants-panel");
    if (!panel) {
      const cols = main.querySelector(".grid");
      if (cols && cols.children.length > 1) {
        panel = cols.children[1];
        panel.id = "variants-panel";
      }
    }

    const form = main.querySelector("form");
    if (!form) return;

    form.removeAttribute("action");
    const handler = async (e) => {
      e.preventDefault();
      try {
        const brief = await api("/ad-briefs/", {
          method: "POST",
          body: JSON.stringify({
            product_service: document.getElementById("prod-service")?.value,
            audience: document.getElementById("audience")?.value,
            tone: document.getElementById("tone")?.value,
            platform: document.getElementById("platform")?.value,
            key_message: document.getElementById("key-message")?.value || "",
          }),
        });
        const variants = await api(`/ad-briefs/${brief.id}/generate/`, { method: "POST" });
        if (!panel) return;
        if (!variants?.length) {
          panel.innerHTML =
            '<div class="bg-white p-8 rounded-2xl text-center text-gray-500">No variants returned. Set GROQ_API_KEY in backend .env</div>';
          return;
        }
        panel.innerHTML =
          '<h1 class="font-bold mb-5">Generated variants</h1>' +
          variants
            .map(
              (v) => `<div class="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <h3 class="font-bold text-lg">${v.headline}</h3>
            <p class="text-gray-600 mt-2 whitespace-pre-wrap">${v.body}</p>
            ${v.cta ? `<p class="text-blue-600 font-semibold mt-3">${v.cta}</p>` : ""}
          </div>`
            )
            .join("");
      } catch (err) {
        alert("Generate failed: " + err.message);
      }
    };
    form.addEventListener("submit", handler);
    form.querySelectorAll('input[type="submit"]').forEach((b) => b.addEventListener("click", handler));
  }

  async function renderNotifications() {
    setMain('<p class="text-gray-500">Loading notifications...</p>');
    try {
      const list = await api("/notifications/");
      if (!list.length) {
        setMain('<div class="bg-white rounded-2xl p-8 text-center text-gray-500">No notifications yet.</div>');
        return;
      }
      setMain(
        list
          .map(
            (n) => `<div class="bg-white rounded-xl border p-4 mb-3 ${n.is_read ? "opacity-60" : ""}">
          <p class="font-semibold">${n.title}</p>
          <p class="text-sm text-gray-600">${n.message}</p>
        </div>`
          )
          .join("")
      );
    } catch (e) {
      setMain(`<p class="text-red-600">${e.message}</p>`);
    }
  }

  async function renderSettings() {
    setMain('<p class="text-gray-500">Loading profile...</p>');
    try {
      const user = await api("/auth/me/");
      setMain(`
        <div class="bg-white rounded-2xl border p-6 max-w-lg">
          <h2 class="text-xl font-bold mb-4">Account</h2>
          <p><span class="text-gray-500">Name:</span> ${user.first_name || ""} ${user.last_name || ""}</p>
          <p class="mt-2"><span class="text-gray-500">Email:</span> ${user.email}</p>
          <p class="mt-2"><span class="text-gray-500">Username:</span> ${user.username}</p>
        </div>
      `);
    } catch (e) {
      setMain(`<p class="text-red-600">${e.message}</p>`);
    }
  }

  async function init() {
    if (!token()) return;
    const p = page();
    if (p === "dashboard") await renderDashboard();
    else if (p === "create-ad") await renderCreateAd();
    else if (p === "notifications") await renderNotifications();
    else if (p === "settings") await renderSettings();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
