 "use client";
import "./landing.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Activity, ArrowRight, ArrowUpRight, Users, Trophy, BriefcaseBusiness, ShieldCheck, Globe2, HeartHandshake, Menu, X, CheckCircle2, Eye, EyeOff } from "lucide-react";

function PublicHeader() {
  const [menuOpen,setMenuOpen] = useState(false);
  return <header className="public-header"><div className="public-header-inner">
    <Link href="/" className="public-brand"><img className="sportslink-logo" src="/favicon_tag_pro_SL_ghost.png" alt="SPORTSLINK" /></Link>
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
  return <footer className="public-footer"><Link href="/" className="public-brand"><img className="sportslink-logo" src="/favicon_tag_pro_SL_ghost.png" alt="SPORTSLINK" /></Link><p>Built for the people who move sport forward.</p><div><Link href="/about">About</Link><Link href="/login">Log in</Link><Link href="/signup">Create account</Link></div><small>© {new Date().getFullYear()} SPORTSLINK. Connecting the world of sport.</small></footer>;
}
function PublicLayout({children}) { return <div className="public-site"><PublicHeader/>{children}<PublicFooter/></div>; }

export function LandingPage() {
 const [selectedSport,setSelectedSport]=useState("");
 const [saved,setSaved]=useState([]);
 const [opportunityFilter,setOpportunityFilter]=useState("All");
 const [liked,setLiked]=useState([]);
 const [commentsOpen,setCommentsOpen]=useState([]);
 const [shared,setShared]=useState([]);
 const [cursor,setCursor]=useState({x:0,y:0});
 const [sceneTilt,setSceneTilt]=useState({x:0,y:0});
 const visibleOpportunities=[
  {id:1,type:"Roles",icon:"🏃‍♂️",label:"FULL TIME",title:"Performance Analyst",company:"Velocity Performance",location:"Hybrid · London",tags:["Analysis","Football"],tone:"blue"},
  {id:2,type:"Internships",icon:"🎓",label:"INTERNSHIP",title:"Sports Marketing Intern",company:"Northstar Athletics",location:"On-site · Bengaluru",tags:["Marketing","Growth"],tone:"gold"},
  {id:3,type:"Collaborations",icon:"🤝",label:"COLLABORATION",title:"Creator Partnership",company:"Playmaker Studio",location:"Remote · Global",tags:["Content","Community"],tone:"green"}
 ];
 const filteredOpportunities=visibleOpportunities.filter(item=>opportunityFilter==="All"||item.type===opportunityFilter);
 function tiltScene(event){
  const rect=event.currentTarget.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width-.5;
  const y=(event.clientY-rect.top)/rect.height-.5;
  setSceneTilt({x:x*10,y:y*-10});
  setCursor({x:(event.clientX-rect.left)/rect.width*100,y:(event.clientY-rect.top)/rect.height*100});
 }
 return <PublicLayout><main className="sl-landing">
  <section className="landing-hero sl-hero">
   <div className="sl-network-canvas" aria-hidden="true"><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div>
   <div className="landing-hero-copy sl-hero-copy"><div className="public-eyebrow"><span className="eyebrow-pulse"/> THE PROFESSIONAL NETWORK FOR SPORT</div>
    <h1>Your next chapter<br/>in sport <span>starts here.</span></h1>
    <p className="landing-lede">Meet the people, discover the opportunities, and build the career you want in the world of sport.</p>
    <div className="landing-actions"><Link href="/signup" className="button landing-primary">Create your free profile <ArrowRight size={17}/></Link><Link href="/login" className="landing-secondary">Already a member? Log in</Link></div>
    <div className="landing-proof"><span className="proof-avatars"><Users size={24}/></span><span><b>A community built around sport</b><small>Athletes · Coaches · Clubs · Creators</small></span></div>
   </div>
   <div className="landing-visual sl-visual" onMouseMove={tiltScene} onMouseLeave={()=>setSceneTilt({x:0,y:0})} style={{"--tilt-x":sceneTilt.x+"deg","--tilt-y":sceneTilt.y+"deg","--cursor-x":cursor.x+"%","--cursor-y":cursor.y+"%"}} aria-label="Interactive sports community illustration">
    <div className="visual-glow"/><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/>
    <div className="sl-sport-float sl-tennis" aria-label="Tennis ball">🎾</div><div className="sl-sport-float sl-basketball" aria-label="Basketball">🏀</div><div className="sl-sport-float sl-football" aria-label="Football">⚽</div><div className="sl-sport-float sl-cricket" aria-label="Cricket">🏏</div><div className="sl-sport-float sl-badminton" aria-label="Badminton">🏸</div><div className="sl-sport-float sl-trophy" aria-label="Trophy">🏆</div>
    <div className="visual-main-card sl-opportunity-card"><div className="visual-card-top"><span className="live-dot"/> YOUR SPORT. YOUR PEOPLE.</div><div className="visual-ball">✦</div><h2>Opportunity<br/>is a team sport.</h2><p>Make connections that move you forward.</p><div className="visual-tags"><span>Career growth</span><span>Community</span><span>Performance</span></div></div>
    <div className="float-card float-network"><span className="float-icon"><Users size={18}/></span><span><b>Find your people</b><small>Grow your network</small></span><ArrowUpRight size={17}/></div>
    <div className="float-card float-jobs"><span className="float-icon orange-icon"><BriefcaseBusiness size={18}/></span><span><b>New opportunities</b><small>Made for your next move</small></span></div>
    <div className="visual-index">01 <span>— CONNECT. GROW. ACHIEVE.</span></div>
   </div>
  </section>
  <section className="landing-features sl-feature-section" id="features"><div className="section-intro"><p className="public-eyebrow">MORE THAN A PROFILE</p><h2>Everything to help<br/>you <span>move forward.</span></h2><p>One connected space to grow your career, discover possibilities, and build relationships that matter.</p></div><div className="feature-grid"><article className="feature-card feature-blue sl-feature-tilt"><span className="feature-icon"><Users/></span><small>01 / NETWORK</small><h3>Connections that count.</h3><p>Connect with athletes, coaches, recruiters, and professionals who understand your world.</p><Link href="/signup">Build your network <ArrowRight size={15}/></Link></article><article className="feature-card feature-green sl-feature-tilt"><span className="feature-icon"><Trophy/></span><small>02 / OPPORTUNITY</small><h3>Your next move, closer.</h3><p>Explore roles, internships, collaborations, and new pathways across the sports industry.</p><Link href="/signup">Explore possibilities <ArrowRight size={15}/></Link></article><article className="feature-card feature-orange sl-feature-tilt"><span className="feature-icon"><HeartHandshake/></span><small>03 / COMMUNITY</small><h3>Move forward together.</h3><p>Share your journey, learn from peers, and find the support to keep growing.</p><Link href="/about">Our mission <ArrowRight size={15}/></Link></article></div></section>
  <section className="landing-cta sl-final-cta"><div><p className="public-eyebrow">YOUR SPORTING JOURNEY, CONNECTED</p><h2>Make your next move<br/>a team effort.</h2><p>Start with a profile. Leave room for what's possible.</p></div><Link href="/signup" className="button landing-primary">Join SPORTSLINK <ArrowUpRight size={18}/></Link></section>
 </main></PublicLayout>;
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
 async function submit(e){
  e.preventDefault();setError("");setNotice("");
  if(!email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError("Enter a valid email address.");return;}
  if(password.length<6){setError("Use at least 6 characters for the password.");return;}
  const supabase=createClient();
  if(!supabase){setError("Supabase is not configured yet. Add your project URL and publishable key to .env.local, then restart npm run dev.");return;}
  setLoading(true);
  const {error:authError}=await supabase.auth.signInWithPassword({email:email.trim(),password});
  setLoading(false);
  if(authError){setError(authError.message==="Invalid login credentials"?"Email or password is incorrect. If you are new here, create an account first.":authError.message);return;}
  const params=new URLSearchParams(window.location.search);const next=params.get("next");const target=next&&next.startsWith("/")&&!next.startsWith("//")&&!["/login","/signup","/onboarding"].includes(next.split("?")[0])?next:"/home";
  router.replace(`/onboarding?next=${encodeURIComponent(target)}`);router.refresh();
 }
 return <AuthLayout mode="login"><div className="login-brand-row"><img className="sportslink-logo login-logo-image" src="/favicon_tag_pro_SL_ghost.png" alt="SPORTSLINK" /><span className="login-brand-online"><i/> MEMBER ACCESS</span></div><div className="auth-form-heading"><span className="auth-kicker">WELCOME BACK</span><h2>Log in to SPORTSLINK</h2><p>Good things happen when sport connects.</p></div><form className="auth-form" onSubmit={submit} noValidate><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/><div className="auth-label-row"><label htmlFor="login-password">Password</label><span>At least 6 characters</span></div><div className="password-field"><input id="login-password" type={show?"text":"password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" aria-label={show?"Hide password":"Show password"} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>{notice&&<p className="auth-success" role="status">{notice}</p>}{error&&<p className="auth-error" role="alert">{error}</p>}<button className="button auth-submit" type="submit" disabled={loading}>{loading?"Logging in…":"Log in"} {!loading&&<ArrowRight size={17}/>}</button><p className="auth-demo-note"><ShieldCheck size={15}/> Secure sign-in powered by Supabase. Your password is verified by the authentication service.</p></form><div className="auth-switch">New to SPORTSLINK? <Link href="/signup">Create an account</Link></div></AuthLayout>;
}
export function SignupPage() {
 const router=useRouter();
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[role,setRole]=useState("athlete"),[terms,setTerms]=useState(false),[show,setShow]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[loading,setLoading]=useState(false);
 async function submit(e){
  e.preventDefault();setError("");setNotice("");
  if(name.trim().length<2){setError("Please enter your full name.");return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError("Enter a valid email address.");return;}
  if(password.length<8){setError("Use a password with at least 8 characters.");return;}
  if(!terms){setError("Please confirm your agreement before creating an account.");return;}
  const supabase=createClient();
  if(!supabase){setError("Supabase is not configured. Add your project URL and publishable key, then try again.");return;}
  setLoading(true);
  try{
   const {data,error:authError}=await supabase.auth.signUp({
    email:email.trim(),password,
    options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=/onboarding`,data:{full_name:name.trim(),role}}
   });
   if(authError){setError(authError.message.includes("already registered")?"An account with this email already exists. Try logging in.":authError.message);return;}
   if(data.session){router.replace("/onboarding");router.refresh();return;}
   setNotice("Your account request was received. Check your email for the confirmation link, then return here to log in.");
  }catch{
   setError("We couldn't create your account right now. Please try again.");
  }finally{
   setLoading(false);
  }
 }
 return <AuthLayout mode="signup">
  <section className="signup-content" aria-labelledby="signup-title">
   <div className="auth-form-heading signup-heading">
    <span className="auth-kicker">START YOUR JOURNEY</span>
    <h2 id="signup-title">Create your account</h2>
    <p>Your world of sport, connected.</p>
   </div>
   {notice&&<p className="auth-success" role="status">{notice}</p>}
   {error&&<p className="auth-error" role="alert">{error}</p>}
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
   <label className="auth-terms signup-consent">
    <input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)} />
    <span>I agree to create a SPORTSLINK account and confirm my information is accurate.</span>
   </label>
    <button className="button auth-submit" type="submit" disabled={loading} aria-busy={loading}>{loading?"Creating account…":"Create account"} {!loading&&<ArrowRight size={17}/>}</button>
    <p className="auth-demo-note"><ShieldCheck size={15}/> Your account is secured by Supabase Auth. Never share your password.</p>
   </form>
   <div className="auth-switch signup-switch">Already a member? <Link href="/login">Log in</Link></div>
  </section>
 </AuthLayout>;
}
export function AboutPage() {
 return <PublicLayout><main className="about-page"><section className="about-hero"><p className="public-eyebrow">ABOUT SPORTSLINK</p><h1>Sport is bigger<br/>when we <span>connect.</span></h1><p>SPORTSLINK is being built to bring the people behind sport into one professional community — from the field to the front office.</p><Link href="/signup" className="button landing-primary">Be part of the journey <ArrowRight size={17}/></Link><div className="about-orb"><Globe2 size={68}/><span>ONE SPORTING COMMUNITY</span></div></section><section className="about-values"><article><span>01</span><h2>People first.</h2><p>Every sporting journey is shaped by people. We want to make it easier to find your peers, mentors, collaborators, and next opportunity.</p></article><article><span>02</span><h2>Every role matters.</h2><p>Sport is powered by athletes, coaches, medical teams, analysts, scouts, organizers, creators, and many more.</p></article><article><span>03</span><h2>Progress together.</h2><p>Our aim is to help the sports community share knowledge, open doors, and build meaningful professional relationships.</p></article></section><div className="about-note"><ShieldCheck size={20}/><p><b>We’re building in the open.</b><br/>Authentication is now being connected to Supabase. Some profile, feed, messaging, and opportunity interactions are still prototype-only while the backend integration continues.</p></div></main></PublicLayout>;
}
