/**
 * Production reference: API-driven UI with XSS-safe rendering.
 */
(function () {
  const UI = function () {
    return window.StudioUI;
  };
  const esc = function (v) {
    return UI() ? UI().escapeHtml(v) : String(v ?? "");
  };
  let analyticsRefreshTimer = null;

  function api(path, options) {
    return UI().api(path, options);
  }

  async function downloadVariantsPdf(briefId) {
    const ui = UI();
    try {
      var res = await fetch(ui.apiBase() + "/ad-briefs/" + briefId + "/variants/pdf/", {
        headers: { Authorization: "Bearer " + ui.getToken() },
      });
      if (res.status === 404) {
        ui.toast("Generate variants first, then download the PDF.", "error");
        return;
      }
      if (!res.ok) {
        var t = await res.text();
        ui.toast("PDF failed — " + (t.substring(0, 100) || res.status), "error");
        return;
      }
      var blob = await res.blob();
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "ad-variants-" + briefId + ".pdf";
      a.click();
      URL.revokeObjectURL(url);
      ui.toast("PDF downloaded", "success");
    } catch (e) {
      ui.toast(e.message || "Download failed", "error");
    }
  }

  function page() {
    const p = window.location.pathname;
    if (p.includes("create-ad")) return "create-ad";
    if (p.includes("notification")) return "notifications";
    if (p.includes("settings")) return "settings";
    if (p.includes("history")) return "history";
    if (p.includes("campaigns")) return "campaigns";
    if (p.includes("analytics") || p.includes("Dashboard.html")) return "analytics";
    if (p.includes("index") || p.endsWith("/")) return "dashboard";
    return "other";
  }

  function mainEl() {
    return document.getElementById("app-main") || document.getElementById("app-hydrate");
  }

  function setMain(html) {
    const m = mainEl();
    if (m) m.innerHTML = html;
  }

  function formatNum(n) {
    n = Number(n) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  }

  function formatMoney(v) {
    const n = parseFloat(v) || 0;
    return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function statCard(title, value, sub) {
    return (
      '<article class="studio-card p-5">' +
      '<p class="text-xs uppercase tracking-wide text-gray-400 font-semibold">' +
      esc(title) +
      "</p>" +
      '<p class="text-2xl font-bold text-gray-900 mt-1">' +
      esc(value) +
      "</p>" +
      (sub ? '<p class="text-sm text-gray-500 mt-1">' + esc(sub) + "</p>" : "") +
      "</article>"
    );
  }

  async function renderDashboard() {
    setMain(UI().skeletonDashboard());
    try {
      const me = await api("/auth/me/");
      const d = await api("/dashboard/");
      const a = d.analytics || {};
      const usageHtml =
        window.StudioProduct && me
          ? window.StudioProduct.usageBarHtml(
              me.generations_used || 0,
              me.generations_limit || 10,
              me.plan || "free"
            )
          : "";
      const briefs = d.recent_briefs || [];
      const campaigns = d.recent_campaigns || [];

      const briefList =
        briefs.length === 0
          ? '<p class="text-gray-500 text-sm">No ad briefs yet. <a href="/create-ad.html" class="text-blue-600 font-semibold hover:underline">Create your first ad</a></p>'
          : briefs
              .map(function (b) {
                return (
                  '<div class="border border-gray-100 rounded-xl p-4 mb-2 hover:border-blue-100 transition">' +
                  '<p class="font-semibold text-gray-900">' +
                  esc(b.product_service) +
                  "</p>" +
                  '<p class="text-sm text-gray-500">' +
                  esc(b.audience) +
                  " · " +
                  esc(b.platform) +
                  "</p></div>"
                );
              })
              .join("");

      setMain(
        '<div class="max-w-6xl mx-auto">' +
          usageHtml +
          '<header class="flex flex-wrap items-center justify-between gap-3 mb-6">' +
          '<div><h2 class="text-xl font-bold text-gray-900">Overview</h2>' +
          '<p class="text-sm text-gray-500">AI ad copy workspace — briefs, variants, export-ready copy</p></div>' +
          '<span class="inline-flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">' +
          '<span class="studio-live-dot"></span> API connected</span></header>' +
          '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">' +
          statCard("Campaigns", d.total_campaigns, (d.active_campaigns || 0) + " active") +
          statCard("Ad briefs", d.total_briefs, "") +
          statCard("Variants", d.total_variants, "") +
          statCard("CTR", (a.ctr || 0) + "%", formatNum(a.impressions || 0) + " impressions") +
          "</div>" +
          '<div class="grid md:grid-cols-2 gap-6">' +
          '<section class="studio-card p-5"><h2 class="font-bold mb-3">Recent briefs</h2>' +
          briefList +
          "</section>" +
          '<section class="studio-card p-5"><h2 class="font-bold mb-3">Recent campaigns</h2>' +
          (campaigns.length
            ? campaigns
                .map(function (c) {
                  return (
                    '<div class="border border-gray-100 rounded-xl p-4 mb-2">' +
                    '<p class="font-semibold">' +
                    esc(c.name) +
                    "</p>" +
                    '<p class="text-sm text-gray-500">' +
                    esc(c.status) +
                    " · " +
                    esc(c.platform) +
                    "</p></div>"
                  );
                })
                .join("")
            : '<p class="text-gray-500 text-sm">No campaigns yet. <a href="/campaigns.html" class="text-blue-600 font-semibold hover:underline">View campaigns</a></p>') +
          "</section></div></div>"
      );
    } catch (e) {
      setMain(
        '<div class="studio-alert studio-alert--error max-w-lg" role="alert">Could not load dashboard: ' +
          esc(e.message) +
          "</div>"
      );
    }
  }

  function campaignCard(c) {
    const statusColors = {
      active: "bg-green-100 text-green-700",
      paused: "bg-yellow-100 text-yellow-700",
      draft: "bg-gray-100 text-gray-600",
    };
    const badge = statusColors[c.status] || statusColors.draft;
    return (
      '<article class="studio-card p-5 flex flex-col" data-campaign-id="' +
      esc(c.id) +
      '">' +
      '<div class="flex justify-between items-start mb-3 gap-2">' +
      '<h3 class="font-bold text-gray-900">' +
      esc(c.name) +
      "</h3>" +
      '<span class="text-xs font-semibold px-2 py-1 rounded-full shrink-0 ' +
      badge +
      '">' +
      esc(c.status) +
      "</span></div>" +
      '<p class="text-sm text-gray-500 mb-4">' +
      esc(c.platform || "Multi-platform") +
      "</p>" +
      '<div class="grid grid-cols-3 gap-2 text-center text-sm mb-4">' +
      '<div><p class="text-gray-400 text-xs">Impressions</p><p class="font-semibold">' +
      formatNum(c.impressions || 0) +
      "</p></div>" +
      '<div><p class="text-gray-400 text-xs">Clicks</p><p class="font-semibold">' +
      formatNum(c.clicks || 0) +
      "</p></div>" +
      '<div><p class="text-gray-400 text-xs">Spend</p><p class="font-semibold">' +
      formatMoney(c.spend) +
      "</p></div></div>" +
      '<button type="button" class="studio-simulate-btn mt-auto w-full text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition studio-focus" data-id="' +
      esc(c.id) +
      '">Simulate live run</button></article>'
    );
  }

  async function renderCampaigns() {
    const grid = document.getElementById("campaigns-grid");
    const empty = document.getElementById("campaigns-empty");
    if (!grid) return;

    grid.innerHTML =
      '<p class="col-span-full text-gray-500 text-sm">Loading campaigns…</p>';
    try {
      const list = await api("/campaigns/");
      if (!list.length) {
        grid.innerHTML = "";
        if (empty) empty.classList.remove("hidden");
        wireCampaignActions();
        return;
      }
      if (empty) empty.classList.add("hidden");
      grid.innerHTML = list.map(campaignCard).join("");
      wireCampaignActions();
    } catch (e) {
      grid.innerHTML =
        '<p class="text-red-600 col-span-full studio-alert studio-alert--error">' +
        esc(e.message) +
        "</p>";
    }
  }

  function wireCampaignActions() {
    document.querySelectorAll(".studio-simulate-btn").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const id = btn.getAttribute("data-id");
        if (!id) return;
        UI().setButtonLoading(btn, true, "Running…");
        try {
          await api("/campaigns/" + id + "/simulate/", { method: "POST", body: "{}" });
          UI().toast("Campaign metrics updated", "success");
          await renderCampaigns();
        } catch (err) {
          UI().toast(err.message || "Simulate failed", "error");
        } finally {
          UI().setButtonLoading(btn, false);
        }
      });
    });

    const createBtn = document.getElementById("studio-create-campaign");
    if (createBtn && !createBtn.dataset.wired) {
      createBtn.dataset.wired = "1";
      createBtn.addEventListener("click", async function () {
        const name = prompt("Campaign name:");
        if (!name || !name.trim()) return;
        UI().setButtonLoading(createBtn, true);
        try {
          await api("/campaigns/", {
            method: "POST",
            body: JSON.stringify({ name: name.trim(), platform: "meta", status: "draft" }),
          });
          UI().toast("Campaign created", "success");
          await renderCampaigns();
        } catch (err) {
          UI().toast(err.message, "error");
        } finally {
          UI().setButtonLoading(createBtn, false);
        }
      });
    }
  }

  function barChart(container, values, labels) {
    if (!container) return;
    const max = Math.max.apply(null, values.concat([1]));
    if (!values.some(function (v) {
      return v > 0;
    })) {
      container.innerHTML =
        '<p class="text-gray-400 text-sm text-center py-8">No performance data yet. Run a campaign or use <strong>Simulate live run</strong> on the Campaigns page.</p>';
      return;
    }
    container.innerHTML = values
      .map(function (v, i) {
        const h = Math.max(8, Math.round((v / max) * 100));
        return (
          '<div class="flex-1 flex flex-col items-center gap-1 group">' +
          '<div class="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500 group-hover:from-blue-700" style="height:' +
          h +
          '%"></div>' +
          '<span class="text-[10px] text-gray-400 truncate max-w-full">' +
          esc(labels[i] || "") +
          "</span></div>"
        );
      })
      .join("");
  }

  function platformBars(container, campaigns) {
    if (!container) return;
    const byPlatform = {};
    campaigns.forEach(function (c) {
      const p = c.platform || "Other";
      byPlatform[p] = (byPlatform[p] || 0) + parseFloat(c.spend || 0);
    });
    const entries = Object.entries(byPlatform);
    if (!entries.length) {
      container.innerHTML = '<p class="text-gray-400 text-sm">No spend data yet.</p>';
      return;
    }
    const max = Math.max.apply(
      null,
      entries.map(function (e) {
        return e[1];
      }).concat([1])
    );
    container.innerHTML = entries
      .map(function (pair) {
        const name = pair[0];
        const spend = pair[1];
        const pct = Math.round((spend / max) * 100);
        return (
          '<div><div class="flex justify-between text-xs mb-1"><span>' +
          esc(name) +
          "</span><span>" +
          formatMoney(spend) +
          '</span></div><div class="h-2 bg-gray-100 rounded-full overflow-hidden"><div class="h-2 bg-blue-600 rounded-full transition-all duration-500" style="width:' +
          pct +
          '%"></div></div></div>'
        );
      })
      .join("");
  }

  async function renderAnalytics() {
    if (analyticsRefreshTimer) {
      clearInterval(analyticsRefreshTimer);
      analyticsRefreshTimer = null;
    }
    try {
      const data = await api("/analytics/");
      const spend = document.getElementById("stat-spend");
      const impressions = document.getElementById("stat-impressions");
      const clicks = document.getElementById("stat-clicks");
      const ctr = document.getElementById("stat-ctr");
      if (spend) spend.textContent = formatMoney(data.spend);
      if (impressions) impressions.textContent = formatNum(data.impressions || 0);
      if (clicks) clicks.textContent = formatNum(data.clicks || 0);
      if (ctr) ctr.textContent = (data.ctr || 0) + "%";

      const campaigns = data.campaigns || [];
      const impVals = campaigns.slice(0, 7).map(function (c) {
        return c.impressions || 0;
      });
      const labels = campaigns.slice(0, 7).map(function (c) {
        return (c.name || "").slice(0, 8);
      });
      if (!impVals.length) {
        barChart(
          document.getElementById("performance-chart"),
          [0, 0, 0, 0, 0, 0, 0],
          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        );
      } else {
        barChart(document.getElementById("performance-chart"), impVals, labels);
      }
      platformBars(document.getElementById("platform-chart"), campaigns);

      const activity = document.getElementById("analytics-activity");
      if (activity) {
        if (!campaigns.length) {
          activity.innerHTML =
            '<p class="text-gray-500 text-sm py-4 text-center">No activity yet. Create a campaign and simulate a live run.</p>';
        } else {
          activity.innerHTML = campaigns
            .slice(0, 5)
            .map(function (c) {
              return (
                '<div class="flex justify-between py-3 border-b border-gray-100 last:border-0">' +
                '<div><p class="font-semibold text-sm text-gray-900">' +
                esc(c.name) +
                '</p><p class="text-xs text-gray-500">' +
                esc(c.status) +
                " · " +
                esc(c.platform) +
                '</p></div><p class="text-sm text-gray-600">' +
                formatNum(c.impressions || 0) +
                " imp.</p></div>"
              );
            })
            .join("");
        }
      }

      const live = document.getElementById("analytics-live-badge");
      if (live) live.classList.remove("hidden");

      analyticsRefreshTimer = setInterval(function () {
        renderAnalytics();
      }, 8000);
    } catch (e) {
      const err = document.getElementById("analytics-error");
      if (err) {
        err.textContent = "Could not load analytics: " + e.message;
        err.hidden = false;
      }
    }
  }

  async function renderSettings() {
    try {
      const user = await api("/auth/me/");
      const billing = window.StudioProduct
        ? await window.StudioProduct.billingStatus().catch(function () {
            return null;
          })
        : null;
      const fullName =
        [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
      const nameInput = document.getElementById("settings-full-name");
      const emailInput = document.getElementById("settings-email");
      const preview = document.getElementById("profilePreview");
      if (nameInput) nameInput.value = fullName;
      if (emailInput) emailInput.value = user.email || "";
      if (preview) {
        preview.src =
          "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(fullName) +
          "&background=2563eb&color=fff&size=150";
        preview.alt = fullName;
      }
      const billingEl = document.getElementById("billing-panel");
      if (billingEl && billing) {
        const isPro = billing.plan === "pro";
        billingEl.innerHTML =
          '<div class="studio-card p-5 border border-violet-100">' +
          '<h3 class="font-bold text-gray-900 mb-1">Plan: ' +
          esc(isPro ? "Pro" : "Free") +
          "</h3>" +
          '<p class="text-sm text-gray-600 mb-4">' +
          (billing.generations_used || 0) +
          " / " +
          (billing.generations_limit || 10) +
          " AI generations used this month</p>" +
          (isPro
            ? '<button type="button" id="btn-billing-portal" class="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50">Manage subscription</button>'
            : '<button type="button" id="btn-billing-upgrade" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Upgrade to Pro</button>') +
          (billing.stripe_enabled
            ? ""
            : '<p class="text-xs text-gray-500 mt-3">Stripe not configured on this server (dev mode).</p>') +
          "</div>";
        const up = document.getElementById("btn-billing-upgrade");
        const portal = document.getElementById("btn-billing-portal");
        if (up)
          up.addEventListener("click", function () {
            window.StudioProduct.startCheckout().catch(function (e) {
              UI().toast(e.message, "error");
            });
          });
        if (portal)
          portal.addEventListener("click", function () {
            window.StudioProduct.openPortal().catch(function (e) {
              UI().toast(e.message, "error");
            });
          });
      }
      if (new URLSearchParams(window.location.search).get("billing") === "success") {
        UI().toast("Welcome to Pro!", "success");
      }
    } catch (e) {
      UI().toast("Could not load profile", "error");
    }
  }

  async function renderHistory() {
    setMain('<div class="max-w-4xl mx-auto p-6"><p class="text-gray-500">Loading history…</p></div>');
    try {
      const raw = await api("/generations/");
      const rows = Array.isArray(raw) ? raw : raw.results || [];
      if (!rows.length) {
        setMain(
          '<div class="max-w-4xl mx-auto">' +
            '<h1 class="text-2xl font-bold mb-2">Generation history</h1>' +
            '<p class="text-gray-500 mb-6">Every AI run you save appears here.</p>' +
            '<div class="studio-card p-8 text-center text-gray-500">No generations yet. <a href="/create-ad.html" class="text-blue-600 font-semibold">Create an ad</a></div></div>'
        );
        return;
      }
      setMain(
        '<div class="max-w-4xl mx-auto">' +
          '<h1 class="text-2xl font-bold mb-2">Generation history</h1>' +
          '<p class="text-gray-500 mb-6">Your saved AI outputs</p>' +
          rows
            .map(function (r) {
              const when = new Date(r.created_at).toLocaleString();
              const label = r.source_type === "ad_brief" ? "Ad brief" : "Project";
              return (
                '<article class="studio-card p-5 mb-4">' +
                '<p class="text-xs text-gray-400">' +
                esc(when) +
                " · " +
                esc(label) +
                " · " +
                esc(r.variant_count) +
                " variant(s)</p>" +
                '<p class="text-sm font-medium text-gray-800 mt-2">' +
                esc(JSON.stringify(r.input_data).slice(0, 120)) +
                "…</p></article>"
              );
            })
            .join("") +
          "</div>"
      );
    } catch (e) {
      setMain(
        '<div class="max-w-4xl mx-auto p-6"><p class="text-red-600">' + esc(e.message) + "</p></div>"
      );
    }
  }

  async function renderCreateAd() {
    const main = mainEl() || document.querySelector("main.flex-1");
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
    const handler = async function (e) {
      e.preventDefault();
      const btn = form.querySelector('input[type="submit"], button[type="submit"]');
      UI().setButtonLoading(btn, true, "Generating…");
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
        const variants = await api("/ad-briefs/" + brief.id + "/generate/", {
          method: "POST",
        });
        if (!panel) return;
        if (!variants?.length) {
          panel.innerHTML =
            '<div class="studio-card p-8 text-center text-gray-500">No variants returned. Check instructor API configuration.</div>';
          return;
        }
        panel.innerHTML =
          '<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">' +
          '<h2 class="font-bold text-lg text-gray-900">Generated variants</h2>' +
          '<button type="button" id="btn-download-variants-pdf" class="text-sm font-semibold text-blue-700 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 whitespace-nowrap">' +
          "Download PDF (all variants)</button></div>" +
          variants
            .map(function (v) {
              return (
                '<article class="studio-card p-5 mb-4">' +
                '<h3 class="font-bold text-lg text-gray-900">' +
                esc(v.headline) +
                "</h3>" +
                '<p class="text-gray-600 mt-2 whitespace-pre-wrap">' +
                esc(v.body) +
                "</p>" +
                (v.cta
                  ? '<p class="text-blue-600 font-semibold mt-3">' + esc(v.cta) + "</p>"
                  : "") +
                "</article>"
              );
            })
            .join("");
        var pdfBtn = document.getElementById("btn-download-variants-pdf");
        if (pdfBtn)
          pdfBtn.addEventListener("click", function () {
            downloadVariantsPdf(brief.id);
          });
        UI().toast("Ad variants generated", "success");
        await renderImageSection(brief.id, document.getElementById("prod-service")?.value);
      } catch (err) {
        if (err.status === 402) {
          UI().toast(err.message || "Quota exceeded — upgrade to Pro", "error");
          showUpgradeBanner();
        } else {
          UI().toast(err.message || "Generate failed", "error");
        }
      } finally {
        UI().setButtonLoading(btn, false);
      }
    };
    form.addEventListener("submit", handler);
    form.querySelectorAll('input[type="submit"]').forEach(function (b) {
      b.addEventListener("click", handler);
    });
  }

  function timeAgo(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return days + " days ago";
  }

  function notificationStyle(title, message) {
    const t = (title + " " + message).toLowerCase();
    if (/ctr|performance|jump|outperform/.test(t))
      return { bg: "bg-green-50", icon: "fa-arrow-trend-up", color: "text-green-500" };
    if (/variant|generated|ad |campaign|brief|running/.test(t))
      return { bg: "bg-blue-50", icon: "fa-bullhorn", color: "text-blue-500" };
    if (/invoice|billing|payment/.test(t))
      return { bg: "bg-yellow-50", icon: "fa-folder-closed", color: "text-yellow-500" };
    if (/joined|invite|team/.test(t))
      return { bg: "bg-gray-100", icon: "fa-user-plus", color: "text-gray-600" };
    if (/expired|error|failed/.test(t))
      return { bg: "bg-red-50", icon: "fa-triangle-exclamation", color: "text-red-500" };
    return { bg: "bg-blue-50", icon: "fa-bell", color: "text-blue-500" };
  }

  function notificationRow(n, isLast) {
    const style = notificationStyle(n.title, n.message);
    const unread = !n.is_read;
    const border = isLast ? "" : "";
    const dot = unread ? '<span class="rounded-full bg-blue-500 h-2 w-2 shrink-0"></span>' : "";
    return (
      '<div class="flex justify-between gap-4 p-5 md:p-6' +
      (unread ? "" : " opacity-80") +
      (border ? "" : "") +
      '">' +
      '<div class="flex gap-4 min-w-0">' +
      '<div class="w-12 h-12 md:w-14 md:h-14 ' +
      style.bg +
      ' rounded-2xl flex items-center justify-center shrink-0"><i class="fa-solid ' +
      style.icon +
      " " +
      style.color +
      ' text-lg"></i></div><div class="min-w-0"><div class="flex items-center gap-2 flex-wrap"><h3 class="text-sm md:text-base font-bold text-gray-900">' +
      esc(n.title) +
      "</h3>" +
      dot +
      '</div><p class="text-gray-500 text-xs md:text-sm mt-1 leading-relaxed">' +
      esc(n.message) +
      '</p></div></div><p class="text-gray-400 text-xs whitespace-nowrap shrink-0">' +
      esc(timeAgo(n.created_at)) +
      "</p></div>"
    );
  }

  async function renderNotifications() {
    const listEl = document.getElementById("notifications-list");
    if (!listEl) return;

    try {
      const list = await api("/notifications/");
      const unread = list.filter(function (n) {
        return !n.is_read;
      }).length;

      const badge = document.getElementById("notifications-new-badge");
      const tabBadge = document.getElementById("notifications-unread-tab");
      if (badge) {
        if (unread > 0) {
          badge.textContent = unread + " new";
          badge.classList.remove("hidden");
        } else badge.classList.add("hidden");
      }
      if (tabBadge) {
        if (unread > 0) {
          tabBadge.textContent = String(unread);
          tabBadge.classList.remove("hidden");
        } else tabBadge.classList.add("hidden");
      }

      if (!list.length) {
        listEl.innerHTML =
          '<p class="text-gray-500 text-center py-12 text-sm">No notifications yet. Generate an ad or run a campaign to see updates.</p>';
        return;
      }

      listEl.innerHTML = list
        .map(function (n, i) {
          return notificationRow(n, i === list.length - 1);
        })
        .join("");
    } catch (e) {
      listEl.innerHTML =
        '<p class="text-red-600 text-center py-8 text-sm">' + esc(e.message) + "</p>";
    }
  }

  function showUpgradeBanner() {
    var main = mainEl();
    if (!main || document.getElementById("quota-banner")) return;
    var b = document.createElement("div");
    b.id = "quota-banner";
    b.className = "mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm";
    b.innerHTML = 'Monthly quota reached. <a href="/pricing/" class="font-semibold underline">Upgrade to Pro</a> for more copy and images.';
    main.insertBefore(b, main.firstChild);
  }

  async function pollImageJob(jobId, container) {
    for (var i = 0; i < 40; i++) {
      await new Promise(function (r) {
        setTimeout(r, 3000);
      });
      var st = await api("/ads/image-status/" + jobId + "/");
      if (st.status === "done" && st.image_url) {
        container.innerHTML =
          '<div class="studio-card p-4"><h3 class="font-bold mb-3">Generated image</h3>' +
          '<img src="' +
          esc(st.image_url) +
          '" alt="Ad" class="rounded-lg max-w-full border" />' +
          '<a href="' +
          esc(st.image_url) +
          '" download class="inline-block mt-3 text-sm font-semibold text-blue-600">Download PNG</a></div>';
        UI().toast("Image ready", "success");
        return;
      }
      if (st.status === "failed") {
        container.innerHTML =
          '<p class="text-red-600 text-sm">' + esc(st.error || "Image generation failed") + "</p>";
        return;
      }
    }
    container.innerHTML = '<p class="text-gray-500 text-sm">Still processing… refresh shortly.</p>';
  }

  async function renderImageSection(briefId, productName) {
    var main = mainEl();
    if (!main) return;
    var box = document.getElementById("image-panel");
    if (!box) {
      box = document.createElement("div");
      box.id = "image-panel";
      box.className = "mt-8 max-w-2xl";
      main.appendChild(box);
    }
    box.innerHTML =
      '<div class="studio-card p-5"><h2 class="font-bold text-lg mb-3">Ad image (Grok)</h2>' +
      '<label class="block text-sm font-medium mb-1">Format</label>' +
      '<select id="img-format" class="border rounded-lg px-3 py-2 text-sm mb-3 w-full">' +
      '<option value="square">Square 1:1</option><option value="story">Story 9:16</option>' +
      '<option value="banner">Banner 16:9</option></select>' +
      '<button type="button" id="btn-gen-image" class="bg-violet-600 text-white px-4 py-2 rounded-lg font-semibold text-sm">Generate image</button>' +
      '<div id="image-result" class="mt-4"></div></div>';

    var btn = document.getElementById("btn-gen-image");
    var result = document.getElementById("image-result");
    btn.addEventListener("click", async function () {
      UI().setButtonLoading(btn, true, "Generating…");
      result.innerHTML = '<div class="animate-pulse h-48 bg-gray-100 rounded-lg"></div>';
      try {
        var res = await api("/ads/generate-image/", {
          method: "POST",
          body: JSON.stringify({
            brief_id: briefId,
            product_name: productName,
            platform_format: document.getElementById("img-format").value,
            style: "modern marketing",
          }),
        });
        if (res.status === "done" && res.image_url) {
          result.innerHTML =
            '<img src="' + esc(res.image_url) + '" class="rounded-lg max-w-full border" alt="Ad" />';
          UI().toast("Image ready", "success");
          return;
        }
        await pollImageJob(res.job_id, result);
      } catch (err) {
        if (err.status === 402) showUpgradeBanner();
        result.innerHTML = '<p class="text-red-600 text-sm">' + esc(err.message) + "</p>";
      } finally {
        UI().setButtonLoading(btn, false);
      }
    });
  }

  async function init() {
    if (!UI() || !UI().getToken()) return;
    const p = page();
    if (p === "dashboard") await renderDashboard();
    else if (p === "create-ad") await renderCreateAd();
    else if (p === "notifications") await renderNotifications();
    else if (p === "settings") await renderSettings();
    else if (p === "campaigns") await renderCampaigns();
    else if (p === "analytics") await renderAnalytics();
    else if (p === "history") await renderHistory();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
