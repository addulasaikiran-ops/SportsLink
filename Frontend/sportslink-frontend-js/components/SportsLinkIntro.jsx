"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import "./SportsLinkIntro.css";

export default function SportsLinkIntro() {
  const overlayRef = useRef(null);
  const markRef = useRef(null);
  const skipRef = useRef(null);

  useGSAP(() => {
    const root = document.documentElement;
    const overlay = overlayRef.current;
    const mark = markRef.current;
    if (!overlay || !mark || root.dataset.intro !== "play") return;

    let finished = false;
    let timeline = null;
    let exitTween = null;
    let decodeTimer = 0;
    let failSafe = 0;
    let skipTapTimer = 0;
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
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const previousFocus = document.activeElement;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const previousHeaderVisibility = headerLogo?.style.visibility ?? "";

    if (content) {
      content.setAttribute("aria-hidden", "true");
      content.inert = true;
    }
    root.classList.add("sl-intro-lock");
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = scrollbar + "px";
    if (headerLogo) headerLogo.style.visibility = "hidden";

    const restorePage = () => {
      root.dataset.intro = "skip";
      root.classList.remove("sl-intro-lock");
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (headerLogo) headerLogo.style.visibility = previousHeaderVisibility;
      if (content) {
        content.removeAttribute("aria-hidden");
        content.inert = false;
      }
      overlay.hidden = true;
      if (previousFocus && typeof previousFocus.focus === "function") {
        try { previousFocus.focus({ preventScroll: true }); } catch {}
      }
    };

    const cleanup = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(failSafe);
      window.clearTimeout(decodeTimer);
      window.clearTimeout(skipTapTimer);
      timeline?.kill();
      exitTween?.kill();
      exitTween = gsap.to(overlay, {
        autoAlpha: 0,
        duration: reduced ? 0.25 : 0.18,
        ease: "power1.out",
        overwrite: true,
        onComplete: restorePage
      });
    };

    const failSafeCallback = () => cleanup();
    failSafe = window.setTimeout(failSafeCallback, 4000);

    const heroImage = new Image();
    heroImage.src = "/Cinematic%20Sports%20Stadium%20Silhouettes%20at%20Dusk.png";
    const decodeGate = new Promise((resolve) => {
      decodeTimer = window.setTimeout(resolve, 1200);
      if (typeof heroImage.decode === "function") {
        heroImage.decode().catch(() => {}).then(resolve);
      } else {
        resolve();
      }
    });

    const buildTimeline = async () => {
      await decodeGate;
      if (finished || !overlay.isConnected) return;

      if (connection?.saveData) {
        cleanup();
        return;
      }

      gsap.set(overlay, { autoAlpha: 1, clipPath: "inset(0 0 0 0)" });
      gsap.set(mark, { autoAlpha: 0, x: 0, y: 10, scale: 0.985, transformOrigin: "50% 50%" });

      if (reduced) {
        timeline = gsap.timeline({ onComplete: cleanup });
        timeline.to(mark, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "none" });
        return;
      }

      timeline = gsap.timeline({ onComplete: cleanup });
      timeline.to(mark, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.48,
        ease: "power3.out"
      }, 0.08);

      timeline.add(() => {
        if (finished || !headerLogo) return;
        const from = mark.getBoundingClientRect();
        const to = headerLogo.getBoundingClientRect();
        if (!from.width || !from.height || !to.width || !to.height) return;
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        timeline.to(mark, {
          x: dx,
          y: dy,
          scaleX: to.width / from.width,
          scaleY: to.height / from.height,
          duration: 0.5,
          ease: "power3.inOut"
        }, timeline.time());
      }, 1.08);

      heroTargets.forEach((element, index) => {
        timeline.fromTo(element,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.34, ease: "power3.out", immediateRender: false },
          1.2 + index * 0.055
        );
      });

      timeline.to(overlay, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.58,
        ease: "power2.inOut"
      }, 1.52);
      timeline.to(overlay, { autoAlpha: 0, duration: 0.01 }, 2.22);
    };

    const onKey = (event) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        if (event.target === skipRef.current && event.key !== "Escape") return;
        event.preventDefault();
        cleanup();
      }
    };
    const onPointer = (event) => {
      if (event.target === skipRef.current || finished) return;
      if (performance.now() > startedAt + 600) cleanup();
    };
    const startedAt = performance.now();

    window.addEventListener("keydown", onKey);
    overlay.addEventListener("pointerdown", onPointer);
    skipRef.current?.addEventListener("click", cleanup);
    buildTimeline();

    return () => {
      finished = true;
      window.clearTimeout(failSafe);
      window.clearTimeout(decodeTimer);
      window.clearTimeout(skipTapTimer);
      timeline?.kill();
      exitTween?.kill();
      window.removeEventListener("keydown", onKey);
      overlay.removeEventListener("pointerdown", onPointer);
      skipRef.current?.removeEventListener("click", cleanup);
      root.classList.remove("sl-intro-lock");
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (headerLogo) headerLogo.style.visibility = previousHeaderVisibility;
      if (content) {
        content.removeAttribute("aria-hidden");
        content.inert = false;
      }
    };
  }, { scope: overlayRef, dependencies: [], revertOnUpdate: true });

  return (
    <div id="sportslink-intro-overlay" ref={overlayRef} className="sl-intro-overlay" role="status" aria-label="SPORTSLINK brand introduction">
      <div className="sl-intro-logo-wrap" ref={markRef}>
        <img src="/sportslink_project_brief_final.png" width="1568" height="523" alt="SPORTSLINK" fetchPriority="high" />
      </div>
      <button ref={skipRef} type="button" className="sl-intro-skip" aria-label="Skip SPORTSLINK introduction">Skip <span aria-hidden="true">↗</span></button>
    </div>
  );
}
