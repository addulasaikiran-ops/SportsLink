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
    const content = document.querySelector(".public-site");
    const headerLogo = document.querySelector(".public-header .public-brand .sportslink-logo");
    const hero = document.querySelector(".sl-landing .landing-hero");
    const headingLines = hero ? Array.from(hero.querySelectorAll(".sl-heading-line-inner")) : [];
    const heroTargets = hero ? [
      hero.querySelector(".public-eyebrow"),
      hero.querySelector(".landing-lede"),
      hero.querySelector(".landing-actions"),
      hero.querySelector(".landing-proof"),
      ...Array.from(hero.querySelectorAll(".sl-visual .visual-main-card, .sl-visual .float-card"))
    ].filter(Boolean) : [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const previousFocus = document.activeElement;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const previousHeaderVisibility = headerLogo?.style.visibility ?? "";
    const previousAriaHidden = content?.getAttribute("aria-hidden");
    const previousInert = content?.inert ?? false;
    const previousOverlayVisibility = overlay.style.visibility;

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
        if (previousAriaHidden === null) content.removeAttribute("aria-hidden");
        else content.setAttribute("aria-hidden", previousAriaHidden);
        content.inert = previousInert;
      }
      overlay.hidden = true;
      overlay.style.visibility = previousOverlayVisibility;
      if (previousFocus && typeof previousFocus.focus === "function") {
        try { previousFocus.focus({ preventScroll: true }); } catch {}
      }
    };

    const removeListeners = () => {
      window.removeEventListener("keydown", onKey);
      overlay.removeEventListener("pointerdown", onPointer);
      skipRef.current?.removeEventListener("click", cleanup);
    };

    const cleanup = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(failSafe);
      window.clearTimeout(decodeTimer);
      timeline?.kill();
      exitTween?.kill();
      removeListeners();
      exitTween = gsap.to(overlay, {
        autoAlpha: 0,
        duration: reduced ? 0.25 : 0.18,
        ease: "power1.out",
        overwrite: true,
        onComplete: restorePage
      });
    };

    const onKey = (event) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        if (event.target === skipRef.current && event.key !== "Escape") return;
        event.preventDefault();
        cleanup();
      }
    };
    const startedAt = performance.now();
    const onPointer = (event) => {
      if (event.target === skipRef.current || finished) return;
      if (performance.now() > startedAt + 600) cleanup();
    };

    failSafe = window.setTimeout(cleanup, 4000);

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

    gsap.set(overlay, { autoAlpha: 1, clipPath: "inset(0 0 0 0)" });
    gsap.set(mark, { autoAlpha: 0, x: 0, y: 10, scale: 0.985, transformOrigin: "50% 50%" });
    gsap.set(headingLines, { yPercent: 110, autoAlpha: 0 });
    gsap.set(heroTargets, { autoAlpha: 0, y: 18 });

    window.addEventListener("keydown", onKey);
    overlay.addEventListener("pointerdown", onPointer);
    skipRef.current?.addEventListener("click", cleanup);

    if (connection?.saveData) {
      cleanup();
    } else if (reduced) {
      timeline = gsap.timeline({ onComplete: cleanup });
      timeline.to(mark, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "none" });
    } else {
      timeline = gsap.timeline({ onComplete: cleanup });
      timeline.to(mark, {
        autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out"
      }, 0.04);

      // Move the untouched original logo image as one unit to the header logo's measured position.
      if (headerLogo) {
        const from = mark.getBoundingClientRect();
        const to = headerLogo.getBoundingClientRect();
        if (from.width && from.height && to.width && to.height) {
          const dx = to.left + to.width / 2 - (from.left + from.width / 2);
          const dy = to.top + to.height / 2 - (from.top + from.height / 2);
          timeline.to(mark, {
            x: dx, y: dy,
            scaleX: to.width / from.width,
            scaleY: to.height / from.height,
            duration: 0.52, ease: "power3.inOut"
          }, 0.64);
        }
      }

      // Add the reveal to the same master timeline once the hero image is decoded or 1.2s elapses.
      decodeGate.then(() => {
        if (finished || !timeline) return;
        const revealAt = Math.max(1.18, timeline.time() + 0.01);
        headingLines.forEach((line, index) => {
          timeline.to(line, {
            yPercent: 0, autoAlpha: 1, duration: 0.42, ease: "power3.out"
          }, revealAt + index * 0.09);
        });
        heroTargets.forEach((element, index) => {
          timeline.to(element, {
            autoAlpha: 1, y: 0, duration: 0.32, ease: "power3.out"
          }, revealAt + 0.12 + index * 0.045);
        });
      });

      timeline.to(overlay, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.54,
        ease: "power2.inOut"
      }, 1.82);
      timeline.to(overlay, { autoAlpha: 0, duration: 0.01 }, 2.36);
    }

    return () => {
      finished = true;
      window.clearTimeout(failSafe);
      window.clearTimeout(decodeTimer);
      timeline?.kill();
      exitTween?.kill();
      removeListeners();
      root.classList.remove("sl-intro-lock");
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (headerLogo) headerLogo.style.visibility = previousHeaderVisibility;
      if (content) {
        if (previousAriaHidden === null) content.removeAttribute("aria-hidden");
        else content.setAttribute("aria-hidden", previousAriaHidden);
        content.inert = previousInert;
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
