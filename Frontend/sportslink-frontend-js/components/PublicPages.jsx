 "use client";
import "./landing.css";
import SportsLinkIntro from "@/components/SportsLinkIntro";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Activity, ArrowRight, ArrowUpRight, Users, Trophy, BriefcaseBusiness, ShieldCheck, Globe2, HeartHandshake, Menu, X, CheckCircle2, Eye, EyeOff, CircleDot, Dribbble, Goal, Zap } from "lucide-react";

function PublicHeader() {
  const [menuOpen,setMenuOpen] = useState(false);
  return <header className="public-header"><div className="public-header-inner">
    <Link href="/" className="public-brand"><img className="sportslink-logo" src="/sportslink_project_brief_final.png" alt="SPORTSLINK" /></Link>
    <ThemeToggle compact />
    <button className="public-menu-toggle" aria-label={menuOpen?"Close menu":"Open menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button>
    <nav className={`public-nav ${menuOpen?"public-nav-open":""}`} aria-label="Main navigation">
      <Link href="/about" onClick={()=>setMenuOpen(false)}>About</Link>
      <a href="#features" onClick={()=>setMenuOpen(false)}>Why SPORTSLINK</a>
      <Link href="/login" className="public-login-link" onClick={()=>setMenuOpen(false)}>Log in</Link>
      <Link href="/signup" className="button public-nav-cta" onClick={()=>setMenuOpen(false)}>Join SPORTSLINK <ArrowUpRight size={16}/></Link>
    </nav>
  </div></header>;
}
function PublicFooter() {
  return <footer className="public-footer"><Link href="/" className="public-brand"><img className="sportslink-logo" src="/sportslink_project_brief_final.png" alt="SPORTSLINK" /></Link><p>Built for the people who move sport forward.</p><div><Link href="/about">About</Link><Link href="/privacy">Privacy Policy</Link><Link href="/login">Log in</Link><Link href="/signup">Create account</Link></div><small>© {new Date().getFullYear()} SPORTSLINK. Connecting the world of sport.</small></footer>;
}
function PublicLayout({children}) { return <div className="public-site"><PublicHeader/>{children}<PublicFooter/></div>; }

export function LandingPage() {
 const [selectedSport,setSelectedSport]=useState("");
 const [saved,setSaved]=useState([]);
 const [opportunityFilter,setOpportunityFilter]=useState("All");
 const [liked,setLiked]=useState([]);
 const [commentsOpen,setCommentsOpen]=useState([]);
 const [shared,setShared]=useState([]);
 const tiltFrameRef=useRef(0);
 const visibleOpportunities=[
  {id:1,type:"Roles",icon:"running",label:"FULL TIME",title:"Performance Analyst",company:"Velocity Performance",location:"Hybrid · London",tags:["Analysis","Football"],tone:"blue"},
  {id:2,type:"Internships",icon:"graduation-cap",label:"INTERNSHIP",title:"Sports Marketing Intern",company:"Northstar Athletics",location:"On-site · Bengaluru",tags:["Marketing","Growth"],tone:"gold"},
  {id:3,type:"Collaborations",icon:"handshake",label:"COLLABORATION",title:"Creator Partnership",company:"Playmaker Studio",location:"Remote · Global",tags:["Content","Community"],tone:"green"}
 ];
 const filteredOpportunities=visibleOpportunities.filter(item=>opportunityFilter==="All"||item.type===opportunityFilter);
 function tiltScene(event){
  const node=event.currentTarget;
  const rect=node.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width-.5;
  const y=(event.clientY-rect.top)/rect.height-.5;
  if(tiltFrameRef.current) cancelAnimationFrame(tiltFrameRef.current);
  tiltFrameRef.current=requestAnimationFrame(()=>{
   node.style.setProperty("--tilt-x",(x*10)+"deg");
   node.style.setProperty("--tilt-y",(y*-10)+"deg");
   node.style.setProperty("--cursor-x",(((event.clientX-rect.left)/rect.width)*100)+"%");
   node.style.setProperty("--cursor-y",(((event.clientY-rect.top)/rect.height)*100)+"%");
  });
 }
 return <><SportsLinkIntro /><PublicLayout><main className="sl-landing">
  <section className="landing-hero sl-hero">
   <div className="sl-network-canvas" aria-hidden="true"><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div>
   <div className="landing-hero-copy sl-hero-copy"><div className="public-eyebrow"><span className="eyebrow-pulse"/> THE PROFESSIONAL NETWORK FOR SPORT</div>
    <h1 className="sl-hero-heading"><span className="sl-heading-line"><span className="sl-heading-line-inner">Your next chapter</span></span><span className="sl-heading-line"><span className="sl-heading-line-inner">in sport <span>starts here.</span></span></span></h1>
    <p className="landing-lede">Meet the people, discover the opportunities, and build the career you want in the world of sport.</p>
    <div className="landing-actions"><Link href="/signup" className="button landing-primary">Create your free profile <ArrowRight size={17}/></Link><Link href="/login" className="landing-secondary">Already a member? Log in</Link></div>
    <div className="landing-proof"><span className="proof-avatars"><Users size={24}/></span><span><b>A community built around sport</b><small>Athletes · Coaches · Clubs · Creators</small></span></div>
   </div>
   <div className="landing-visual sl-visual" onMouseMove={tiltScene} onMouseLeave={(event)=>{if(tiltFrameRef.current)cancelAnimationFrame(tiltFrameRef.current);event.currentTarget.style.setProperty("--tilt-x","0deg");event.currentTarget.style.setProperty("--tilt-y","0deg");}} aria-label="Interactive sports community illustration">
    <div className="visual-glow"/><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/>
    <div className="sl-sport-float sl-tennis" role="img" aria-label="Tennis"><CircleDot aria-hidden="true"/></div><div className="sl-sport-float sl-basketball" role="img" aria-label="Basketball"><Dribbble aria-hidden="true"/></div><div className="sl-sport-float sl-football" role="img" aria-label="Football"><Goal aria-hidden="true"/></div><div className="sl-sport-float sl-cricket" role="img" aria-label="Cricket"><Activity aria-hidden="true"/></div><div className="sl-sport-float sl-badminton" role="img" aria-label="Badminton"><Zap aria-hidden="true"/></div><div className="sl-sport-float sl-trophy" role="img" aria-label="Trophy"><Trophy aria-hidden="true"/></div>
    <div className="visual-main-card sl-opportunity-card"><div className="visual-card-top"><span className="live-dot"/> YOUR SPORT. YOUR PEOPLE.</div><div className="visual-ball">✦</div><h2>Opportunity<br/>is a team sport.</h2><p>Make connections that move you forward.</p><div className="visual-tags"><span>Career growth</span><span>Community</span><span>Performance</span></div></div>
    <div className="float-card float-network"><span className="float-icon"><Users size={18}/></span><span><b>Find your people</b><small>Grow your network</small></span><ArrowUpRight size={17}/></div>
    <div className="float-card float-jobs"><span className="float-icon orange-icon"><BriefcaseBusiness size={18}/></span><span><b>New opportunities</b><small>Made for your next move</small></span></div>
    <div className="visual-index">01 <span>— CONNECT. GROW. ACHIEVE.</span></div>
   </div>
  </section>
  <section className="landing-features sl-feature-section" id="features"><div className="section-intro"><p className="public-eyebrow">MORE THAN A PROFILE</p><h2>Everything to help<br/>you <span>move forward.</span></h2><p>One connected space to grow your career, discover possibilities, and build relationships that matter.</p></div><div className="feature-grid"><article className="feature-card feature-blue sl-feature-tilt"><span className="feature-icon"><Users/></span><small>01 / NETWORK</small><h3>Connections that count.</h3><p>Connect with athletes, coaches, recruiters, and professionals who understand your world.</p><Link href="/signup">Build your network <ArrowRight size={15}/></Link></article><article className="feature-card feature-green sl-feature-tilt"><span className="feature-icon"><Trophy/></span><small>02 / OPPORTUNITY</small><h3>Your next move, closer.</h3><p>Explore roles, internships, collaborations, and new pathways across the sports industry.</p><Link href="/signup">Explore possibilities <ArrowRight size={15}/></Link></article><article className="feature-card feature-orange sl-feature-tilt"><span className="feature-icon"><HeartHandshake/></span><small>03 / COMMUNITY</small><h3>Move forward together.</h3><p>Share your journey, learn from peers, and find the support to keep growing.</p><Link href="/about">Our mission <ArrowRight size={15}/></Link></article></div></section>
  <section className="landing-cta sl-final-cta"><div><p className="public-eyebrow">YOUR SPORTING JOURNEY, CONNECTED</p><h2>Make your next move<br/>a team effort.</h2><p>Start with a profile. Leave room for what's possible.</p></div><Link href="/signup" className="button landing-primary">Join SPORTSLINK <ArrowUpRight size={18}/></Link></section>
 </main></PublicLayout></>;
}

function AuthLayout({mode,children}) {
 return <PublicLayout><main className={`auth-main auth-main-${mode}`}><div className="auth-side"><div className="auth-side-content"><div className="public-eyebrow"><span className="eyebrow-pulse"/> A NETWORK THAT GETS YOUR GAME</div><h1>{mode==="login"?"Good to have\nyou back.":"Your next chapter\nstarts with a hello."}</h1><p>{mode==="login"?"Pick up where your sporting journey left off. Your community is right here.":"Create your place in a community built for everyone moving sport forward."}</p><div className="auth-benefits"><span><CheckCircle2 size={17}/> Your professional sports profile</span><span><CheckCircle2 size={17}/> Career opportunities and connections</span><span><CheckCircle2 size={17}/> One community, every side of sport</span></div><div className="auth-side-stamp"><Activity size={18}/> CONNECT <span>·</span> GROW <span>·</span> ACHIEVE</div></div></div><div className={`auth-form-wrap auth-form-wrap-${mode}`}>{children}</div></main></PublicLayout>;
}
export function LoginPage() {
 const router=useRouter();
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[show,setShow]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[loading,setLoading]=useState(false);
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  if(params.get("setup")==="supabase") setNotice("Connect your Supabase project first. Copy .env.local.example to .env.local, add your publishable key, and restart the dev server.");
  if(params.get("error")==="confirmation") setError("That confirmation link could not be verified or has expired. Try signing up again.");
 },[]);
 async function signInWithGoogle(){
  setError("");setNotice("");
  const supabase=createClient();
  if(!supabase){setError("Supabase is not configured. Add your project URL and publishable key first.");return;}
  setLoading(true);
  const {error:oauthError}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback?next=/home`}});
  if(oauthError){setLoading(false);setError(oauthError.message);}
 }
 async function submit(e){
  e.preventDefault();setError("");setNotice("");
  if(!email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError("Enter a valid email address.");return;}
  if(password.length<6){setError("Use at least 6 characters for the password.");return;}
  const supabase=createClient();
  if(!supabase){setError("Supabase is not configured yet. Add your project URL and publishable key to .env.local, then restart npm run dev.");return;}
  setLoading(true);
  const {error:authError}=await supabase.auth.signInWithPassword({email:email.trim(),password});
  if(authError){setLoading(false);setError(authError.message==="Invalid login credentials"?"Email or password is incorrect. If you are new here, create an account first.":authError.message);return;}
  const params=new URLSearchParams(window.location.search);const next=params.get("next");const target=next&&next.startsWith("/")&&!next.startsWith("//")&&!["/login","/signup","/onboarding"].includes(next.split("?")[0])?next:"/home";
  // Let middleware route incomplete profiles to onboarding; completed members go directly to their destination.
  router.replace(target);router.refresh();
 }
 return <AuthLayout mode="login"><div className="login-brand-row"><img className="sportslink-logo login-logo-image" src="/sportslink_project_brief_final.png" alt="SPORTSLINK" /><span className="login-brand-online"><i/> MEMBER ACCESS</span></div><div className="auth-form-heading"><span className="auth-kicker">WELCOME BACK</span><h2>Log in to SPORTSLINK</h2><p>Good things happen when sport connects.</p></div><button className="google-auth-button" type="button" onClick={signInWithGoogle} disabled={loading}><span className="google-auth-mark" aria-hidden="true"><svg className="google-auth-logo" viewBox="0 0 48 48" focusable="false"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11c-.5 2.5-2 4.6-4.2 6v5.1h6.8c4-3.7 6-9 6-14.8z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.8-5.1c-1.9 1.3-4.3 2.1-6.7 2.1-5.2 0-9.6-3.5-11.2-8.2H5.8v5.2C9.2 39.6 16.1 44 24 44z"/><path fill="#FBBC05" d="M12.8 28c-.4-1.2-.7-2.6-.7-4s.2-2.8.7-4v-5.2H5.8C4.6 17.3 4 20.6 4 24s.6 6.7 1.8 9.2L12.8 28z"/><path fill="#EA4335" d="M24 11.8c3 0 5.7 1 7.8 3l5.8-5.8C34.1 5.7 29.5 4 24 4 16.1 4 9.2 8.4 5.8 14.8l7 5.2c1.6-4.7 6-8.2 11.2-8.2z"/></svg></span><span className="google-auth-label">{loading?"Connecting to Google…":"Continue with Google"}</span></button><div className="auth-divider"><span>or continue with email</span></div><form className="auth-form" onSubmit={submit} noValidate><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/><div className="auth-label-row"><label htmlFor="login-password">Password</label><span>At least 6 characters</span></div><div className="password-field"><input id="login-password" type={show?"text":"password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" aria-label={show?"Hide password":"Show password"} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>{notice&&<p className="auth-success" role="status">{notice}</p>}{error&&<p className="auth-error" role="alert">{error}</p>}<button className="button auth-submit" type="submit" disabled={loading}>{loading?"Logging in…":"Log in"} {!loading&&<ArrowRight size={17}/>}</button><p className="auth-demo-note"><ShieldCheck size={15}/> Secure sign-in powered by Supabase. Your password is verified by the authentication service.</p></form><div className="auth-switch">New to SPORTSLINK? <Link href="/signup">Create an account</Link></div></AuthLayout>;
}
export function SignupPage() {
 const router=useRouter();
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[role,setRole]=useState("athlete"),[terms,setTerms]=useState(false),[show,setShow]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[loading,setLoading]=useState(false),[website,setWebsite]=useState(""),[captchaToken,setCaptchaToken]=useState("");
 const captchaSiteKey=process.env.NEXT_PUBLIC_SUPABASE_CAPTCHA_SITE_KEY || "";
 const signupStartedAt=useRef(Date.now()),lastSubmitAt=useRef(0),signupInFlight=useRef(false),captchaContainer=useRef(null),captchaWidgetId=useRef(null);
 function mountCaptcha(){
  if(!captchaSiteKey||!captchaContainer.current||typeof window==="undefined"||!window.turnstile||captchaWidgetId.current!==null)return;
  captchaWidgetId.current=window.turnstile.render(captchaContainer.current,{sitekey:captchaSiteKey,theme:"auto",callback:(token)=>setCaptchaToken(token),"expired-callback":()=>setCaptchaToken(""),"error-callback":()=>setCaptchaToken("")});
 }
 function resetCaptcha(){
  setCaptchaToken("");
  if(captchaWidgetId.current!==null&&typeof window!=="undefined"&&window.turnstile)window.turnstile.reset(captchaWidgetId.current);
 }
 useEffect(()=>()=>{if(captchaWidgetId.current!==null&&typeof window!=="undefined"&&window.turnstile)window.turnstile.remove(captchaWidgetId.current);},[]);
 async function signInWithGoogle(){
  setError("");setNotice("");
  const supabase=createClient();
  if(!supabase){setError("Supabase is not configured. Add your project URL and publishable key first.");return;}
  setLoading(true);
  const {error:oauthError}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback?next=/home`}});
  if(oauthError){setLoading(false);setError(oauthError.message);}
 }
 async function submit(e){
  e.preventDefault();setError("");setNotice("");
  if(website.trim()){setNotice("Thanks — your account request has been received.");return;}
  if(Date.now()-signupStartedAt.current<1800){setError("Please take a moment to review your details and try again.");return;}
  if(signupInFlight.current)return;
  if(Date.now()-lastSubmitAt.current<3000){setError("Please wait a few seconds before trying again.");return;}
  if(name.trim().length<2){setError("Please enter your full name.");return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError("Enter a valid email address.");return;}
  if(password.length<8){setError("Use a password with at least 8 characters.");return;}
  if(!terms){setError("Please confirm your agreement before creating an account.");return;}
  if(captchaSiteKey&&!captchaToken){setError("Complete the security check before creating your account.");return;}
  const supabase=createClient();
  if(!supabase){setError("Supabase is not configured. Add your project URL and publishable key, then try again.");return;}
  signupInFlight.current=true;lastSubmitAt.current=Date.now();setLoading(true);
  try{
   const {data,error:authError}=await supabase.auth.signUp({
    email:email.trim(),password,
    options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=/onboarding`,captchaToken:captchaSiteKey?captchaToken:undefined,data:{full_name:name.trim(),role}}
   });
   if(authError){setError(authError.message.includes("already registered")?"An account with this email already exists. Try logging in.":authError.message);resetCaptcha();return;}
   if(data.session){router.replace("/onboarding");router.refresh();return;}
   resetCaptcha();
   setNotice("Your account request was received. Check your email for the confirmation link, then return here to log in.");
  }catch{
   resetCaptcha();
   setError("We couldn't create your account right now. Please try again.");
  }finally{
   setLoading(false);signupInFlight.current=false;
  }
 }
 return <AuthLayout mode="signup">
  <section className="signup-content" aria-labelledby="signup-title">
   <div className="auth-form-heading signup-heading">
    <span className="auth-kicker">START YOUR JOURNEY</span>
    <h2 id="signup-title">Create your account</h2>
    <p>Your world of sport, connected.</p>
   </div>
   {error&&<p className="auth-error" role="alert">{error}</p>}
   <button className="google-auth-button" type="button" onClick={signInWithGoogle} disabled={loading}><span className="google-auth-mark" aria-hidden="true"><svg className="google-auth-logo" viewBox="0 0 48 48" focusable="false"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11c-.5 2.5-2 4.6-4.2 6v5.1h6.8c4-3.7 6-9 6-14.8z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.8-5.1c-1.9 1.3-4.3 2.1-6.7 2.1-5.2 0-9.6-3.5-11.2-8.2H5.8v5.2C9.2 39.6 16.1 44 24 44z"/><path fill="#FBBC05" d="M12.8 28c-.4-1.2-.7-2.6-.7-4s.2-2.8.7-4v-5.2H5.8C4.6 17.3 4 20.6 4 24s.6 6.7 1.8 9.2L12.8 28z"/><path fill="#EA4335" d="M24 11.8c3 0 5.7 1 7.8 3l5.8-5.8C34.1 5.7 29.5 4 24 4 16.1 4 9.2 8.4 5.8 14.8l7 5.2c1.6-4.7 6-8.2 11.2-8.2z"/></svg></span><span className="google-auth-label">{loading?"Connecting to Google…":"Sign up with Google"}</span></button>
   <div className="auth-divider"><span>or sign up with email</span></div>
   <form className="auth-form signup-form" onSubmit={submit} noValidate>
    <label htmlFor="signup-name">Full name</label>
    <input id="signup-name" autoComplete="name" placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)} required/>
    <label htmlFor="signup-email">Email address</label>
    <input id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
    <label htmlFor="signup-role">I’m joining as</label>
    <select id="signup-role" value={role} onChange={e=>setRole(e.target.value)}>
     <option value="athlete">Athlete</option><option value="coach">Coach</option><option value="scout">Scout / Recruiter</option><option value="other">Sports professional</option><option value="club">Club / Organization</option><option value="trainer">Trainer / Analyst</option>
    </select>
    <label htmlFor="signup-password">Create password</label>
    <div className="password-field">
     <input id="signup-password" type={show?"text":"password"} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)} required/>
     <button type="button" aria-label={show?"Hide password":"Show password"} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button>
    </div>
    <div className="signup-honeypot" aria-hidden="true">
     <label htmlFor="signup-website">Leave this field empty</label>
     <input id="signup-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/>
    </div>
    {captchaSiteKey&&<>
     <div className="signup-captcha-wrap"><p>Complete this security check to protect the community from automated signups.</p><div ref={captchaContainer} className="signup-captcha"/></div>
     <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mountCaptcha}/>
    </>}
   <label className="auth-terms signup-consent">
    <input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)} />
    <span>I agree to create a SPORTSLINK account, confirm my information is accurate, and acknowledge the <Link href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link>.</span>
   </label>
    <button className="button auth-submit" type="submit" disabled={loading} aria-busy={loading}>{loading?"Creating account…":"Create account"} {!loading&&<ArrowRight size={17}/>}</button>
    {notice&&<p className="auth-success signup-submit-notice" role="status">{notice}</p>}
    <p className="auth-demo-note"><ShieldCheck size={15}/> Protected with signup validation, automated-form traps and Supabase Auth rate limits. Never share your password.</p>
   </form>
   <div className="auth-switch signup-switch">Already a member? <Link href="/login">Log in</Link></div>
  </section>
 </AuthLayout>;
}
export function AboutPage() {
 return <PublicLayout><main className="about-page"><section className="about-hero"><p className="public-eyebrow">ABOUT SPORTSLINK</p><h1>Sport is bigger<br/>when we <span>connect.</span></h1><p>SPORTSLINK is being built to bring the people behind sport into one professional community — from the field to the front office.</p><Link href="/signup" className="button landing-primary">Be part of the journey <ArrowRight size={17}/></Link><div className="about-orb"><Globe2 size={68}/><span>ONE SPORTING COMMUNITY</span></div></section><section className="about-values"><article><span>01</span><h2>People first.</h2><p>Every sporting journey is shaped by people. We want to make it easier to find your peers, mentors, collaborators, and next opportunity.</p></article><article><span>02</span><h2>Every role matters.</h2><p>Sport is powered by athletes, coaches, medical teams, analysts, scouts, organizers, creators, and many more.</p></article><article><span>03</span><h2>Progress together.</h2><p>Our aim is to help the sports community share knowledge, open doors, and build meaningful professional relationships.</p></article></section><div className="about-note"><ShieldCheck size={20}/><p><b>We’re building in the open.</b><br/>Authentication is now being connected to Supabase. Some profile, feed, messaging, and opportunity interactions are still prototype-only while the backend integration continues.</p></div></main></PublicLayout>;
}
