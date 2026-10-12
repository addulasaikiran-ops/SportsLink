import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "Read how SPORTSLINK collects, uses, stores and protects information when you use its sports networking service.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPolicyPage() {
  return <div className="public-site">
    <header className="public-header"><div className="public-header-inner">
      <Link href="/" className="public-brand"><img className="sportslink-logo" src="/sportslink_project_brief_final.png" alt="SPORTSLINK"/></Link>
      <nav className="public-nav" aria-label="Privacy page navigation">
        <Link href="/about">About</Link><Link href="/login">Log in</Link><Link href="/signup" className="button public-nav-cta">Join SPORTSLINK</Link>
      </nav>
    </div></header>
    <main className="legal-main">
      <article className="legal-document">
        <div className="legal-topline">SPORTSLINK · TRUST & PRIVACY</div>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: 12 October 2026</p>
        <p className="legal-intro">SPORTSLINK is a professional network for people across sport. This policy explains what information may be handled when you create an account, build a profile, connect with other members and use the service.</p>

        <section><h2>1. Information we collect</h2>
          <p>Depending on the features you use, SPORTSLINK may process:</p>
          <ul>
            <li><strong>Account details:</strong> your name, email address, account identifier, sign-in method and account preferences.</li>
            <li><strong>Profile information:</strong> username, role in sport, primary sport, biography, professional headline, education, location, profile and cover images, and other details you choose to add.</li>
            <li><strong>Content and connections:</strong> posts, comments, messages, reactions, saved items, connection requests and activity needed to operate the community features you use.</li>
            <li><strong>Technical and security data:</strong> basic device, browser, diagnostic and request information that may be processed by our hosting, authentication or anti-abuse providers to keep the service working and reduce automated misuse.</li>
          </ul>
          <p>Please do not include sensitive personal information in public profile fields or content that you do not want other members to see.</p>
        </section>

        <section><h2>2. How we use information</h2>
          <p>Information is used to create and maintain your account, display your profile and content according to the service’s features, deliver messages and notifications, help members discover relevant people and opportunities, respond to support requests, protect accounts, prevent spam and abuse, and maintain or improve SPORTSLINK.</p>
        </section>

        <section><h2>3. What other members can see</h2>
          <p>Information you add to a public profile, public posts or other community areas may be visible to other members and, where a page is publicly accessible, to people outside SPORTSLINK. Private account credentials are not displayed on your public profile. Messages are intended for their conversation participants, but recipients may retain or share information you send them. Review content carefully before publishing it.</p>
        </section>

        <section><h2>4. Service providers and sharing</h2>
          <p>SPORTSLINK uses service providers to operate core functions. Supabase provides authentication and data services; Railway hosts the application; and Google may process sign-in information when you choose Google authentication. If an anti-bot challenge is enabled, its provider may process browser or device signals to assess automated traffic. These providers handle information under their own terms and privacy notices.</p>
          <p>We do not sell personal information. Information may also be disclosed when needed to protect the service and its users, respond to a lawful request, investigate suspected abuse, or address a business transfer, subject to applicable law.</p>
        </section>

        <section><h2>5. Storage and security</h2>
          <p>Account and profile information is stored using the service infrastructure configured for SPORTSLINK. We use authentication and access controls intended to protect accounts and data, but no internet service or storage method can be guaranteed completely secure. Keep your credentials private and report suspected account misuse promptly.</p>
        </section>

        <section><h2>6. Retention and your choices</h2>
          <p>Information is kept for as long as needed to operate the service, maintain your account, resolve disputes, meet applicable obligations and protect against abuse. You can review and update profile details through the available account features. To ask about access to, correction of or deletion of personal information, contact the SPORTSLINK team through the support channel made available with the service. Some information may need to be retained for legitimate security or legal reasons.</p>
        </section>

        <section><h2>7. Children and eligibility</h2>
          <p>SPORTSLINK is intended for people who are permitted to create an account under the applicable terms and laws. Do not create an account or share another person’s information if you are not authorised to do so. A parent or guardian who believes a child has provided personal information should contact the SPORTSLINK team through the service’s support channel.</p>
        </section>

        <section><h2>8. International processing</h2>
          <p>Our hosting and service providers may process information in countries other than the country where you live. Where required, appropriate safeguards should be used for those transfers under applicable law.</p>
        </section>

        <section><h2>9. Changes to this policy</h2>
          <p>This policy may be updated as SPORTSLINK evolves. The revised date at the top of this page indicates when it was most recently changed. Material changes may also be communicated through the service where appropriate.</p>
        </section>

        <section><h2>10. Contact</h2>
          <p>For privacy questions or requests, please use the support or help channel made available within SPORTSLINK. Please do not send passwords or authentication codes in a support request.</p>
        </section>
        <p className="legal-updated">This policy describes the service’s intended information practices and does not replace legal advice or any rights that apply under local law.</p>
      </article>
    </main>
    <footer className="public-footer">
      <Link href="/" className="public-brand"><img className="sportslink-logo" src="/sportslink_project_brief_final.png" alt="SPORTSLINK"/></Link>
      <p>Built for the people who move sport forward.</p>
      <div><Link href="/about">About</Link><Link href="/privacy">Privacy Policy</Link><Link href="/login">Log in</Link><Link href="/signup">Create account</Link></div>
      <small>© {new Date().getFullYear()} SPORTSLINK. Connecting the world of sport.</small>
    </footer>
  </div>;
}