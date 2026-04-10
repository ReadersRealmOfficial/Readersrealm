import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { BOOKS_DB } from "./BookApp.jsx";

const C = { darkPurple:"#2B1E2F", copper:"#C27A3A", cream:"#E8DCCB", darkBrown:"#4A2C23", teal:"#35605A", sage:"#5B6C5D" };

// ─── Audio URL for campfire ambience ───
// Place the mp3 in your public/sounds/ folder as campfire-ambience.mp3
const CAMPFIRE_AUDIO_URL = "/sounds/campfire-ambience.mp3";

// ─── Campfire room capacity ───
const NORMAL_CAP = 15;
const FRIDAY_NIGHT_CAP = 50;

// ─── Stars for background ───
const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 35,
  size: 0.6 + Math.random() * 2, delay: Math.random() * 5,
}));

// ─── Rising embers ───
const RISING_EMBERS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  startX: 45 + Math.random() * 10,
  drift: (Math.random() - 0.5) * 50,
  size: 2 + Math.random() * 4,
  duration: 2.5 + Math.random() * 3,
  delay: Math.random() * 5,
  brightness: 0.5 + Math.random() * 0.5,
}));

// ─── Helpers ───
function isFridayNightEvent() {
  const now = new Date();
  // Convert to EST (UTC-5)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const est = new Date(utc - 5 * 3600000);
  return est.getDay() === 5 && est.getHours() >= 18 && est.getHours() < 23;
}

function getCapacity() {
  return isFridayNightEvent() ? FRIDAY_NIGHT_CAP : NORMAL_CAP;
}

function circlePos(index, total, cx, cy, rx, ry) {
  const startAngle = -90;
  const angle = startAngle + (index / total) * 360;
  const rad = (angle * Math.PI) / 180;
  return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
}

function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Campfire() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [readers, setReaders] = useState([]);
  const [isAtFire, setIsAtFire] = useState(false);
  const [myBook, setMyBook] = useState("");
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState([]);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [hoveredReader, setHoveredReader] = useState(null);
  const [notification, setNotification] = useState(null);

  // Audio state
  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [muted, setMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Timer state (local to this user only)
  const [timerState, setTimerState] = useState("stopped"); // stopped | running | paused
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);
  const [displayName, setDisplayName] = useState("");

  // Friday event
  const fridayNight = isFridayNightEvent();
  const capacity = getCapacity();

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  // ─── Load username from profiles table ───
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const loadUsername = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.username) setDisplayName(data.username);
      else if (data?.display_name) setDisplayName(data.display_name);
      else setDisplayName(user.email?.split("@")[0] || "Reader");
    };
    loadUsername();
  }, [isAuthenticated, user]);

  // ─── Load "Currently Reading" books from user shelves ───
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const loadBooks = async () => {
      try {
        const { data, error } = await supabase
          .from("user_shelves")
          .select("book_ids")
          .eq("user_id", user.id)
          .eq("shelf_name", "Currently Reading")
          .maybeSingle();
        if (!error && data && data.book_ids && data.book_ids.length > 0) {
          // book_ids are numbers like [1, 14] — look up in BOOKS_DB for full objects
          const books = data.book_ids
            .map((id) => BOOKS_DB.find((b) => b.id === id))
            .filter(Boolean);
          setCurrentlyReadingBooks(books);
        }
      } catch (e) {
        console.error("Error loading shelves:", e);
      }
    };
    loadBooks();
  }, [isAuthenticated, user]);

  // ─── Supabase Realtime Presence for actual readers ───
  // Only real users appear around the fire — no fake/mock users
  useEffect(() => {
    if (!isAtFire || !isAuthenticated || !user) return;

    const roomId = fridayNight ? "campfire-friday-night" : "campfire-room";
    const channel = supabase.channel(roomId, {
      config: { presence: { key: user.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const online = Object.values(state).flat().map((p) => ({
        id: p.user_id,
        name: p.display_name || "Reader",
        book: p.book || "",
        isYou: p.user_id === user.id,
      }));
      setReaders(online);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user.id,
          display_name: displayName || user.email?.split("@")[0] || "Reader",
          book: myBook,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [isAtFire, isAuthenticated, user, myBook, fridayNight, displayName]);

  // ─── Audio setup (looped) ───
  useEffect(() => {
    const audio = new Audio(CAMPFIRE_AUDIO_URL);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const toggleAudio = useCallback(() => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setAudioPlaying(true);
    }
  }, [audioPlaying]);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  // Auto-play audio when joining, stop when leaving
  useEffect(() => {
    if (isAtFire && audioRef.current && !audioPlaying) {
      audioRef.current.play().catch(() => {});
      setAudioPlaying(true);
    }
    if (!isAtFire && audioRef.current && audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    }
  }, [isAtFire]);

  // ─── Timer logic (runs only on this device) ───
  useEffect(() => {
    if (timerState === "running") {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerState]);

  const startTimer = () => setTimerState("running");
  const pauseTimer = () => setTimerState("paused");
  const stopAndSaveTimer = async () => {
    setTimerState("stopped");
    const duration = timerSeconds;
    setTimerSeconds(0);
    if (duration > 0 && user) {
      // Save reading session to localStorage
      const sessionsKey = `rr_sessions_${user.id}`;
      const existing = JSON.parse(localStorage.getItem(sessionsKey) || "[]");
      existing.push({
        date: new Date().toISOString(),
        durationSeconds: duration,
        book: myBook || "No book selected",
      });
      localStorage.setItem(sessionsKey, JSON.stringify(existing));
      notify(`Reading session saved! ${formatTimer(duration)} logged 📖`);
    }
  };

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ─── Join / Leave fire ───
  const joinFire = (bookTitle) => {
    setMyBook(bookTitle || "");
    setIsAtFire(true);
  };

  const leaveFire = () => {
    if (timerState !== "stopped") stopAndSaveTimer();
    setIsAtFire(false);
    setMyBook("");
    setShowBookPicker(false);
  };

  return (
    <div style={{ fontFamily:"'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif", background:"linear-gradient(180deg, #08081a 0%, #10102a 20%, #1a1235 40%, #1e1830 60%, #251c28 80%, #2a1a20 100%)", minHeight:"100vh", color:C.cream, overflow:"hidden", position:"relative" }}>
      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.15} 50%{opacity:0.85} }
        @keyframes bob { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-4px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes notifSlide { 0%{opacity:0;transform:translateX(-50%) translateY(-8px)} 12%{opacity:1;transform:translateX(-50%) translateY(0)} 88%{opacity:1} 100%{opacity:0;transform:translateX(-50%) translateY(-8px)} }
        @keyframes rise-ember { 0%{opacity:0;transform:translateY(0) translateX(0) scale(1)} 10%{opacity:1} 70%{opacity:0.5} 100%{opacity:0;transform:translateY(-200px) translateX(var(--drift)) scale(0.15)} }
        @keyframes glowPulse { 0%,100%{opacity:0.2;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.35;transform:translate(-50%,-50%) scale(1.06)} }
        @keyframes readerAppear { from{opacity:0;transform:translate(-50%,-50%) scale(0.7)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 8px rgba(255,140,40,0.15)} 50%{box-shadow:0 0 22px rgba(255,140,40,0.45)} }
        @keyframes bannerShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .vol-slider::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#ffa050; cursor:pointer; border:2px solid rgba(255,255,255,0.2); }
        .vol-slider::-webkit-slider-runnable-track { height:4px; background:rgba(255,255,255,0.15); border-radius:2px; }
        .vol-slider { -webkit-appearance:none; width:90px; cursor:pointer; background:transparent; }
        @media(max-width:600px) { .fire-scene { height:360px !important; } }
      `}</style>

      {/* ─── Stars ─── */}
      {STARS.map((s) => (
        <div key={s.id} style={{ position:"absolute", left:`${s.x}%`, top:`${s.y}%`, width:s.size, height:s.size, borderRadius:"50%", background:"#fff", animation:`twinkle ${2+s.delay}s ease-in-out infinite`, animationDelay:`${s.delay}s` }} />
      ))}

      {/* ─── Friday Night Event Banner (always visible at top) ─── */}
      <div style={{
        textAlign:"center", padding:"10px 20px",
        background: fridayNight
          ? "linear-gradient(90deg, rgba(255,80,20,0.15), rgba(255,140,40,0.28), rgba(255,80,20,0.15))"
          : "linear-gradient(90deg, rgba(194,122,58,0.06), rgba(194,122,58,0.14), rgba(194,122,58,0.06))",
        backgroundSize: fridayNight ? "200% 100%" : undefined,
        animation: fridayNight ? "bannerShimmer 4s linear infinite" : undefined,
        borderBottom:"1px solid rgba(194,122,58,0.12)",
        position:"relative", zIndex:20,
      }}>
        {fridayNight ? (
          <span style={{ fontSize:13, color:"#ffa050", fontWeight:700 }}>
            🔥 Friday Night Fireside is LIVE! Read with up to {FRIDAY_NIGHT_CAP} readers in one campfire · 6 PM – 11 PM EST
          </span>
        ) : (
          <span style={{ fontSize:12, color:"rgba(232,220,203,0.5)" }}>
            🔥 <strong style={{ color:C.copper }}>Friday Night Fireside</strong> — Every Friday 6 PM – 11 PM EST · One big campfire, up to {FRIDAY_NIGHT_CAP} readers together
          </span>
        )}
      </div>

      {/* ─── Nav ─── */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 24px", borderBottom:"1px solid rgba(232,220,203,0.06)", background:"rgba(13,10,15,0.6)", backdropFilter:"blur(8px)", position:"relative", zIndex:50 }}>
        <Link to="/app" style={{ color:C.cream, textDecoration:"none", fontSize:"13px", fontWeight:500, display:"flex", alignItems:"center", gap:"6px" }}>
          ← <span style={{ fontFamily:"'Playfair Display',serif", color:C.copper, fontWeight:700, fontStyle:"italic", fontSize:"18px" }}>Readers' Realm</span>
        </Link>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          {/* Audio controls */}
          <div style={{ display:"flex", alignItems:"center", gap:"5px", position:"relative" }}>
            <button onClick={toggleAudio} style={{ padding:"6px 10px", background:"rgba(232,220,203,0.05)", border:"1px solid rgba(232,220,203,0.1)", borderRadius:"8px", color:C.cream, fontSize:"12px", cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}>
              {audioPlaying ? "🔊" : "🔇"} {audioPlaying ? "On" : "Off"}
            </button>
            {audioPlaying && (
              <>
                <button onClick={toggleMute} title={muted ? "Unmute" : "Mute"} style={{ padding:"5px 8px", background: muted ? "rgba(255,80,40,0.15)" : "rgba(232,220,203,0.05)", border:"1px solid rgba(232,220,203,0.1)", borderRadius:"8px", color: muted ? "#ff8040" : C.cream, fontSize:"11px", cursor:"pointer" }}>
                  {muted ? "🔇" : "🔈"}
                </button>
                <button onClick={() => setShowVolumeSlider(!showVolumeSlider)} title="Volume" style={{ padding:"5px 8px", background:"rgba(232,220,203,0.05)", border:"1px solid rgba(232,220,203,0.1)", borderRadius:"8px", color:C.cream, fontSize:"11px", cursor:"pointer" }}>
                  🎚️
                </button>
              </>
            )}
            {showVolumeSlider && audioPlaying && (
              <div style={{ position:"absolute", top:"100%", right:0, marginTop:"6px", background:"rgba(12,8,6,0.95)", border:"1px solid rgba(255,130,40,0.18)", borderRadius:"10px", padding:"10px 14px", zIndex:100, backdropFilter:"blur(12px)" }}>
                <input type="range" className="vol-slider" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
                <div style={{ fontSize:10, color:"rgba(232,220,203,0.4)", marginTop:4, textAlign:"center" }}>{Math.round(volume * 100)}%</div>
              </div>
            )}
          </div>
          <span style={{ color:"rgba(232,220,203,0.4)", fontSize:"12px" }}>{readers.length} by the fire</span>
        </div>
      </nav>

      {/* ─── Notification toast ─── */}
      {notification && (
        <div style={{ position:"fixed", top:16, left:"50%", zIndex:100, background:"rgba(25,18,12,0.94)", border:"1px solid rgba(255,140,40,0.2)", borderRadius:20, padding:"7px 20px", fontSize:13, color:"#f0dcc0", whiteSpace:"nowrap", animation:"notifSlide 3s ease-in-out forwards", backdropFilter:"blur(12px)" }}>
          {notification}
        </div>
      )}

      {/* ─── Header ─── */}
      <div style={{ textAlign:"center", paddingTop:24, position:"relative", zIndex:10, animation:"fadeIn 1s ease-out" }}>
        <h1 style={{ fontSize:24, fontWeight:400, letterSpacing:5, textTransform:"uppercase", margin:0, textShadow:"0 0 40px rgba(255,140,40,0.2)", color:"#f0dcc0" }}>
          The Campfire
        </h1>
        <p style={{ fontSize:13, opacity:0.4, marginTop:6, letterSpacing:1, fontStyle:"italic" }}>
          A cozy space to read alongside others. No chat, no pressure — just the warmth of shared reading.
        </p>
      </div>

      {/* ─── Main Campfire Scene ─── */}
      <div className="fire-scene" style={{ position:"relative", width:"100%", maxWidth:600, margin:"0 auto", height:420, marginTop:10 }}>
        {/* Ambient glow */}
        <div style={{ position:"absolute", left:"50%", top:"48%", width:350, height:220, borderRadius:"50%", background:"radial-gradient(ellipse, rgba(255,100,15,0.14) 0%, rgba(255,60,5,0.05) 45%, transparent 70%)", animation:"glowPulse 2.5s ease-in-out infinite", pointerEvents:"none" }} />

        {/* Fire emoji (fallback — replace with GIF if you have it inline) */}
        <div style={{ position:"absolute", left:"50%", top:"44%", transform:"translate(-50%,-50%)", fontSize:80, zIndex:5, pointerEvents:"none", filter:"drop-shadow(0 0 30px rgba(255,100,20,0.5))", animation:"glowPulse 2s ease-in-out infinite" }}>
          🔥
        </div>

        {/* Rising embers */}
        {RISING_EMBERS.map((e) => (
          <div key={`re-${e.id}`} style={{ position:"absolute", left:`${e.startX}%`, top:"40%", width:e.size, height:e.size, borderRadius:"50%", background:`radial-gradient(circle, rgba(255,${130+e.brightness*70},15,${e.brightness}) 30%, rgba(255,70,0,0.2) 100%)`, boxShadow:`0 0 ${e.size+2}px rgba(255,110,15,${e.brightness*0.4})`, animation:`rise-ember ${e.duration}s ease-out infinite`, animationDelay:`${e.delay}s`, "--drift":`${e.drift}px`, zIndex:6, pointerEvents:"none" }} />
        ))}

        {/* ─── Readers around the fire (REAL users only via Supabase Presence) ─── */}
        {isAtFire && readers.length > 0 && readers.map((r, i) => {
          const pos = circlePos(i, readers.length, 50, 50, 36, 28);
          const isYou = r.isYou;
          return (
            <div key={r.id}
              onMouseEnter={() => setHoveredReader(r.id)}
              onMouseLeave={() => setHoveredReader(null)}
              style={{
                position:"absolute", left:`${pos.x}%`, top:`${pos.y}%`,
                transform:"translate(-50%,-50%)", textAlign:"center",
                animation: isYou
                  ? "readerAppear 0.5s ease-out forwards, bob 3.5s ease-in-out infinite 0.5s"
                  : `bob 3.5s ease-in-out infinite`,
                animationDelay: isYou ? undefined : `${i*0.5}s`,
                zIndex:10,
              }}
            >
              {/* Warm underglow */}
              <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:50, height:50, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,120,30,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />

              <div style={{
                width:36, height:36, borderRadius:"50%",
                background: isYou ? `linear-gradient(135deg,${C.copper},#A86830)` : `linear-gradient(135deg,${C.teal},${C.sage})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, boxShadow:"0 4px 12px rgba(0,0,0,0.3)",
                border: isYou ? `2px solid ${C.copper}` : "2px solid rgba(232,220,203,0.1)",
                filter:`drop-shadow(0 0 ${hoveredReader===r.id?12:4}px rgba(255,140,40,${hoveredReader===r.id?0.6:0.1}))`,
                transition:"filter 0.3s", margin:"0 auto",
              }}>
                {isYou ? "😊" : "📚"}
              </div>
              <div style={{ fontSize:10, marginTop:3, fontWeight:isYou?700:500, color:isYou?"#ffa050":(hoveredReader===r.id?"#ffb060":"rgba(232,220,203,0.5)"), transition:"color 0.3s", textShadow:"0 1px 4px rgba(0,0,0,0.6)" }}>
                {r.name}
              </div>

              {/* Book tooltip on hover */}
              {hoveredReader === r.id && (
                <div style={{ position:"absolute", bottom:"100%", left:"50%", transform:"translateX(-50%)", marginBottom:6, background:"rgba(12,8,6,0.96)", border:"1px solid rgba(255,130,40,0.18)", borderRadius:10, padding:"8px 14px", whiteSpace:"nowrap", animation:"fadeIn 0.15s ease-out", backdropFilter:"blur(14px)", zIndex:20 }}>
                  <div style={{ fontSize:12, color:"#f0dcc0" }}>
                    📖 <em>{r.book || "Just vibing by the fire"}</em>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state when alone */}
        {isAtFire && readers.length <= 1 && (
          <div style={{ position:"absolute", left:"50%", top:"75%", transform:"translateX(-50%)", textAlign:"center", zIndex:10, animation:"fadeIn 1s ease-out 1s both" }}>
            <p style={{ fontSize:12, color:"rgba(232,220,203,0.3)", fontStyle:"italic", maxWidth:280 }}>
              The fire crackles softly… waiting for more readers to join.
            </p>
          </div>
        )}
      </div>

      {/* ─── Controls ─── */}
      <div style={{ textAlign:"center", position:"relative", zIndex:20, marginTop:-10, animation:"fadeIn 1s ease-out 0.5s both" }}>

        {/* Join button */}
        {!isAtFire && !showBookPicker && (
          <button onClick={() => setShowBookPicker(true)} style={{
            background:"linear-gradient(135deg, rgba(255,115,25,0.16), rgba(255,65,10,0.07))",
            border:"1px solid rgba(255,130,40,0.22)", color:"#f0dcc0", fontSize:15,
            padding:"12px 36px", borderRadius:30, cursor:"pointer", letterSpacing:1, fontFamily:"inherit",
            transition:"all 0.3s",
          }}>
            Sit by the Fire
          </button>
        )}

        {/* Book picker — books come from "Currently Reading" shelf only, or skip */}
        {showBookPicker && !isAtFire && (
          <div style={{ animation:"slideUp 0.3s ease-out", maxWidth:380, margin:"0 auto", padding:"0 20px" }}>
            <p style={{ fontSize:13, opacity:0.5, margin:"0 0 14px" }}>
              Select from your "Currently Reading" shelf:
            </p>

            {currentlyReadingBooks.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
                {currentlyReadingBooks.map((book, idx) => {
                  const title = typeof book === "string" ? book : (book.title || "Untitled");
                  return (
                    <button key={idx} onClick={() => joinFire(title)}
                      style={{
                        background:"rgba(255,115,25,0.08)", border:"1px solid rgba(255,130,40,0.18)",
                        borderRadius:12, padding:"10px 16px", color:"#f0dcc0", fontSize:13,
                        fontFamily:"inherit", cursor:"pointer", textAlign:"left",
                        display:"flex", alignItems:"center", gap:8, transition:"all 0.2s",
                      }}>
                      <span>📖</span>
                      <span>{title}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize:12, color:"rgba(232,220,203,0.35)", margin:"0 0 14px", fontStyle:"italic" }}>
                No books in your "Currently Reading" shelf yet. Add some from the app!
              </p>
            )}

            <button onClick={() => joinFire("")} style={{
              width:"100%", padding:"11px", background:"rgba(255,255,255,0.03)",
              border:"1px solid rgba(255,255,255,0.08)", borderRadius:12,
              color:"rgba(232,220,203,0.5)", fontSize:13, cursor:"pointer", fontFamily:"inherit",
            }}>
              Continue without a book
            </button>

            <button onClick={() => setShowBookPicker(false)} style={{
              marginTop:8, background:"none", border:"none",
              color:"rgba(232,220,203,0.3)", fontSize:11, cursor:"pointer", fontFamily:"inherit",
            }}>
              Cancel
            </button>
          </div>
        )}

        {/* At fire — Reading timer + leave */}
        {isAtFire && (
          <div style={{ animation:"fadeIn 0.5s ease-out" }}>
            {/* ─── Reading Timer (local to this user's device only) ─── */}
            <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", gap:10, background:"rgba(26,18,32,0.7)", backdropFilter:"blur(8px)", borderRadius:16, padding:"16px 28px", border:"1px solid rgba(194,122,58,0.12)", marginBottom:16 }}>
              <div style={{ fontSize:11, color:"rgba(232,220,203,0.4)", letterSpacing:2, textTransform:"uppercase" }}>
                Reading Session
              </div>
              <div style={{
                fontSize:32, fontWeight:300, fontVariantNumeric:"tabular-nums",
                color: timerState === "running" ? "#ffa050" : "#f0dcc0",
                animation: timerState === "running" ? "pulseGlow 2s ease-in-out infinite" : "none",
                borderRadius:8, padding:"4px 12px",
              }}>
                {formatTimer(timerSeconds)}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {timerState === "stopped" && (
                  <button onClick={startTimer} style={{ padding:"8px 20px", background:"linear-gradient(135deg, rgba(255,115,25,0.2), rgba(255,65,10,0.1))", border:"1px solid rgba(255,130,40,0.25)", borderRadius:20, color:"#f0dcc0", fontSize:12, cursor:"pointer", fontFamily:"inherit", letterSpacing:1 }}>
                    ▶ Start
                  </button>
                )}
                {timerState === "running" && (
                  <button onClick={pauseTimer} style={{ padding:"8px 20px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, color:"#f0dcc0", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                    ⏸ Pause
                  </button>
                )}
                {timerState === "paused" && (
                  <button onClick={startTimer} style={{ padding:"8px 20px", background:"linear-gradient(135deg, rgba(255,115,25,0.2), rgba(255,65,10,0.1))", border:"1px solid rgba(255,130,40,0.25)", borderRadius:20, color:"#f0dcc0", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                    ▶ Resume
                  </button>
                )}
                {timerState !== "stopped" && (
                  <button onClick={stopAndSaveTimer} style={{ padding:"8px 20px", background:"rgba(255,60,40,0.1)", border:"1px solid rgba(255,60,40,0.2)", borderRadius:20, color:"#ff8060", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                    ⏹ Stop & Save
                  </button>
                )}
              </div>
              {myBook && (
                <div style={{ fontSize:11, color:"rgba(232,220,203,0.3)", marginTop:2 }}>
                  📖 {myBook}
                </div>
              )}
            </div>

            <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:4 }}>
              <button onClick={leaveFire} style={{
                background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
                color:"#645444", fontSize:12, padding:"8px 16px", borderRadius:16,
                cursor:"pointer", fontFamily:"inherit",
              }}>
                Leave fire
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Coming Soon (removed: ambient fire sounds, whisper mode) ─── */}
      <div style={{ padding:"24px 32px", borderTop:"1px solid rgba(232,220,203,0.06)", textAlign:"center", background:"rgba(26,18,32,0.5)", marginTop:30 }}>
        <div style={{ maxWidth:500, margin:"0 auto" }}>
          <div style={{ fontSize:11, letterSpacing:2, color:C.copper, fontWeight:600, textTransform:"uppercase", marginBottom:8 }}>
            Coming Soon to the Campfire
          </div>
          <p style={{ fontSize:13, color:"rgba(232,220,203,0.5)", lineHeight:1.7 }}>
            📅 Friday Night Fireside events with bigger fires · 📸 Shareable streak badges · 📖 Book Club campfire rooms
          </p>
        </div>
      </div>
    </div>
  );
}
