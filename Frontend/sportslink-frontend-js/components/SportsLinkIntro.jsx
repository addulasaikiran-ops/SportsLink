"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./SportsLinkIntro.css";

// One-switch release control. Set to false to disable the intro completely.
export const INTRO_ENABLED = true;
const SESSION_KEY = "sl_intro_seen";
const INTRO_DURATION = 3600;

function shouldPlayIntro() {
  if (!INTRO_ENABLED || typeof window === "undefined" || window.location.pathname !== "/") return false;
  const forced = new URLSearchParams(window.location.search).get("intro") === "1";
  if (forced) return true;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    // Storage can be blocked; still allow the intro for this page view.
    return true;
  }
}

function SportLinkWordmark() {
  return (
    <svg className="sl-intro-wordmark" viewBox="0 0 760 180" role="img" aria-label="SPORTSLINK" focusable="false">
      <defs>
        <clipPath id="sl-intro-logo-clip"><rect x="0" y="0" width="760" height="180" rx="2" /></clipPath>
      </defs>
      <g clipPath="url(#sl-intro-logo-clip)" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontStyle="italic" letterSpacing="-8">
        <text x="18" y="126" fontSize="122" fill="var(--sl-intro-sports)">SPORTS</text>
        <text x="407" y="126" fontSize="122" fill="#70D522">LINK</text>
        <path className="sl-intro-ribbon" d="M42 145 C176 159 333 154 505 140" fill="none" stroke="#70D522" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function GlassFootball() {
  return (
    <svg className="sl-intro-ball-art" viewBox="0 0 140 140" aria-hidden="true">
      <defs>
        <radialGradient id="sl-ball-glass" cx="30%" cy="22%" r="78%">
          <stop offset="0" stopColor="#fff" stopOpacity=".94" />
          <stop offset=".23" stopColor="#dff4ff" stopOpacity=".42" />
          <stop offset=".6" stopColor="#91c6e8" stopOpacity=".13" />
          <stop offset="1" stopColor="#fff" stopOpacity=".23" />
        </radialGradient>
        <linearGradient id="sl-ball-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".5" stopColor="#c3e9ff" stopOpacity=".45" />
          <stop offset="1" stopColor="#fff" stopOpacity=".8" />
        </linearGradient>
        <clipPath id="sl-ball-clip"><circle cx="70" cy="70" r="62" /></clipPath>
      </defs>
      <circle cx="70" cy="74" r="61" fill="#020b18" opacity=".24" />
      <circle cx="70" cy="70" r="62" fill="url(#sl-ball-glass)" stroke="url(#sl-ball-rim)" strokeWidth="2.5" />
      <g className="sl-intro-ball-seams" clipPath="url(#sl-ball-clip)" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2">
        <path d="M70 8 91 23 84 47 59 48 47 27Z" fill="#fff" fillOpacity=".15" />
        <path d="m8 54 24-9 15 18-8 24-25 5M91 23l26 12 15 27-19 13-29-8-16-19M39 87l24 8 8 25-18 18M84 47l-7 20 18 22-8 31M47 27 32 45M62 95l22-28M38 87l-5 25 20 26M112 75l7 24-22 18" />
      </g>
      <ellipse cx="49" cy="34" rx="23" ry="11" fill="#fff" opacity=".54" transform="rotate(-35 49 34)" />
      <path d="M23 51C37 20 70 6 98 20" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".75" />
      <circle cx="104" cy="41" r="5" fill="#fff" opacity=".75" />
    </svg>
  );
}

export default function SportsLinkIntro() {
  const [visible, setVisible] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const overlayRef = useRef(null);
  const frameRef = useRef(0);
  const startRef = useRef(0);
  const doneRef = useRef(false);
  const canSkipRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(frameRef.current);
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.classList.add("sl-intro-is-exiting");
      window.setTimeout(() => setVisible(false), 180);
    } else {
      setVisible(false);
    }
    document.documentElement.classList.remove("sl-intro-lock");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }, []);

  useEffect(() => {
    if (!INTRO_ENABLED || !shouldPlayIntro()) return;
    let motionPreference = false;
    try {
      motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}
    setReducedMotion(motionPreference);
    setVisible(true);
    try { window.sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add("sl-intro-lock");
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = scrollbarWidth + "px";

    const skipTimer = window.setTimeout(() => {
      canSkipRef.current = true;
      setSkipVisible(true);
    }, 400);
    const gestureTimer = window.setTimeout(() => { canSkipRef.current = true; }, 800);
    const duration = motionPreference ? 1350 : INTRO_DURATION;
    const completeTimer = window.setTimeout(finish, duration);
    const handleKey = (event) => {
      if (!canSkipRef.current) return;
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        if (event.target?.tagName === "BUTTON" && event.key !== "Escape") return;
        event.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(skipTimer);
      window.clearTimeout(gestureTimer);
      window.clearTimeout(completeTimer);
      window.removeEventListener("keydown", handleKey);
      cancelAnimationFrame(frameRef.current);
      document.documentElement.classList.remove("sl-intro-lock");
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [finish]);

  useEffect(() => {
    if (!visible || reducedMotion) return;
    let cancelled = false;
    const tick = (now) => {
      if (cancelled || doneRef.current) return;
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.max(0, Math.min(1, (elapsed - 800) / 2000));
      const eased = progress < .5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const x = -12 + 124 * eased;
      const arc = Math.sin(progress * Math.PI) * -14;
      const rotation = progress * 720;
      const scale = .92 + Math.sin(progress * Math.PI) * .12;
      if (overlayRef.current) {
        overlayRef.current.style.setProperty("--sl-ball-x", x + "vw");
        overlayRef.current.style.setProperty("--sl-ball-y", arc + "px");
        overlayRef.current.style.setProperty("--sl-ball-rotation", rotation + "deg");
        overlayRef.current.style.setProperty("--sl-ball-scale", String(scale));
        overlayRef.current.style.setProperty("--sl-ball-progress", String(progress));
      }
      if (elapsed < INTRO_DURATION) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(frameRef.current); };
  }, [visible, reducedMotion]);

  useEffect(() => {
    if (!visible) return;
    const onPointer = () => { if (canSkipRef.current) finish(); };
    const overlay = overlayRef.current;
    overlay?.addEventListener("pointerdown", onPointer);
    return () => overlay?.removeEventListener("pointerdown", onPointer);
  }, [visible, finish]);

  if (!visible) return null;

  return (
    <div
      id="sportslink-intro-overlay"
      ref={overlayRef}
      className={"sl-intro-overlay" + (reducedMotion ? " sl-intro-reduced" : "")}
      role="dialog"
      aria-label="SPORTSLINK introduction"
      aria-modal="true"
    >
      <div className="sl-intro-grain" aria-hidden="true" />
      <div className="sl-intro-logo-wrap"><SportLinkWordmark /></div>
      {!reducedMotion && <div className="sl-intro-trail" aria-hidden="true" />}
      {!reducedMotion && <div className="sl-intro-ball"><GlassFootball /></div>}
      <button
        type="button"
        className="sl-intro-skip"
        style={{ visibility: skipVisible ? "visible" : "hidden" }}
        onClick={(event) => { event.stopPropagation(); finish(); }}
        aria-label="Skip introduction"
      >Skip <span aria-hidden="true">↗</span></button>
    </div>
  );
}
