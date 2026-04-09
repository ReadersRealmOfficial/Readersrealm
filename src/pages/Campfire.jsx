import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";

const C = { darkPurple:"#2B1E2F", copper:"#C27A3A", cream:"#E8DCCB", darkBrown:"#4A2C23", teal:"#35605A", sage:"#5B6C5D" };

// Simulated campfire readers (in production, this comes from Supabase Realtime Presence)
const MOCK_READERS = [
  { id:"1", name:"BookWorm42", book:"Fourth Wing", x:25, y:55 },
  { id:"2", name:"LitLover", book:"Circe", x:65, y:50 },
  { id:"3", name:"PageTurner", book:"Dune", x:42, y:65 },
  { id:"4", name:"NovelNerd", book:"The Midnight Library", x:78, y:60 },
];

export default function Campfire() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [readers, setReaders] = useState(MOCK_READERS);
  const [streak, setStreak] = useState(3);
  const [nudges, setNudges] = useState([]);
  const [embers, setEmbers] = useState([]);
  const [myBook, setMyBook] = useState("");
  const [isAtFire, setIsAtFire] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const emberIdRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  // Simulated presence — in production this uses Supabase Realtime
  useEffect(() => {
    if (!isAtFire || !isAuthenticated) return;
    // Would register presence here with supabase.channel('campfire').track(...)
    return () => { /* untrack */ };
  }, [isAtFire, isAuthenticated]);

  const isFridayNight = (() => {
    const now = new Date();
    return now.getDay() === 5 && now.getHours() >= 18;
  })();

  const joinFire = () => {
    if (!myBook.trim()) return;
    setIsAtFire(true);
    setReaders(prev => [...prev, { id:"me", name: user?.email?.split("@")[0] || "You", book: myBook, x: 50, y: 45 }]);
  };

  const sendNudge = (targetId, type) => {
    const target = readers.find(r => r.id === targetId);
    if (!target) return;
    setNudges(prev => [...prev, { id: Date.now(), type, to: target.name }]);
    // Spawn embers
    for (let i = 0; i < (type === "log" ? 8 : 4); i++) {
      const eid = ++emberIdRef.current;
      setTimeout(() => {
        setEmbers(prev => [...prev, { id: eid, x: 45 + Math.random() * 10, y: 70, dx: (Math.random() - 0.5) * 30, delay: Math.random() * 0.5 }]);
        setTimeout(() => setEmbers(prev => prev.filter(e => e.id !== eid)), 2000);
      }, i * 100);
    }
    setTimeout(() => setNudges(prev => prev.filter(n => n.id !== nudges.length)), 3000);
  };

  const toggleAudio = () => {
    // Placeholder — audio element would be: <audio ref={audioRef} src="/sounds/campfire.mp3" loop />
    setAudioPlaying(!audioPlaying);
  };

  return (
    <div style={{ fontFamily:"'Source Sans 3','Segoe UI',sans-serif", background:"linear-gradient(180deg, #0d0a0f 0%, #1a1220 30%, #2B1E2F 100%)", minHeight:"100vh", color:C.cream, overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes flicker{0%,100%{opacity:1;transform:scaleY(1)}25%{opacity:0.85;transform:scaleY(1.03)}50%{opacity:0.95;transform:scaleY(0.97)}75%{opacity:0.9;transform:scaleY(1.02)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes rise{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-80px) scale(0.3)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(194,122,58,0.3)}50%{box-shadow:0 0 40px rgba(194,122,58,0.5)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sparkle{0%{opacity:0;transform:translateY(0) translateX(var(--dx))}30%{opacity:1}100%{opacity:0;transform:translateY(-60px) translateX(var(--dx))}}
        .reader-avatar:hover{transform:scale(1.1) !important}
        .reader-avatar:hover .nudge-menu{display:flex !important}
        .nudge-btn:hover{background:rgba(194,122,58,0.3) !important;transform:scale(1.1)}
        @media(max-width:768px){.fire-scene{min-height:400px !important}.reader-label{font-size:9px !important}}
      `}</style>

      {/* Nav */}
      <nav style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 24px",borderBottom:"1px solid rgba(232,220,203,0.06)",background:"rgba(13,10,15,0.8)",backdropFilter:"blur(8px)",position:"relative",zIndex:50 }}>
        <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
          <Link to="/app" style={{ color:C.cream,textDecoration:"none",fontSize:"13px",fontWeight:500,display:"flex",alignItems:"center",gap:"6px" }}>← <span style={{ fontFamily:"'Playfair Display',serif",color:C.copper,fontWeight:700,fontStyle:"italic",fontSize:"18px" }}>Readers' Realm</span></Link>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"6px",padding:"6px 12px",background:"rgba(194,122,58,0.15)",borderRadius:"20px" }}>
            <span style={{ fontSize:"14px" }}>🔥</span>
            <span style={{ fontSize:"12px",fontWeight:700,color:C.copper }}>{streak} day streak</span>
          </div>
          <button onClick={toggleAudio} style={{ padding:"6px 12px",background:"rgba(232,220,203,0.05)",border:"1px solid rgba(232,220,203,0.1)",borderRadius:"8px",color:C.cream,fontSize:"12px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px" }}>
            {audioPlaying ? "🔊" : "🔇"} Sound
          </button>
          <span style={{ color:"rgba(232,220,203,0.4)",fontSize:"12px" }}>{readers.length} by the fire</span>
        </div>
      </nav>

      {/* Friday Night Fireside Banner */}
      {isFridayNight && (
        <div style={{ textAlign:"center",padding:"10px 20px",background:"linear-gradient(90deg,rgba(194,122,58,0.15),rgba(194,122,58,0.25),rgba(194,122,58,0.15))",borderBottom:"1px solid rgba(194,122,58,0.2)" }}>
          <span style={{ fontSize:"13px",color:C.copper,fontWeight:700 }}>🔥 Friday Night Fireside — The fire burns brighter with more readers! Invite a friend.</span>
        </div>
      )}

      {/* Main Campfire Scene */}
      <div className="fire-scene" style={{ position:"relative",minHeight:"calc(100vh - 100px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px" }}>

        {/* Ambient glow */}
        <div style={{ position:"absolute",left:"50%",top:"60%",transform:"translate(-50%,-50%)",width:"400px",height:"400px",borderRadius:"50%",background:"radial-gradient(circle,rgba(194,122,58,0.12) 0%,rgba(194,122,58,0.04) 40%,transparent 70%)",animation:"glow 4s ease-in-out infinite",pointerEvents:"none" }} />

        {/* Embers */}
        {embers.map(e => (
          <div key={e.id} style={{ position:"absolute",left:`${e.x}%`,top:`${e.y}%`,width:"4px",height:"4px",borderRadius:"50%",background:C.copper,animation:`rise 1.5s ease-out forwards`,animationDelay:`${e.delay}s`,pointerEvents:"none","--dx":`${e.dx}px` }} />
        ))}

        {/* Nudge notifications */}
        <div style={{ position:"fixed",top:"80px",right:"20px",zIndex:100,display:"flex",flexDirection:"column",gap:"6px" }}>
          {nudges.map(n => (
            <div key={n.id} style={{ padding:"10px 16px",background:"rgba(194,122,58,0.2)",border:"1px solid rgba(194,122,58,0.3)",borderRadius:"10px",fontSize:"12px",color:C.copper,animation:"fadeIn 0.3s ease-out",backdropFilter:"blur(8px)" }}>
              {n.type === "ember" ? "✨" : n.type === "log" ? "🪵" : n.type === "wave" ? "👋" : "❤️"} Sent {n.type} to {n.to}
            </div>
          ))}
        </div>

        {/* Join area (if not at fire) */}
        {!isAtFire ? (
          <div style={{ textAlign:"center",animation:"fadeIn 0.6s ease-out",position:"relative",zIndex:10 }}>
            <div style={{ fontSize:"48px",marginBottom:"16px",animation:"flicker 3s ease-in-out infinite" }}>🔥</div>
            <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,marginBottom:"8px" }}>The Campfire</h1>
            <p style={{ color:"rgba(232,220,203,0.6)",fontSize:"14px",lineHeight:1.7,maxWidth:"400px",margin:"0 auto 24px" }}>
              A cozy space to read alongside others. No chat, no pressure — just the warmth of shared reading.
            </p>
            <div style={{ maxWidth:"340px",margin:"0 auto" }}>
              <input placeholder="What are you reading right now?" value={myBook} onChange={e=>setMyBook(e.target.value)} onKeyDown={e=>e.key==="Enter"&&joinFire()}
                style={{ width:"100%",padding:"14px 18px",background:"rgba(43,30,47,0.7)",border:"1px solid rgba(194,122,58,0.25)",borderRadius:"10px",color:C.cream,fontSize:"14px",textAlign:"center",marginBottom:"12px" }} />
              <button onClick={joinFire} disabled={!myBook.trim()}
                style={{ width:"100%",padding:"14px",background:myBook.trim()?`linear-gradient(135deg,${C.copper},#A86830)`:"rgba(194,122,58,0.2)",border:"none",borderRadius:"10px",color:myBook.trim()?"#fff":"rgba(232,220,203,0.3)",fontSize:"15px",fontWeight:700,cursor:myBook.trim()?"pointer":"not-allowed",transition:"all 0.3s" }}>
                Sit by the Fire
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Fire */}
            <div style={{ position:"absolute",left:"50%",top:"65%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none" }}>
              <div style={{ fontSize:"64px",animation:"flicker 2s ease-in-out infinite",filter:"drop-shadow(0 0 20px rgba(194,122,58,0.5))" }}>🔥</div>
              <div style={{ fontSize:"10px",color:"rgba(232,220,203,0.3)",marginTop:"4px",letterSpacing:"2px" }}>THE CAMPFIRE</div>
            </div>

            {/* Readers around the fire */}
            {readers.map((r, i) => (
              <div key={r.id} className="reader-avatar" style={{
                position:"absolute", left:`${r.x}%`, top:`${r.y}%`,
                display:"flex", flexDirection:"column", alignItems:"center", gap:"4px",
                cursor:r.id==="me"?"default":"pointer",
                animation:`float ${3+i*0.5}s ease-in-out infinite`,
                animationDelay:`${i*0.3}s`,
                transition:"transform 0.2s", zIndex:10,
              }}>
                {/* Book title floating above */}
                <div className="reader-label" style={{
                  padding:"4px 10px",background:"rgba(26,18,32,0.8)",backdropFilter:"blur(4px)",
                  borderRadius:"8px",border:"1px solid rgba(232,220,203,0.08)",
                  fontSize:"10px",color:"rgba(232,220,203,0.7)",whiteSpace:"nowrap",
                  maxWidth:"120px",overflow:"hidden",textOverflow:"ellipsis",
                }}>
                  📖 {r.book}
                </div>
                {/* Avatar */}
                <div style={{
                  width:"36px",height:"36px",borderRadius:"50%",
                  background:r.id==="me"?`linear-gradient(135deg,${C.copper},#A86830)`:`linear-gradient(135deg,${C.teal},${C.sage})`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"14px",boxShadow:"0 4px 12px rgba(0,0,0,0.3)",
                  border:r.id==="me"?`2px solid ${C.copper}`:"2px solid rgba(232,220,203,0.1)",
                }}>
                  {r.id==="me"?"😊":"📚"}
                </div>
                <div style={{ fontSize:"10px",color:r.id==="me"?C.copper:"rgba(232,220,203,0.5)",fontWeight:r.id==="me"?700:400 }}>{r.name}</div>

                {/* Nudge menu (shows on hover, hidden for self) */}
                {r.id !== "me" && (
                  <div className="nudge-menu" style={{ display:"none",gap:"4px",marginTop:"2px",animation:"fadeIn 0.2s ease-out" }}>
                    {[{type:"ember",icon:"✨",label:"Ember"},{type:"log",icon:"🪵",label:"Log"},{type:"wave",icon:"👋",label:"Wave"},{type:"react",icon:"❤️",label:"React"}].map(n => (
                      <button key={n.type} className="nudge-btn" onClick={()=>sendNudge(r.id,n.type)} title={n.label}
                        style={{ width:"26px",height:"26px",borderRadius:"50%",border:"1px solid rgba(232,220,203,0.15)",background:"rgba(26,18,32,0.8)",cursor:"pointer",fontSize:"11px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s" }}>
                        {n.icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Streak display */}
        {isAtFire && (
          <div style={{ position:"absolute",bottom:"20px",left:"50%",transform:"translateX(-50%)",textAlign:"center",animation:"fadeIn 1s ease-out 0.5s both" }}>
            <div style={{ padding:"12px 24px",background:"rgba(26,18,32,0.8)",backdropFilter:"blur(8px)",borderRadius:"14px",border:"1px solid rgba(194,122,58,0.15)" }}>
              <div style={{ fontSize:"13px",color:C.copper,fontWeight:700 }}>🔥 {streak} day reading streak</div>
              <div style={{ fontSize:"11px",color:"rgba(232,220,203,0.4)",marginTop:"2px" }}>You've read by the fire {streak} days in a row</div>
            </div>
          </div>
        )}
      </div>

      {/* Coming Soon Banner */}
      <div style={{ padding:"24px 32px",borderTop:"1px solid rgba(232,220,203,0.06)",textAlign:"center",background:"rgba(26,18,32,0.5)" }}>
        <div style={{ maxWidth:"500px",margin:"0 auto" }}>
          <div style={{ fontSize:"11px",letterSpacing:"2px",color:C.copper,fontWeight:600,textTransform:"uppercase",marginBottom:"8px" }}>Coming Soon to the Campfire</div>
          <p style={{ fontSize:"13px",color:"rgba(232,220,203,0.5)",lineHeight:1.7 }}>
            🎵 Ambient fire sounds · 📅 Friday Night Fireside events with bigger fires · 📸 Shareable streak badges · 💬 Whisper mode for quiet conversations · 📖 Book Club campfire rooms
          </p>
        </div>
      </div>
    </div>
  );
}
