"use client";
export default function Error({ error, reset }) {
  return <main className="system-state card" role="alert">
    <span className="system-state-icon">!</span>
    <p className="eyebrow">SOMETHING WENT WRONG</p>
    <h1>We hit a small setback.</h1>
    <p>Your page could not be displayed. Try again, or return to the SPORTSLINK feed.</p>
    <div className="system-state-actions"><button className="button button-primary" onClick={() => reset()}>Try again</button><a className="button button-secondary" href="/">Back to home</a></div>
  </main>;
}
