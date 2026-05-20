/**
 * Product SaaS: billing, usage, and upgrade flows.
 */
(function (global) {
  async function billingStatus() {
    return global.StudioUI.api("/auth/billing/status/");
  }

  async function startCheckout() {
    const res = await global.StudioUI.api("/auth/billing/checkout/", { method: "POST" });
    if (res.url) window.location.href = res.url;
    return res;
  }

  async function openPortal() {
    const res = await global.StudioUI.api("/auth/billing/portal/", { method: "POST" });
    if (res.url) window.location.href = res.url;
    return res;
  }

  function usageBarHtml(used, limit, plan) {
    var pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    var planLabel = plan === "pro" ? "Pro" : "Free";
    var badgeClass =
      plan === "pro" ? "bg-violet-100 text-violet-800" : "bg-gray-100 text-gray-700";
    var upgrade =
      pct >= 90 && plan !== "pro"
        ? '<p class="text-xs text-amber-700 mt-2"><a href="/pricing.html" class="font-semibold underline">Upgrade to Pro</a> for more generations.</p>'
        : "";
    return (
      '<div class="studio-card p-4 mb-6">' +
      '<div class="flex flex-wrap items-center justify-between gap-2 mb-2">' +
      '<div><span class="text-sm font-semibold text-gray-900">AI generations</span> ' +
      '<span class="text-xs font-medium px-2 py-0.5 rounded-full ' +
      badgeClass +
      '">' +
      planLabel +
      "</span></div>" +
      '<span class="text-sm text-gray-600">' +
      used +
      " / " +
      limit +
      " this month</span></div>" +
      '<div class="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">' +
      '<div class="h-full bg-blue-600 rounded-full transition-all" style="width:' +
      pct +
      '%"></div></div>' +
      upgrade +
      "</div>"
    );
  }

  global.StudioProduct = {
    billingStatus: billingStatus,
    startCheckout: startCheckout,
    openPortal: openPortal,
    usageBarHtml: usageBarHtml,
  };
})();
