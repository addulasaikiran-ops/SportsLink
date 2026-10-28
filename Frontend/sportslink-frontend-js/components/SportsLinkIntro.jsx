"use client";

import { useEffect, useRef } from "react";
import "./SportsLinkIntro.css";

export default function SportsLinkIntro() {
  const overlayRef = useRef(null);
  const markRef = useRef(null);
  const skipRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const overlay = overlayRef.current;
    const mark = markRef.current;
    if (!overlay || !mark || root.dataset.intro !== "play") return;

    let cancelled = false;
    let finished = false;
    const animations = [];
    const content = document.querySelector(".public-site");
    const headerLogo = document.querySelector(".public-header .public-brand .sportslink-logo");
    const hero = document.querySelector(".sl-landing .landing-hero");
    const heroTargets = hero ? [
      hero.querySelector(".public-eyebrow"),
      ...Array.from(hero.querySelectorAll(".landing-hero h1, .landing-lede, .landing-actions, .landing-proof")),
      ...Array.from(hero.querySelectorAll(".sl-visual .visual-main-card, .sl-visual .float-card"))
    ].filter(Boolean) : [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const lowPower = (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) || Boolean(connection?.saveData);
    const forced = new URLSearchParams(window.location.search).get("intro") === "1";
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const previousFocus = document.activeElement;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    if (content) {
      content.setAttribute("aria-hidden", "true");
      content.inert = true;
    }
    root.classList.add("sl-intro-lock");
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = scrollbar + "px";
    if (headerLogo) headerLogo.style.visibility = "hidden";

    const animate = (element, keyframes, options) => {
      if (!element) return null;
      const animation = element.animate(keyframes, { fill: "both", ...options });
      animations.push(animation);
      return animation;
    };
    const cleanup = () => {
      if (finished) return;
      finished = true;
      animations.forEach((animation) => { try { animation.cancel(); } catch {} });
      overlay.classList.add("sl-intro-is-exiting");
      window.setTimeout(() => {
        if (cancelled) return;
        root.dataset.intro = "skip";
        root.classList.remove("sl-intro-lock");
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPadding;
        if (headerLogo) headerLogo.style.visibility = "";
        if (content) {
          content.removeAttribute("aria-hidden");
          content.inert = false;
        }
        overlay.hidden = true;
        if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus({ preventScroll: true });
      }, reduced ? 250 : 180);
    };
    const failSafe = window.setTimeout(cleanup, 4000);
    const heroImage = new Image();
    heroImage.src = "/Cinematic%20Sports%20Stadium%20Silhouettes%20at%20Dusk.png";
    const imageReady = Promise.race([
      typeof heroImage.decode === "function" ? heroImage.decode().catch(() => {}) : Promise.resolve(),
      new Promise((resolve) => window.setTimeout(resolve, 1200))
    ]);

    const play = async () => {
      await imageReady;
      if (cancelled) return;
      if (reduced) {
        animate(mark, [{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
        window.setTimeout(cleanup, 600);
        return;
      }

      animate(overlay.querySelector(".sl-intro-link-line"), [
        { transform: "translateX(-50%) scaleX(0)", opacity: 0.4 },
        { transform: "translateX(-50%) scaleX(1)", opacity: 1 }
      ], { duration: 680, delay: 120, easing: "cubic-bezier(.16,1,.3,1)" });
      animate(overlay.querySelectorAll(".sl-intro-frame"), [
        { strokeDashoffset: 500, opacity: 0.5 },
        { strokeDashoffset: 0, opacity: 1 }
      ], { duration: 760, delay: 100, easing: "cubic-bezier(.16,1,.3,1)" });
      animate(mark, [
        { opacity: 0, transform: "translateY(10px) scale(.985)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }
      ], { duration: 480, delay: 420, easing: "cubic-bezier(.16,1,.3,1)" });
      animate(overlay.querySelector(".sl-intro-sweep"), [
        { opacity: 0, transform: "translateX(-120%)" },
        { opacity: .55, offset: .3, transform: "translateX(-15%)" },
        { opacity: 0, transform: "translateX(120%)" }
      ], { duration: 520, delay: 1000, easing: "ease-in-out" });

      await new Promise((resolve) => window.setTimeout(resolve, 1650));
      if (cancelled || finished) return;
      if (headerLogo) {
        const from = mark.getBoundingClientRect();
        const to = headerLogo.getBoundingClientRect();
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const sx = Math.max(.04, to.width / from.width);
        const sy = Math.max(.04, to.height / from.height);
        animate(mark, [
          { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
          { transform: `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`, opacity: .96 }
        ], { duration: 520, easing: "cubic-bezier(.76,0,.24,1)" });
      }
      animate(overlay, [
        { clipPath: "inset(0 0 0 0)", opacity: 1 },
        { clipPath: "inset(0 0 100% 0)", opacity: 1, offset: .78 },
        { clipPath: "inset(0 0 100% 0)", opacity: 0 }
      ], { duration: 650, delay: 80, easing: "cubic-bezier(.76,0,.24,1)" });
      heroTargets.forEach((element, index) => {
        animate(element, [
          { opacity: 0, transform: "translateY(18px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], { duration: 360, delay: 100 + index * 65, easing: "cubic-bezier(.16,1,.3,1)" });
      });
      window.setTimeout(cleanup, 850);
    };

    const onKey = (event) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        if (event.target === skipRef.current && event.key !== "Escape") return;
        event.preventDefault();
        if (!finished) {
          // Skip immediately to the settled homepage state; do not leave the intro mid-animation.
          animations.forEach((animation) => { try { animation.finish(); } catch {} });
          cleanup();
        }
      }
    };
    const onPointer = (event) => {
      if (event.target === skipRef.current || finished) return;
      if (performance.now() > (window.__slIntroStartedAt || 0) + 600) {
        animations.forEach((animation) => { try { animation.finish(); } catch {} });
        cleanup();
      }
    };
    window.__slIntroStartedAt = performance.now();
    window.addEventListener("keydown", onKey);
    overlay.addEventListener("pointerdown", onPointer);
    skipRef.current?.addEventListener("click", cleanup);
    play();
    return () => {
      cancelled = true;
      window.clearTimeout(failSafe);
      window.removeEventListener("keydown", onKey);
      overlay.removeEventListener("pointerdown", onPointer);
      skipRef.current?.removeEventListener("click", cleanup);
      animations.forEach((animation) => { try { animation.cancel(); } catch {} });
      root.classList.remove("sl-intro-lock");
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (headerLogo) headerLogo.style.visibility = "";
      if (content) {
        content.removeAttribute("aria-hidden");
        content.inert = false;
      }
    };
  }, []);

  return (
    <div id="sportslink-intro-overlay" ref={overlayRef} className="sl-intro-overlay" role="status" aria-label="SPORTSLINK brand introduction">
      <div className="sl-intro-stadium" aria-hidden="true" />
      <svg className="sl-intro-line-art" viewBox="0 0 1000 220" aria-hidden="true">
        <defs><linearGradient id="sl-intro-link-gradient"><stop stopColor="#2F6BFF"/><stop offset=".55" stopColor="#8FB4FF"/><stop offset="1" stopColor="#70D522"/></linearGradient></defs>
        <path className="sl-intro-link-line" d="M55 110H945" fill="none" stroke="url(#sl-intro-link-gradient)" strokeWidth="4" strokeLinecap="round"/>
        <rect className="sl-intro-frame" x="15" y="24" width="145" height="172" rx="25" fill="#07152D" stroke="#4F8CFF" strokeWidth="8" strokeDasharray="500" strokeDashoffset="500"/>
        <rect className="sl-intro-frame" x="840" y="24" width="145" height="172" rx="25" fill="#071A24" stroke="#70D522" strokeWidth="8" strokeDasharray="500" strokeDashoffset="500"/>
      </svg>
      <div className="sl-intro-logo-wrap" ref={markRef}>
        <img src="/sportslink-intro-mark.svg" width="1120" height="240" alt="SPORTSLINK" fetchPriority="high" />
      </div>
      <div className="sl-intro-sweep" aria-hidden="true" />
      <button ref={skipRef} type="button" className="sl-intro-skip" aria-label="Skip SPORTSLINK introduction">Skip <span aria-hidden="true">↗</span></button>
    </div>
  );
}
