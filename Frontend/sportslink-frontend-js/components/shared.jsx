"use client";
import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export function Heading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

export function SearchBox({ value, onChange, placeholder }) {
  return <label className="search-field"><Search size={17} aria-hidden="true" /><input value={value} onChange={onChange} placeholder={placeholder} aria-label={placeholder} autoComplete="off" /></label>;
}

export function Notice({ children }) {
  if (!children) return null;
  return <p className="inline-notice" role="status" aria-live="polite">{children}</p>;
}

/** Accessible modal dialog: Escape to close, focus moves in and is restored, Tab is trapped. */
export function Modal({ title, titleId, onClose, children }) {
  const panel = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const focusables = () => panel.current ? [...panel.current.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')] : [];
    (focusables()[0] || panel.current)?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal-panel card" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panel} tabIndex={-1}>
      <div className="modal-head"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
      {children}
    </div>
  </div>;
}
