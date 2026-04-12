import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNi4JsCVM89WNeVAUx0Jcq3bPk7-C0UBR5Xk_Y9zXyCeTWfL5kybDMTXGGUhfJRwIg/exec";

// ─── Google Analytics Helper ───
const trackGA = (eventName, params = {}) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, { event_category: "Landing", ...params });
  }
};
const C = { darkPurple:"#2B1E2F", copper:"#C27A3A", cream:"#E8DCCB", darkBrown:"#4A2C23", teal:"#35605A", sage:"#5B6C5D" };

const FEATURES = [
  { icon:"🏷️",title:"Filter by Tropes",desc:"Enemies to lovers? Found family? Slow burn? Find books with exactly the tropes you love — or exclude the ones you don't." },
  { icon:"⚠️",title:"Content Warnings",desc:"Know what you're getting into before you start. Include or exclude specific content warnings to read on your own terms." },
  { icon:"📚",title:"Personal Shelves",desc:"Organize your reading life with custom bookshelves. Track what you want to read, what you're reading, and what you've finished." },
  { icon:"🔍",title:"Deep Filtering",desc:"Filter by genre, page count, word count, series status, language, content rating, tags, and much more — all at once." },
  { icon:"🚫",title:"Always Ad-Free",desc:"No banner ads, no sponsored recommendations, no data sold to advertisers. Your reading experience stays clean, honest, and entirely yours." },
  { icon:"🌍",title:"Multi-Language",desc:"Discover books in Spanish, French, German, Japanese, Korean, Chinese, Italian, Portuguese, and more." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading, signUp, signIn, signInWithGoogle, enterAsGuest } = useAuth();
  const [mode, setMode] = useState("signup"); // signup | login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) navigate("/app");
  }, [user, loading, navigate]);

  // Track page view
  useEffect(() => {
    const views = JSON.parse(localStorage.getItem("rr_pageviews") || "[]");
    views.push({ page: "landing", timestamp: new Date().toISOString(), referrer: document.referrer || "direct" });
    localStorage.setItem("rr_pageviews", JSON.stringify(views));
  }, []);

  // Also log email to Google Sheet (for your email list)
  const logToSheet = async (emailAddr) => {
    try {
      await fetch(SCRIPT_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailAddr, timestamp: new Date().toISOString(), userAgent: navigator.userAgent || "",
          screenSize: `${window.screen.width}x${window.screen.height}`, language: navigator.language || "",
          referrer: document.referrer || "direct", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
          platform: navigator.platform || "", source: mode === "signup" ? "signup" : "login",
        }),
      });
    } catch {}
  };

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "signup" && !emailOptIn) { setError("You must agree to receive emails to create an account."); return; }
    if (mode === "signup") {
      const trimmedUsername = username.trim().toLowerCase();
      if (!trimmedUsername) { setError("Please choose a username."); return; }
      if (!/^[a-z0-9_]+$/.test(trimmedUsername)) { setError("Username can only contain lowercase letters, numbers, and underscores."); return; }
      if (trimmedUsername.length < 3) { setError("Username must be at least 3 characters."); return; }
      const { data: existing } = await supabase.from("profiles").select("id").eq("username", trimmedUsername).maybeSingle();
      if (existing) { setError("That username is already taken. Please choose another."); return; }
    }
    setStatus("sending"); setError("");

    if (mode === "signup") {
      const { error: err } = await signUp(email.trim(), password, username.trim().toLowerCase());
      if (err) {
        setStatus("idle");
        if (err.message.includes("already registered")) setError("This email is already registered. Try logging in.");
        else setError(err.message);
      } else {
        await logToSheet(email.trim());
        setStatus("done");
        navigate("/welcome");
      }
    } else {
      const { error: err } = await signIn(email.trim(), password);
      if (err) {
        setStatus("idle");
        if (err.message.includes("Invalid login")) setError("Wrong email or password.");
        else setError(err.message);
      } else {
        setStatus("done");
      }
    }
  };

  const handleGoogle = async () => {
    setError("");
    const { error: err } = await signInWithGoogle();
    if (err) setError(err.message);
    // Google OAuth redirects the page — no need to handle success here
  };

  if (loading) return <div style={{ background:C.darkPurple, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:C.cream, fontFamily:"'Source Sans 3',sans-serif" }}>Loading...</div>;

  return (
    <div style={{ fontFamily:"'Source Sans 3','Segoe UI',sans-serif", background:C.darkPurple, minHeight:"100vh", color:C.cream, overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}::placeholder{color:rgba(232,220,203,0.4)}input{outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}
        .feat:hover{transform:translateY(-6px) !important;border-color:rgba(194,122,58,0.5) !important}
        .cta:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(194,122,58,0.5)}
        .google-btn:hover{background:rgba(255,255,255,0.95) !important}
        .social-link:hover{background:rgba(194,122,58,0.2) !important;border-color:rgba(194,122,58,0.5) !important}
        .reader-img:hover{transform:scale(1.03) !important;box-shadow:0 12px 40px rgba(0,0,0,0.5) !important}
        .mode-toggle:hover{color:${C.copper} !important}
        @media(max-width:768px){
          .feat-grid{grid-template-columns:1fr !important}
          .hero-title{font-size:34px !important}
          .hero-desc{font-size:14px !important;padding:0 8px !important}
          .hero-form-card{margin:0 12px !important;padding:28px 20px !important}
          .readers-grid{grid-template-columns:1fr !important}
          .about-grid{grid-template-columns:1fr !important}
        }
      `}</style>

      {/* Ambient */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0 }}>
        <div style={{ position:"absolute",top:"-20%",right:"-10%",width:"600px",height:"600px",borderRadius:"50%",background:"radial-gradient(circle,rgba(194,122,58,0.07) 0%,transparent 70%)",animation:"pulse 8s ease-in-out infinite" }} />
        <div style={{ position:"absolute",bottom:"-10%",left:"-10%",width:"500px",height:"500px",borderRadius:"50%",background:"radial-gradient(circle,rgba(53,96,90,0.07) 0%,transparent 70%)",animation:"pulse 10s ease-in-out infinite 2s" }} />
      </div>

      {/* Nav */}
      <nav style={{ position:"relative",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 32px",borderBottom:"1px solid rgba(232,220,203,0.06)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
          <span style={{ fontSize:"22px" }}>📖</span>
          <span style={{ fontFamily:"'Playfair Display',serif",fontSize:"20px",color:C.copper,fontWeight:700,fontStyle:"italic" }}>Readers' Realm</span>
          <span style={{ fontSize:"9px",padding:"3px 8px",background:"rgba(194,122,58,0.15)",border:"1px solid rgba(194,122,58,0.3)",borderRadius:"10px",color:C.copper,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase" }}>BETA</span>
        </div>
        <div style={{ display:"flex",gap:"20px" }}>
          <a href="#about" style={{ color:"rgba(232,220,203,0.5)",textDecoration:"none",fontSize:"13px",fontWeight:500 }}>About</a>
          <a href="#features" style={{ color:"rgba(232,220,203,0.5)",textDecoration:"none",fontSize:"13px",fontWeight:500 }}>Features</a>
          <a href="#join" style={{ color:"rgba(232,220,203,0.5)",textDecoration:"none",fontSize:"13px",fontWeight:500 }}>Join</a>
        </div>
      </nav>

      {/* Hero */}
      <section id="join" style={{ position:"relative",zIndex:1,padding:"80px 32px 90px",textAlign:"center",backgroundImage:"url(/images/library.jpg)",backgroundSize:"cover",backgroundPosition:"center" }}>
        <div style={{ position:"absolute",inset:0,background:"rgba(43,30,47,0.88)",zIndex:0 }} />
        <div style={{ position:"relative",zIndex:2,maxWidth:"700px",margin:"0 auto" }}>
          <div style={{ animation:"fadeUp 0.8s ease-out",fontSize:"12px",letterSpacing:"4px",color:C.copper,fontWeight:600,textTransform:"uppercase",marginBottom:"24px" }}>WHERE EVERY BOOK FINDS ITS READER</div>
          <h1 className="hero-title" style={{ fontFamily:"'Playfair Display',serif",fontSize:"56px",fontWeight:800,lineHeight:1.1,marginBottom:"24px",animation:"fadeUp 0.8s ease-out 0.1s both" }}>
            Discover Books on<br/>
            <span style={{ color:C.copper,fontStyle:"italic",backgroundImage:`linear-gradient(90deg,${C.copper},#E8A862,${C.copper})`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s linear infinite" }}>Your Terms</span>
          </h1>
          <p className="hero-desc" style={{ fontSize:"17px",lineHeight:1.8,color:"rgba(232,220,203,0.7)",maxWidth:"580px",margin:"0 auto 40px",animation:"fadeUp 0.8s ease-out 0.2s both" }}>
            A literary sanctuary for readers who know exactly what they want — and exactly what they don't. Filter by tropes, content warnings, and specific themes to find your next perfect read.
          </p>

          {/* Auth Form Card */}
          <div className="hero-form-card" style={{ animation:"fadeUp 0.8s ease-out 0.3s both",maxWidth:"520px",margin:"0 auto",background:"rgba(26,18,32,0.7)",border:"1px solid rgba(194,122,58,0.2)",borderRadius:"18px",padding:"32px 28px",backdropFilter:"blur(12px)" }}>
            {status === "done" ? (
              <div>
                <div style={{ fontSize:"40px",marginBottom:"8px" }}>🎉</div>
                <div style={{ fontSize:"18px",fontWeight:700,color:C.cream }}>
                  {mode === "signup" ? "Account created!" : "Welcome back!"}
                </div>
                <div style={{ fontSize:"13px",color:"rgba(232,220,203,0.5)",marginTop:"4px" }}>Redirecting to the app...</div>
              </div>
            ) : (
              <>
                {/* Toggle signup/login */}
                <div style={{ display:"flex",justifyContent:"center",gap:"4px",marginBottom:"24px",background:"rgba(43,30,47,0.6)",borderRadius:"10px",padding:"4px" }}>
                  <button onClick={()=>{setMode("signup");setError("");trackGA("auth_tab_click",{tab:"signup"});}} style={{ flex:1,padding:"10px",border:"none",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",color:mode==="signup"?"#fff":"rgba(232,220,203,0.5)",background:mode==="signup"?"rgba(194,122,58,0.4)":"transparent",transition:"all 0.2s" }}>Sign Up</button>
                  <button onClick={()=>{setMode("login");setError("");setEmailOptIn(false);trackGA("auth_tab_click",{tab:"login"});}} style={{ flex:1,padding:"10px",border:"none",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",color:mode==="login"?"#fff":"rgba(232,220,203,0.5)",background:mode==="login"?"rgba(194,122,58,0.4)":"transparent",transition:"all 0.2s" }}>Log In</button>
                </div>

                {/* Google button */}
                <button className="google-btn" onClick={()=>{trackGA("google_signup_click");handleGoogle();}} style={{ width:"100%",padding:"14px 20px",background:"#fff",border:"1px solid rgba(0,0,0,0.1)",borderRadius:"10px",fontSize:"14px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",color:"#333",marginBottom:"16px",transition:"all 0.2s" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>

                <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px" }}>
                  <div style={{ flex:1,height:"1px",background:"rgba(232,220,203,0.1)" }} />
                  <span style={{ fontSize:"11px",color:"rgba(232,220,203,0.35)",fontWeight:500 }}>or use email</span>
                  <div style={{ flex:1,height:"1px",background:"rgba(232,220,203,0.1)" }} />
                </div>

                {/* Email + Password */}
                <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}
                  style={{ width:"100%",padding:"14px 18px",background:"rgba(43,30,47,0.8)",border:"1px solid rgba(194,122,58,0.25)",borderRadius:"10px",color:C.cream,fontSize:"14px",marginBottom:"10px" }} />
                <input type="password" placeholder={mode==="signup"?"Create a password (6+ characters)":"Password"} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  style={{ width:"100%",padding:"14px 18px",background:"rgba(43,30,47,0.8)",border:"1px solid rgba(194,122,58,0.25)",borderRadius:"10px",color:C.cream,fontSize:"14px",marginBottom:"10px" }} />

                {mode === "signup" && (
                  <div style={{ marginBottom:"14px" }}>
                    <input type="text" placeholder="Choose a username (e.g. bookworm_42)" value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))}
                      style={{ width:"100%",padding:"14px 18px",background:"rgba(43,30,47,0.8)",border:"1px solid rgba(194,122,58,0.25)",borderRadius:"10px",color:C.cream,fontSize:"14px" }} />
                    <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"11px",marginTop:"5px",paddingLeft:"4px" }}>Friends will find you by this username. Lowercase letters, numbers, and underscores only.</div>
                  </div>
                )}

                {mode === "signup" && (
                  <label style={{ display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"16px",cursor:"pointer",padding:"10px 12px",background: emailOptIn ? "rgba(53,96,90,0.12)" : "rgba(232,220,203,0.03)",border: emailOptIn ? "1px solid rgba(53,96,90,0.3)" : "1px solid rgba(232,220,203,0.08)",borderRadius:"10px",transition:"all 0.2s" }}>
                    <input type="checkbox" checked={emailOptIn} onChange={e=>setEmailOptIn(e.target.checked)}
                      style={{ marginTop:"2px",accentColor:C.copper,width:"16px",height:"16px",cursor:"pointer",flexShrink:0 }} />
                    <span style={{ fontSize:"12px",color:"rgba(232,220,203,0.7)",lineHeight:1.5 }}>
                      I agree to receive emails from Readers' Realm about updates, features, and launch news. <span style={{ color:"#E87C5A",fontSize:"11px" }}>*Required</span>
                    </span>
                  </label>
                )}

                <button className="cta" onClick={()=>{trackGA(mode==="signup"?"signup_submit_click":"login_submit_click");handleSubmit();}} disabled={status==="sending"}
                  style={{ width:"100%",padding:"15px 24px",background:`linear-gradient(135deg,${C.copper},#A86830)`,border:"none",color:"#fff",fontSize:"15px",fontWeight:700,cursor:status==="sending"?"wait":"pointer",borderRadius:"10px",letterSpacing:"0.5px",transition:"all 0.3s" }}>
                  {status === "sending" ? "Please wait..." : mode === "signup" ? "Create Account & Get Access" : "Log In"}
                </button>

                {error && <div style={{ color:"#E87C5A",fontSize:"13px",marginTop:"10px",padding:"8px 12px",background:"rgba(232,124,90,0.1)",borderRadius:"8px",border:"1px solid rgba(232,124,90,0.2)" }}>{error}</div>}

                <p style={{ fontSize:"13px",color:"rgba(232,220,203,0.7)",lineHeight:1.7,marginTop:"18px" }}>
                  {mode === "signup"
                    ? "Readers' Realm is currently in beta. By creating an account, you're signing up to experience what membership would look like — and you'll be the first to know when we officially launch."
                    : "Welcome back! Log in to access your bookshelves and continue discovering."
                  }
                </p>
                <div onClick={() => { trackGA("guest_continue_click"); enterAsGuest(); navigate("/app"); }} style={{ marginTop:"14px",fontSize:"13px",color:"rgba(232,220,203,0.45)",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:"3px",transition:"color 0.2s" }} onMouseOver={e=>e.target.style.color=C.cream} onMouseOut={e=>e.target.style.color="rgba(232,220,203,0.45)"}>
                  Continue as guest →
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ position:"relative",zIndex:1,padding:"60px 32px",borderTop:"1px solid rgba(232,220,203,0.06)" }}>
        <div style={{ maxWidth:"800px",margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:"40px" }}>
            <div style={{ fontSize:"11px",letterSpacing:"3px",color:C.copper,fontWeight:600,textTransform:"uppercase",marginBottom:"10px" }}>About the Project</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700 }}>Why <span style={{ color:C.copper,fontStyle:"italic" }}>Readers' Realm?</span></h2>
          </div>
          <div className="about-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px" }}>
            {[
              { icon:"💡",title:"The Problem",text:"Choosing a new book shouldn't feel like a gamble. Existing platforms don't tell you about content warnings, tropes, or let you filter the way readers actually think about books." },
              { icon:"🎯",title:"Our Solution",text:"We built an AO3-inspired tagging and filtering system for published books. Filter by tropes you love, exclude content you'd rather avoid, and discover reads that are genuinely right for you." },
              { icon:"🚀",title:"Where We're Going",text:"This is a beta prototype — we're actively building the full-scale version with cover images, user reviews, reading lists, social features, and a massive expanded library." },
              { icon:"🤝",title:"Your Input Matters",text:"Every feature decision is guided by early users like you. By signing up, you help shape what Readers' Realm becomes. We read every piece of feedback." },
            ].map((item,i) => (
              <div key={i} style={{ padding:"24px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"14px" }}>
                <div style={{ fontSize:"24px",marginBottom:"10px" }}>{item.icon}</div>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:"16px",color:C.cream,marginBottom:"8px" }}>{item.title}</h3>
                <p style={{ fontSize:"13px",color:"rgba(232,220,203,0.55)",lineHeight:1.7 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Readers */}
      <section style={{ position:"relative",zIndex:1,padding:"50px 32px",maxWidth:"900px",margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:"32px" }}>
          <div style={{ fontSize:"11px",letterSpacing:"3px",color:C.copper,fontWeight:600,textTransform:"uppercase",marginBottom:"10px" }}>Built for Readers Like You</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700 }}>Whether you read solo or share stories with loved ones</h2>
          <p style={{ fontSize:"14px",color:"rgba(232,220,203,0.5)",marginTop:"10px",maxWidth:"500px",margin:"10px auto 0" }}>Readers' Realm is designed for every kind of reader — from the casual page-turner to the devoted bookworm.</p>
        </div>
        <div className="readers-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px" }}>
          <div className="reader-img" style={{ borderRadius:"16px",overflow:"hidden",aspectRatio:"4/3",position:"relative",transition:"all 0.4s" }}>
            <img src="/images/reader1.jpg" alt="Person reading" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 50%,rgba(43,30,47,0.8) 100%)" }} />
            <div style={{ position:"absolute",bottom:"16px",left:"20px",right:"20px" }}>
              <div style={{ fontSize:"15px",fontWeight:700,color:C.cream }}>Your next favorite book is waiting</div>
              <div style={{ fontSize:"12px",color:"rgba(232,220,203,0.6)",marginTop:"4px" }}>Filter by what matters to you</div>
            </div>
          </div>
          <div className="reader-img" style={{ borderRadius:"16px",overflow:"hidden",aspectRatio:"4/3",position:"relative",transition:"all 0.4s" }}>
            <img src="/images/reader2.jpg" alt="Parent and child reading" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 50%,rgba(43,30,47,0.8) 100%)" }} />
            <div style={{ position:"absolute",bottom:"16px",left:"20px",right:"20px" }}>
              <div style={{ fontSize:"15px",fontWeight:700,color:C.cream }}>Safe reads for every age</div>
              <div style={{ fontSize:"12px",color:"rgba(232,220,203,0.6)",marginTop:"4px" }}>Content warnings so you always know what to expect</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ position:"relative",zIndex:1,padding:"60px 32px",maxWidth:"1000px",margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:"40px" }}>
          <div style={{ fontSize:"11px",letterSpacing:"3px",color:C.copper,fontWeight:600,textTransform:"uppercase",marginBottom:"10px" }}>Features</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700 }}>Book Discovery, <span style={{ color:C.copper,fontStyle:"italic" }}>Reimagined</span></h2>
        </div>
        <div className="feat-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"18px" }}>
          {FEATURES.map((f,i) => (
            <div key={i} className="feat" style={{ padding:"24px 20px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"14px",transition:"all 0.3s",cursor:"default" }}>
              <div style={{ fontSize:"26px",marginBottom:"12px" }}>{f.icon}</div>
              <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:"15px",color:C.cream,fontWeight:600,marginBottom:"6px" }}>{f.title}</h3>
              <p style={{ fontSize:"12px",color:"rgba(232,220,203,0.5)",lineHeight:1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:"relative",zIndex:1,padding:"50px 32px 60px",maxWidth:"800px",margin:"0 auto",textAlign:"center" }}>
        <div style={{ background:"linear-gradient(160deg,rgba(43,30,47,0.8),rgba(26,18,32,0.9))",border:"1px solid rgba(194,122,58,0.15)",borderRadius:"20px",padding:"36px 28px",position:"relative",overflow:"hidden" }}>
          <div style={{ position:"absolute",top:0,left:0,right:0,height:"3px",background:`linear-gradient(90deg,transparent,${C.copper},transparent)` }} />
          <div style={{ fontSize:"9px",padding:"3px 10px",display:"inline-block",background:"rgba(53,96,90,0.2)",border:"1px solid rgba(53,96,90,0.3)",borderRadius:"10px",color:C.teal,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"14px" }}>BETA PROTOTYPE</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,marginBottom:"10px" }}>Ready to Find Your Next Favorite Book?</h2>
          <p style={{ fontSize:"14px",color:"rgba(232,220,203,0.55)",lineHeight:1.7,maxWidth:"460px",margin:"0 auto 24px" }}>
            Create a free account to get instant access to the prototype.
          </p>
          <a href="#join" onClick={()=>trackGA("get_early_access_click")} style={{ display:"inline-block",padding:"14px 36px",background:`linear-gradient(135deg,${C.copper},#A86830)`,color:"#fff",borderRadius:"10px",fontSize:"15px",fontWeight:700,textDecoration:"none" }}>Get Early Access →</a>
        </div>
      </section>

      {/* Social */}
      <section style={{ position:"relative",zIndex:1,padding:"40px 32px",maxWidth:"600px",margin:"0 auto",textAlign:"center" }}>
        <div style={{ fontSize:"11px",letterSpacing:"2px",color:"rgba(232,220,203,0.4)",fontWeight:600,textTransform:"uppercase",marginBottom:"16px" }}>Follow Our Journey</div>
        <div style={{ display:"flex",justifyContent:"center",gap:"12px",flexWrap:"wrap" }}>
          {[
            { name:"Instagram",icon:"📸",url:"https://www.instagram.com/readersrealmofficial" },
            { name:"TikTok",icon:"🎵",url:"http://www.tiktok.com/@readersrealm.official" },
            { name:"Facebook",icon:"👤",url:"https://www.facebook.com/profile.php?id=61575479098965" },
            { name:"Linktree",icon:"🔗",url:"https://linktr.ee/readersrealmofficial" },
          ].map((s,i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" onClick={()=>trackGA("social_link_click",{platform:s.name})} className="social-link" style={{ display:"flex",alignItems:"center",gap:"8px",padding:"10px 18px",background:"rgba(232,220,203,0.04)",border:"1px solid rgba(232,220,203,0.1)",borderRadius:"10px",textDecoration:"none",color:C.cream,fontSize:"13px",fontWeight:500,transition:"all 0.3s" }}>
              <span>{s.icon}</span>{s.name}
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position:"relative",zIndex:1,textAlign:"center",padding:"20px 32px 28px",borderTop:"1px solid rgba(232,220,203,0.06)" }}>
        <span style={{ fontFamily:"'Playfair Display',serif",color:"rgba(194,122,58,0.4)",fontSize:"13px" }}>Readers' Realm</span>
        <span style={{ color:"rgba(232,220,203,0.2)",fontSize:"11px",marginLeft:"8px" }}>— Beta Prototype</span>
      </footer>
    </div>
  );
}
