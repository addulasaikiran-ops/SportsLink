"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Copy, Mail, ShieldCheck, Users } from "lucide-react";

const SIGNUP_PATH = "/signup";

export function InviteMembersPage() {
  const [origin, setOrigin] = useState("");
  const [emails, setEmails] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const signupUrl = origin ? origin + SIGNUP_PATH : SIGNUP_PATH;
  const validEmails = [...new Set(emails.split(/[\s,;]+/).map(v => v.trim().toLowerCase()).filter(Boolean))];
  const invalidEmails = validEmails.filter(v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
  const inviteText = "You’re invited to join SPORTSLINK, the professional network for sport. Create your profile and connect with athletes, coaches, clubs, and sports professionals: " + signupUrl;

  async function copyLink() {
    setError(""); setMessage("");
    try { await navigator.clipboard.writeText(signupUrl); setCopied(true); setMessage("Signup link copied. Share it with people who want to join SPORTSLINK."); }
    catch { setError("Your browser couldn't copy automatically. Copy the signup link shown below."); }
  }
  function prepareInvites(e) {
    e.preventDefault(); setError(""); setMessage("");
    if (!validEmails.length) { setError("Enter at least one email address."); return; }
    if (invalidEmails.length) { setError("Check these email addresses: " + invalidEmails.join(", ")); return; }
    if (validEmails.length > 50) { setError("Please prepare invitations in batches of 50 or fewer."); return; }
    const subject = "You’re invited to join SPORTSLINK";
    const body = inviteText + "\n\nIf you weren’t expecting this invitation, you can ignore this email.";
    const mailto = "mailto:" + validEmails.join(",") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    setMessage("Your email app will open with " + validEmails.length + " recipient(s). Review the recipients and message before sending.");
    window.location.href = mailto;
  }
  return <main className="invite-members-page">
    <section className="invite-members-card" aria-labelledby="invite-title">
      <span className="invite-kicker"><Users size={16}/> GROW THE SPORTING COMMUNITY</span>
      <h1 id="invite-title">Bring your sports network <span>together.</span></h1>
      <p className="invite-intro">Invite real athletes, coaches, scouts, clubs, and sports professionals to create their own SPORTSLINK accounts.</p>
      <div className="invite-link-panel"><div><span className="invite-field-label">Your public signup link</span><code>{signupUrl}</code></div><button type="button" onClick={copyLink}><Copy size={16}/>{copied ? "Copied" : "Copy link"}</button></div>
      <form onSubmit={prepareInvites} className="invite-email-form">
        <label htmlFor="invite-emails">Email addresses</label>
        <textarea id="invite-emails" rows={4} value={emails} onChange={e=>setEmails(e.target.value)} placeholder="coach@example.com, athlete@example.com" aria-describedby="invite-email-help"/>
        <p id="invite-email-help" className="invite-help">Separate addresses with commas, spaces, or new lines. Maximum 50 recipients per batch. Only invite people who would reasonably expect to hear from you.</p>
        <button className="invite-primary" type="submit"><Mail size={17}/> Prepare email invitations <ArrowRight size={17}/></button>
      </form>
      <div className="invite-trust-note"><ShieldCheck size={18}/><p>Invited people register for themselves. This page does not create accounts, send email automatically, or mark anyone as verified.</p></div>
      {error && <p className="invite-error" role="alert">{error}</p>}{message && <p className="invite-success" role="status">{message}</p>}
      <p className="invite-login-note">Already have an account? <Link href="/login">Log in</Link> · <Link href="/signup">Create your own account</Link></p>
    </section>
  </main>;
}
