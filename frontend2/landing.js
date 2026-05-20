/**
 * Hero wave motion + scroll-reveal color bands (fade in → bold → fade out).
 */
(function () {
  const ambient = document.querySelector(".landing-ambient");
  const hero = document.querySelector(".landing-hero");
  const flowSections = document.querySelectorAll(".landing-flow-section");
  if (!ambient) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let scrollTarget = 0;
  let scrollCurrent = 0;
  let scrollRaf = 0;
  let timeRaf = 0;
  const start = performance.now();

  function smoothstep(t) {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }

  function measureScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollTarget = Math.min(1, Math.max(0, window.scrollY / max));
  }

  function updateFlowSections() {
    const vh = window.innerHeight;
    const mid = vh * 0.5;
    const range = vh * 0.72;

    flowSections.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height * 0.42;
      const dist = Math.abs(center - mid);
      let reveal = 1 - dist / range;
      reveal = smoothstep(reveal);

      el.style.setProperty("--reveal", reveal.toFixed(3));
    });
  }

  function tickScroll() {
    scrollCurrent += (scrollTarget - scrollCurrent) * 0.08;
    if (Math.abs(scrollTarget - scrollCurrent) < 0.0006) scrollCurrent = scrollTarget;
    ambient.style.setProperty("--scroll", scrollCurrent.toFixed(4));
    updateFlowSections();
    if (Math.abs(scrollTarget - scrollCurrent) > 0.0006) {
      scrollRaf = requestAnimationFrame(tickScroll);
    } else {
      scrollRaf = 0;
    }
  }

  function onScroll() {
    measureScroll();
    updateFlowSections();
    if (!scrollRaf) scrollRaf = requestAnimationFrame(tickScroll);
  }

  function tickTime(now) {
    if (!reduced && hero) {
      const t = (now - start) * 0.001;
      const phase = (Math.sin(t * 0.85) + 1) * 0.5;
      const phase2 = (Math.sin(t * 0.55 + 1.2) + 1) * 0.5;
      hero.style.setProperty("--wave-a", phase.toFixed(4));
      hero.style.setProperty("--wave-b", phase2.toFixed(4));
    }
    if (!scrollRaf) updateFlowSections();
    timeRaf = requestAnimationFrame(tickTime);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  measureScroll();
  ambient.style.setProperty("--scroll", "0");
  updateFlowSections();
  if (!reduced) timeRaf = requestAnimationFrame(tickTime);
})();
