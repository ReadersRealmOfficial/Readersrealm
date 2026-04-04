import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNi4JsCVM89WNeVAUx0Jcq3bPk7-C0UBR5Xk_Y9zXyCeTWfL5kybDMTXGGUhfJRwIg/exec";

const C = { darkPurple:"#2B1E2F", copper:"#C27A3A", cream:"#E8DCCB", darkBrown:"#4A2C23", teal:"#35605A", sage:"#5B6C5D" };

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("rr_access") === "true") navigate("/app");
  }, [navigate]);

  // Track page view
  useEffect(() => {
    const entry = { page: "landing", timestamp: new Date().toISOString(), referrer: document.referrer || "direct" };
    const views = JSON.parse(localStorage.getItem("rr_pageviews") || "[]");
    views.push(entry);
    localStorage.setItem("rr_pageviews", JSON.stringify(views));
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@") || !email.includes(".")) { setError("Please enter a valid email."); return; }
    setStatus("sending"); setError("");
    const data = {
      email: email.trim(), timestamp: new Date().toISOString(), userAgent: navigator.userAgent || "",
      screenSize: `${window.screen.width}x${window.screen.height}`, language: navigator.language || "",
      referrer: document.referrer || "direct", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      platform: navigator.platform || "", source: "landing_page",
    };
    try {
      await fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setStatus("done");
      localStorage.setItem("rr_access", "true");
      localStorage.setItem("rr_email", email.trim());
      // Track conversion
      const clicks = JSON.parse(localStorage.getItem("rr_clicks") || "[]");
      clicks.push({ action: "email_signup", email: email.trim(), timestamp: new Date().toISOString() });
      localStorage.setItem("rr_clicks", JSON.stringify(clicks));
      setTimeout(() => navigate("/app"), 1600);
    } catch { setStatus("error"); setError("Something went wrong. Please try again."); }
  };

  const FEATURES = [
    { icon: "🏷️", title: "Filter by Tropes", desc: "Enemies to lovers? Found family? Slow burn? Find books with exactly the tropes you love — or exclude the ones you don't." },
    { icon: "⚠️", title: "Content Warnings", desc: "Know what you're getting into before you start. Include or exclude specific content warnings to read on your own terms." },
    { icon: "📚", title: "Personal Shelves", desc: "Organize your reading life with custom bookshelves. Track what you want to read, what you're reading, and what you've finished." },
    { icon: "🔍", title: "Deep Filtering", desc: "Filter by genre, page count, word count, series status, language, content rating, tags, and much more — all at once." },
    { icon: "🚫", title: "Always Ad-Free", desc: "No banner ads, no sponsored recommendations, no data sold to advertisers. Your reading experience stays clean, honest, and entirely yours." },
    { icon: "🌍", title: "Multi-Language", desc: "Discover books in Spanish, French, German, Japanese, Korean, Chinese, Italian, Portuguese, and more." },
  ];

  return (
    <div style={{ fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif", background: C.darkPurple, minHeight: "100vh", color: C.cream, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}::placeholder{color:rgba(232,220,203,0.4)}input{outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}
        .feat:hover{transform:translateY(-6px) !important;border-color:rgba(194,122,58,0.5) !important}
        .cta:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(194,122,58,0.5)}
        .social-link:hover{background:rgba(194,122,58,0.2) !important;border-color:rgba(194,122,58,0.5) !important}
        .reader-img:hover{transform:scale(1.03) !important;box-shadow:0 12px 40px rgba(0,0,0,0.5) !important}
        @media(max-width:768px){
          .feat-grid{grid-template-columns:1fr !important}
          .hero-title{font-size:34px !important}
          .hero-desc{font-size:15px !important;padding:0 8px !important}
          .hero-form-card{margin:0 12px !important;padding:28px 20px !important}
          .readers-grid{grid-template-columns:1fr !important}
          .about-grid{grid-template-columns:1fr !important}
        }
      `}</style>

      {/* Ambient orbs */}
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

      {/* Hero — centered layout with library background */}
      <section id="join" style={{
        position:"relative",zIndex:1,padding:"80px 32px 90px",textAlign:"center",
        backgroundImage:"url(/images/library.jpg)",backgroundSize:"cover",backgroundPosition:"center",
      }}>
        {/* Dark overlay so text is readable */}
        <div style={{ position:"absolute",inset:0,background:"rgba(43,30,47,0.88)",zIndex:0 }} />

        <div style={{ position:"relative",zIndex:2,maxWidth:"700px",margin:"0 auto" }}>
          <div style={{ animation:"fadeUp 0.8s ease-out",fontSize:"12px",letterSpacing:"4px",color:C.copper,fontWeight:600,textTransform:"uppercase",marginBottom:"24px" }}>
            WHERE EVERY BOOK FINDS ITS READER
          </div>

          <h1 className="hero-title" style={{
            fontFamily:"'Playfair Display',serif",fontSize:"56px",fontWeight:800,lineHeight:1.1,
            marginBottom:"24px",animation:"fadeUp 0.8s ease-out 0.1s both",
          }}>
            Discover Books on<br/>
            <span style={{
              color:C.copper,fontStyle:"italic",
              backgroundImage:`linear-gradient(90deg,${C.copper},#E8A862,${C.copper})`,
              backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              animation:"shimmer 4s linear infinite",
            }}>Your Terms</span>
          </h1>

          <p className="hero-desc" style={{
            fontSize:"17px",lineHeight:1.8,color:"rgba(232,220,203,0.7)",
            maxWidth:"580px",margin:"0 auto 40px",animation:"fadeUp 0.8s ease-out 0.2s both",
          }}>
            A literary sanctuary for readers who know exactly what they want — and exactly what they don't. Filter by tropes, content warnings, and specific themes to find your next perfect read.
          </p>

          {/* Email Form Card */}
          <div className="hero-form-card" style={{
            animation:"fadeUp 0.8s ease-out 0.3s both",
            maxWidth:"520px",margin:"0 auto",
            background:"rgba(26,18,32,0.7)",border:"1px solid rgba(194,122,58,0.2)",
            borderRadius:"18px",padding:"32px 28px",backdropFilter:"blur(12px)",
          }}>
            {status === "done" ? (
              <div>
                <div style={{ fontSize:"40px",marginBottom:"8px" }}>🎉</div>
                <div style={{ fontSize:"18px",fontWeight:700,color:C.cream }}>You're in!</div>
                <div style={{ fontSize:"13px",color:"rgba(232,220,203,0.5)",marginTop:"4px" }}>Redirecting to the app...</div>
              </div>
            ) : (
              <>
                <input type="email" placeholder="Enter your email address" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  style={{ width:"100%",padding:"16px 20px",background:"rgba(43,30,47,0.8)",border:"1px solid rgba(194,122,58,0.25)",borderRadius:"10px",color:C.cream,fontSize:"15px",marginBottom:"14px",textAlign:"center" }} />
                <button className="cta" onClick={handleSubmit} disabled={status==="sending"}
                  style={{ width:"100%",padding:"15px 24px",background:`linear-gradient(135deg,${C.copper},#A86830)`,border:"none",color:"#fff",fontSize:"15px",fontWeight:700,cursor:status==="sending"?"wait":"pointer",borderRadius:"10px",letterSpacing:"0.5px",transition:"all 0.3s" }}>
                  {status === "sending" ? "Joining..." : "Get Early Access"}
                </button>
                {error && <div style={{ color:C.copper,fontSize:"12px",marginTop:"10px" }}>{error}</div>}
                <p style={{ fontSize:"13px",color:"rgba(232,220,203,0.7)",lineHeight:1.7,marginTop:"18px" }}>
                  Readers' Realm is currently in beta. By entering your email, you're signing up to experience what membership would look like — and you'll be the first to know when we officially launch.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ position:"relative",zIndex:1,padding:"60px 32px",borderTop:"1px solid rgba(232,220,203,0.06)" }}>
        <div style={{ maxWidth:"800px",margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:"40px" }}>
            <div style={{ fontSize:"11px",letterSpacing:"3px",color:C.copper,fontWeight:600,textTransform:"uppercase",marginBottom:"10px" }}>About the Project</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,color:C.cream }}>Why <span style={{ color:C.copper,fontStyle:"italic" }}>Readers' Realm?</span></h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px" }}>
            {[
              { icon:"💡", title:"The Problem", text:"Choosing a new book shouldn't feel like a gamble. Existing platforms don't tell you about content warnings, tropes, or let you filter the way readers actually think about books." },
              { icon:"🎯", title:"Our Solution", text:"We built an AO3-inspired tagging and filtering system for published books. Filter by tropes you love, exclude content you'd rather avoid, and discover reads that are genuinely right for you." },
              { icon:"🚀", title:"Where We're Going", text:"This is a beta prototype — we're actively building the full-scale version with cover images, user reviews, reading lists, social features, and a massive expanded library." },
              { icon:"🤝", title:"Your Input Matters", text:"Every feature decision is guided by early users like you. By signing up, you help shape what Readers' Realm becomes. We read every piece of feedback." },
            ].map((item, i) => (
              <div key={i} style={{ padding:"24px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"14px" }}>
                <div style={{ fontSize:"24px",marginBottom:"10px" }}>{item.icon}</div>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:"16px",color:C.cream,marginBottom:"8px" }}>{item.title}</h3>
                <p style={{ fontSize:"13px",color:"rgba(232,220,203,0.55)",lineHeight:1.7 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Readers Section — people reading images */}
      <section style={{ position:"relative",zIndex:1,padding:"50px 32px",maxWidth:"900px",margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:"32px" }}>
          <div style={{ fontSize:"11px",letterSpacing:"3px",color:C.copper,fontWeight:600,textTransform:"uppercase",marginBottom:"10px" }}>Built for Readers Like You</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:C.cream }}>Whether you read solo or share stories with loved ones</h2>
          <p style={{ fontSize:"14px",color:"rgba(232,220,203,0.5)",marginTop:"10px",maxWidth:"500px",margin:"10px auto 0" }}>Readers' Realm is designed for every kind of reader — from the casual page-turner to the devoted bookworm.</p>
        </div>
        <div className="readers-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px" }}>
          <div className="reader-img" style={{ borderRadius:"16px",overflow:"hidden",aspectRatio:"4/3",position:"relative",transition:"all 0.4s",cursor:"default" }}>
            <img src="/images/reader1.jpg" alt="Person reading a book" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 50%,rgba(43,30,47,0.8) 100%)" }} />
            <div style={{ position:"absolute",bottom:"16px",left:"20px",right:"20px" }}>
              <div style={{ fontSize:"15px",fontWeight:700,color:C.cream }}>Your next favorite book is waiting</div>
              <div style={{ fontSize:"12px",color:"rgba(232,220,203,0.6)",marginTop:"4px" }}>Filter by what matters to you</div>
            </div>
          </div>
          <div className="reader-img" style={{ borderRadius:"16px",overflow:"hidden",aspectRatio:"4/3",position:"relative",transition:"all 0.4s",cursor:"default" }}>
            <img src="/images/reader2.jpg" alt="Parent and child reading together" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
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
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,color:C.cream }}>Book Discovery, <span style={{ color:C.copper,fontStyle:"italic" }}>Reimagined</span></h2>
        </div>
        <div className="feat-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"18px" }}>
          {FEATURES.map((f, i) => (
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
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:C.cream,marginBottom:"10px" }}>Ready to Find Your Next Favorite Book?</h2>
          <p style={{ fontSize:"14px",color:"rgba(232,220,203,0.55)",lineHeight:1.7,maxWidth:"460px",margin:"0 auto 24px" }}>
            Enter your email to get instant access to the prototype. Help us shape what Readers' Realm becomes.
          </p>
          <a href="#join" style={{ display:"inline-block",padding:"13px 32px",background:`linear-gradient(135deg,${C.copper},#A86830)`,color:"#fff",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:700,textDecoration:"none" }}>Get Early Access →</a>
        </div>
      </section>

      {/* Social Links */}
      <section style={{ position:"relative",zIndex:1,padding:"40px 32px",maxWidth:"600px",margin:"0 auto",textAlign:"center" }}>
        <div style={{ fontSize:"11px",letterSpacing:"2px",color:"rgba(232,220,203,0.4)",fontWeight:600,textTransform:"uppercase",marginBottom:"16px" }}>Follow Our Journey</div>
        <div style={{ display:"flex",justifyContent:"center",gap:"12px",flexWrap:"wrap" }}>
          {[
            { name:"Instagram",icon:"📸",url:"https://www.instagram.com/readersrealmofficial" },
            { name:"TikTok",icon:"🎵",url:"http://www.tiktok.com/@readersrealm.official" },
            { name:"Facebook",icon:"👤",url:"https://www.facebook.com/profile.php?id=61575479098965" },
            { name:"Linktree",icon:"🔗",url:"https://linktr.ee/readersrealmofficial" },
            { name:"Linktree",icon:"🔗",url:"https://linktr.ee/readersrealmofficial" },
          ].map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" className="social-link"
              style={{ display:"flex",alignItems:"center",gap:"8px",padding:"10px 18px",background:"rgba(232,220,203,0.04)",border:"1px solid rgba(232,220,203,0.1)",borderRadius:"10px",textDecoration:"none",color:C.cream,fontSize:"13px",fontWeight:500,transition:"all 0.3s" }}>
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
