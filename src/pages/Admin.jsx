import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase.js";

const C = { darkPurple:"#2B1E2F", copper:"#C27A3A", cream:"#E8DCCB", darkBrown:"#4A2C23", teal:"#35605A", sage:"#5B6C5D" };
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNi4JsCVM89WNeVAUx0Jcq3bPk7-C0UBR5Xk_Y9zXyCeTWfL5kybDMTXGGUhfJRwIg/exec";
const ADMIN_PASSWORD = "ReadersRealm2026!";

// ── Date helpers ──
const todayStr = () => new Date().toISOString().split("T")[0];
const startOfPeriod = (p) => {
  const d = new Date();
  if (p === "today") { d.setHours(0,0,0,0); return d; }
  if (p === "week")  { d.setDate(d.getDate()-7); d.setHours(0,0,0,0); return d; }
  if (p === "month") { d.setDate(1); d.setHours(0,0,0,0); return d; }
  return new Date(0);
};
const inPeriod = (ts, p) => !ts || p === "all" ? true : new Date(ts) >= startOfPeriod(p);

// ── Mini bar chart ──
const MiniBar = ({ values = [], color = C.copper }) => {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"2px", height:"28px", flexShrink:0 }}>
      {values.map((v, i) => {
        const h = Math.max((v/max)*26, v>0?2:0);
        return <div key={i} style={{ width:"5px", height:`${h}px`, background:color, borderRadius:"1px 1px 0 0", opacity:i===values.length-1?1:0.55 }} />;
      })}
    </div>
  );
};

// ── Funnel row ──
const FunnelRow = ({ label, value, max, color, pct }) => (
  <div style={{ marginBottom:"11px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"4px" }}>
      <span style={{ color:"rgba(232,220,203,0.7)" }}>{label}</span>
      <span style={{ fontWeight:700, color }}>
        {value.toLocaleString()}
        {pct != null && <span style={{ color:"rgba(232,220,203,0.35)", fontWeight:400, marginLeft:6, fontSize:10 }}>{pct}%</span>}
      </span>
    </div>
    <div style={{ height:"6px", background:"rgba(232,220,203,0.06)", borderRadius:"3px" }}>
      <div style={{ height:"100%", width:`${max>0?Math.min((value/max)*100,100):0}%`, background:color, borderRadius:"3px", transition:"width 0.5s" }} />
    </div>
  </div>
);

// ── Bar breakdown with legend ──
const BarBreak = ({ data }) => {
  const total = Object.values(data).reduce((a,b)=>a+b,0)||1;
  const colors = [C.copper, C.teal, C.sage, "#8B5CF6", "#E87C5A", "#4A9B8A"];
  const sorted = Object.entries(data).sort((a,b)=>b[1]-a[1]);
  return (
    <div>
      <div style={{ display:"flex", borderRadius:"5px", overflow:"hidden", height:"7px", marginBottom:"10px" }}>
        {sorted.map(([k,v],i) => <div key={k} style={{ width:`${(v/total)*100}%`, background:colors[i%colors.length] }} />)}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
        {sorted.map(([k,v],i) => (
          <div key={k} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", color:"rgba(232,220,203,0.65)" }}>
              <div style={{ width:"7px", height:"7px", borderRadius:"2px", background:colors[i%colors.length], flexShrink:0 }} />
              {k}
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <span style={{ color:colors[i%colors.length], fontWeight:600 }}>{v}</span>
              <span style={{ color:"rgba(232,220,203,0.3)", fontSize:11 }}>{Math.round(v/total*100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Admin() {
  const [auth, setAuth]     = useState(false);
  const [pw, setPw]         = useState("");
  const [pwErr, setPwErr]   = useState("");
  const [emails, setEmails] = useState([]);
  const [supabaseEvents, setSupabaseEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [tab, setTab]       = useState("overview");
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [sortF, setSortF]   = useState("timestamp");
  const [sortD, setSortD]   = useState("desc");

  useEffect(() => { if (sessionStorage.getItem("rr_admin") === "true") setAuth(true); }, []);

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuth(true); sessionStorage.setItem("rr_admin","true"); setPwErr(""); }
    else setPwErr("Incorrect password.");
  };

  const fetchEmails = useCallback(async () => {
    setLoading(true); setFetchErr("");
    try {
      const r = await fetch(SCRIPT_URL + "?action=getEmails");
      if (!r.ok) throw new Error();
      const d = await r.json();
      setEmails(d.emails || []);
    } catch {
      setFetchErr("Could not fetch emails from Google Sheet.");
      try { const c = JSON.parse(localStorage.getItem("rr_admin_emails_cache")||"[]"); if (c.length) setEmails(c); } catch {}
    }
    setLoading(false);
  }, []);

  // Pulls event data from Supabase — tracks ALL users (once table is created)
  const fetchSupabaseEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("analytics_events").select("*").order("created_at",{ascending:false}).limit(10000);
      if (!error && data) setSupabaseEvents(data);
    } catch {}
  }, []);

  useEffect(() => { if (auth) { fetchEmails(); fetchSupabaseEvents(); } }, [auth, fetchEmails, fetchSupabaseEvents]);
  useEffect(() => { if (emails.length) localStorage.setItem("rr_admin_emails_cache", JSON.stringify(emails)); }, [emails]);

  // ── Data sources ──
  const localPageViews = useMemo(() => JSON.parse(localStorage.getItem("rr_pageviews")||"[]"), []);
  const localEvents    = useMemo(() => JSON.parse(localStorage.getItem("rr_events")||"[]"), []);
  const localSessions  = useMemo(() => JSON.parse(localStorage.getItem("rr_sessions")||"[]"), []);

  // Supabase = all users; localStorage = admin browser only
  const usingSupabase = supabaseEvents.length > 0;
  const allEvents = usingSupabase
    ? supabaseEvents.map(e => ({ action:e.event_name, timestamp:e.created_at, ...((e.properties)||{}) }))
    : localEvents;

  // ── Sign-up stats (Google Sheet = ALL real users) ──
  const today = todayStr();
  const todaySignups = emails.filter(e => e.timestamp?.startsWith(today)).length;
  const weekSignups  = emails.filter(e => inPeriod(e.timestamp,"week")).length;
  const monthSignups = emails.filter(e => inPeriod(e.timestamp,"month")).length;

  const signupsByDay = useMemo(() => {
    const days = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      days[d.toISOString().split("T")[0]] = 0;
    }
    emails.forEach(e => { if (e.timestamp) { const k = e.timestamp.split("T")[0]; if (k in days) days[k]++; } });
    return Object.values(days);
  }, [emails]);

  const filteredEmails = useMemo(() => emails.filter(e => inPeriod(e.timestamp, period)), [emails, period]);

  // ── Demographics (Google Sheet = ALL users) ──
  const sources = useMemo(() => filteredEmails.reduce((a,e) => {
    const r = e.referrer||"direct";
    const k = r==="direct"?"Direct":(() => { try { return new URL(r).hostname.replace("www.",""); } catch { return r; } })();
    a[k]=(a[k]||0)+1; return a;
  }, {}), [filteredEmails]);

  const devices = useMemo(() => filteredEmails.reduce((a,e) => {
    const u=(e.userAgent||"").toLowerCase();
    const k = u.includes("mobile")||u.includes("android")||u.includes("iphone")?"Mobile":u.includes("tablet")||u.includes("ipad")?"Tablet":"Desktop";
    a[k]=(a[k]||0)+1; return a;
  }, {}), [filteredEmails]);

  const browsers = useMemo(() => filteredEmails.reduce((a,e) => {
    const u=(e.userAgent||"").toLowerCase();
    const k = u.includes("chrome")&&!u.includes("edg")?"Chrome":u.includes("firefox")?"Firefox":u.includes("safari")&&!u.includes("chrome")?"Safari":u.includes("edg")?"Edge":"Other";
    a[k]=(a[k]||0)+1; return a;
  }, {}), [filteredEmails]);

  const languages = useMemo(() => filteredEmails.reduce((a,e) => {
    const l=(e.language||"?").split("-")[0]; a[l]=(a[l]||0)+1; return a;
  }, {}), [filteredEmails]);

  // ── Event stats (Supabase = all users once set up, else local only) ──
  const periodEvents   = allEvents.filter(e => inPeriod(e.timestamp, period));
  const filterEvents   = periodEvents.filter(e => e.action==="filter_used");
  const filterCounts   = filterEvents.reduce((a,e) => { const k=e.filter||"?"; a[k]=(a[k]||0)+1; return a; }, {});
  const bookClicks     = periodEvents.filter(e => e.action==="book_click");
  const topBooks       = bookClicks.reduce((a,e) => { const k=e.title||"Unknown"; a[k]=(a[k]||0)+1; return a; }, {});
  const campfireClicks = periodEvents.filter(e => e.action==="campfire_nav_click").length;
  const friendsClicks  = periodEvents.filter(e => e.action==="friends_panel_click").length;
  const barcodeClicks  = periodEvents.filter(e => e.action==="barcode_scanner_click").length;
  const feedbackClicks = periodEvents.filter(e => e.action==="feedback_click").length;

  // ── Page views table (local — admin browser only) ──
  const pageTable = useMemo(() => {
    const pages = {};
    localPageViews.forEach(v => {
      const p = v.page||"unknown";
      if (!pages[p]) pages[p] = { today:0, week:0, month:0, all:0 };
      pages[p].all++;
      if (inPeriod(v.timestamp,"month")) pages[p].month++;
      if (inPeriod(v.timestamp,"week"))  pages[p].week++;
      if (v.timestamp?.startsWith(today)) pages[p].today++;
    });
    return Object.entries(pages).sort((a,b)=>b[1].all-a[1].all);
  }, [localPageViews, today]);

  const totalLocalPV = localPageViews.filter(v => inPeriod(v.timestamp,period)).length;
  const landingViews = localPageViews.filter(v => inPeriod(v.timestamp,period) && v.page==="landing").length;
  const appViews     = localPageViews.filter(v => inPeriod(v.timestamp,period) && v.page!=="landing").length;
  const ctr          = landingViews>0 ? Math.round((appViews/landingViews)*100) : 0;

  // ── Email list ──
  const filteredList = emails
    .filter(e => !search || e.email?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      const av=a[sortF]||"", bv=b[sortF]||"";
      return sortD==="asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  const exportCSV = () => {
    const h = ["Email","Timestamp","UserAgent","ScreenSize","Language","Timezone","Referrer","Platform","Source"];
    const rows = filteredList.map(e=>[e.email,e.timestamp,e.userAgent?.substring(0,80),e.screenSize,e.language,e.timezone,e.referrer,e.platform,e.source]);
    const csv = [h.join(","), ...rows.map(r=>r.map(c=>`"${(c||"").replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`rr-signups-${today}.csv`; a.click();
  };

  // ── Shared mini styles ──
  const card = { padding:"18px", background:"rgba(232,220,203,0.03)", border:"1px solid rgba(232,220,203,0.08)", borderRadius:"12px" };
  const sectionLabel = { fontSize:"11px", color:C.copper, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", marginBottom:"14px" };
  const subLabel = { fontSize:"10px", color:"rgba(232,220,203,0.3)", marginTop:"-10px", marginBottom:"14px" };

  // ── Password gate ──
  if (!auth) return (
    <div style={{ fontFamily:"'Source Sans 3',sans-serif", background:C.darkPurple, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Source+Sans+3:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ background:"linear-gradient(160deg,#2B1E2F,#1a1220)", borderRadius:"20px", padding:"40px", maxWidth:"380px", width:"100%", border:"1px solid rgba(194,122,58,0.2)", textAlign:"center" }}>
        <div style={{ fontSize:"32px", marginBottom:"10px" }}>🔐</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", color:C.cream, marginBottom:"6px" }}>Admin Access</h2>
        <p style={{ color:"rgba(232,220,203,0.45)", fontSize:"12px", marginBottom:"20px" }}>Readers' Realm admin dashboard</p>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
          style={{ width:"100%", padding:"13px 16px", background:"rgba(43,30,47,0.6)", border:"1px solid rgba(194,122,58,0.3)", borderRadius:"10px", color:C.cream, fontSize:"14px", marginBottom:"10px", outline:"none" }} />
        {pwErr && <div style={{ color:"#E87C5A", fontSize:"12px", marginBottom:"8px" }}>{pwErr}</div>}
        <button onClick={login} style={{ width:"100%", padding:"13px", background:`linear-gradient(135deg,${C.copper},#A86830)`, color:"#fff", border:"none", borderRadius:"10px", fontSize:"14px", fontWeight:700, cursor:"pointer" }}>Log In</button>
      </div>
    </div>
  );

  const TABS    = [{id:"overview",l:"📊 Overview"},{id:"emails",l:"📧 Emails"},{id:"behavior",l:"🖱 Behavior"},{id:"demographics",l:"👥 Demographics"},{id:"setup",l:"⚙️ Setup"}];
  const PERIODS = [{id:"today",l:"Today"},{id:"week",l:"This Week"},{id:"month",l:"This Month"},{id:"all",l:"All Time"}];

  return (
    <div style={{ fontFamily:"'Source Sans 3',sans-serif", background:"linear-gradient(180deg,#1a1220,#2B1E2F)", minHeight:"100vh", color:C.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(194,122,58,0.3);border-radius:3px}
        .tbtn:hover{background:rgba(232,220,203,0.06) !important}
        .rh:hover{background:rgba(232,220,203,0.025) !important}
        @media(max-width:900px){.g2{grid-template-columns:1fr !important}.srow{flex-wrap:wrap !important}}
        @media(max-width:600px){.hdr{flex-direction:column !important;gap:8px !important}.tbar{flex-direction:column !important;align-items:flex-start !important}.srow>*{min-width:calc(50% - 5px) !important}}
      `}</style>

      {/* ── Header ── */}
      <div className="hdr" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 28px", borderBottom:"1px solid rgba(232,220,203,0.06)", background:"rgba(74,44,35,0.3)", backdropFilter:"blur(8px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"18px" }}>📖</span>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"17px", color:C.copper, fontWeight:700, fontStyle:"italic" }}>Readers' Realm</span>
          <span style={{ fontSize:"9px", padding:"3px 8px", background:"rgba(194,122,58,0.15)", border:"1px solid rgba(194,122,58,0.3)", borderRadius:"10px", color:C.copper, fontWeight:700, letterSpacing:"0.5px" }}>ADMIN</span>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={() => { fetchEmails(); fetchSupabaseEvents(); }} disabled={loading}
            style={{ padding:"7px 14px", background:"rgba(53,96,90,0.2)", border:`1px solid ${C.teal}`, borderRadius:"8px", color:C.teal, fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
            {loading?"...":"↻ Refresh"}
          </button>
          <button onClick={() => { setAuth(false); sessionStorage.removeItem("rr_admin"); }}
            style={{ padding:"7px 14px", background:"rgba(139,58,58,0.2)", border:"1px solid rgba(139,58,58,0.3)", borderRadius:"8px", color:"#C27A3A", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"20px 20px 60px" }}>

        {/* ── Tabs + Period ── */}
        <div className="tbar" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"18px", gap:"10px" }}>
          <div style={{ display:"flex", gap:"2px", background:"rgba(232,220,203,0.03)", borderRadius:"10px", padding:"3px", border:"1px solid rgba(232,220,203,0.06)", flexWrap:"wrap" }}>
            {TABS.map(t => (
              <button key={t.id} className="tbtn" onClick={()=>setTab(t.id)}
                style={{ padding:"8px 14px", border:"none", borderRadius:"7px", fontSize:"12px", fontWeight:600, cursor:"pointer",
                  color:tab===t.id?"#fff":"rgba(232,220,203,0.45)",
                  background:tab===t.id?"rgba(194,122,58,0.3)":"transparent" }}>
                {t.l}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:"2px", background:"rgba(232,220,203,0.03)", borderRadius:"10px", padding:"3px", border:"1px solid rgba(232,220,203,0.06)", flexShrink:0 }}>
            {PERIODS.map(p => (
              <button key={p.id} className="tbtn" onClick={()=>setPeriod(p.id)}
                style={{ padding:"7px 12px", border:"none", borderRadius:"7px", fontSize:"11px", fontWeight:600, cursor:"pointer",
                  color:period===p.id?"#fff":"rgba(232,220,203,0.45)",
                  background:period===p.id?"rgba(53,96,90,0.4)":"transparent" }}>
                {p.l}
              </button>
            ))}
          </div>
        </div>

        {fetchErr && <div style={{ padding:"11px 16px", background:"rgba(194,122,58,0.08)", border:"1px solid rgba(194,122,58,0.2)", borderRadius:"10px", marginBottom:"14px", fontSize:"12px", color:"rgba(232,220,203,0.6)" }}>⚠️ {fetchErr}</div>}

        {/* ════════════════ OVERVIEW ════════════════ */}
        {tab === "overview" && (<>

          {/* Top stat cards */}
          <div className="srow" style={{ display:"flex", gap:"10px", marginBottom:"12px", overflowX:"auto" }}>
            {[
              { label:"Total Sign-ups", value:emails.length,           sub:`${todaySignups} today · ${weekSignups} this week`, color:C.copper,    spark:signupsByDay, badge:"✅ all users" },
              { label:"This Period",    value:filteredEmails.length,   sub:period==="all"?"all time":"filtered period",         color:C.teal,      badge:"✅ all users" },
              { label:"Book Clicks",   value:bookClicks.length,        sub:usingSupabase?"all users":"local only",              color:C.sage,      badge: usingSupabase?"✅ all users":"⚠️ local" },
              { label:"Filter Uses",   value:filterEvents.length,      sub:usingSupabase?"all users":"local only",              color:"#8B5CF6",   badge: usingSupabase?"✅ all users":"⚠️ local" },
              { label:"CTR",           value:`${ctr}%`,                sub:"app views ÷ landing views",                         color:"#E87C5A",   badge:"⚠️ local" },
            ].map(s => (
              <div key={s.label} style={{ ...card, flex:1, minWidth:"140px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"6px" }}>
                  <div style={{ fontSize:"9px", color:"rgba(232,220,203,0.4)", letterSpacing:"1.5px", textTransform:"uppercase" }}>{s.label}</div>
                  <span style={{ fontSize:"8px", padding:"1px 5px", borderRadius:"4px", background: s.badge?.startsWith("✅")?"rgba(53,96,90,0.25)":"rgba(194,122,58,0.15)", color:s.badge?.startsWith("✅")?C.teal:C.copper, fontWeight:600, whiteSpace:"nowrap" }}>{s.badge}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                  <div>
                    <div style={{ fontSize:"26px", fontWeight:800, color:s.color, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{s.value}</div>
                    {s.sub && <div style={{ fontSize:"10px", color:"rgba(232,220,203,0.3)", marginTop:"4px" }}>{s.sub}</div>}
                  </div>
                  {s.spark && <MiniBar values={s.spark} color={s.color} />}
                </div>
              </div>
            ))}
          </div>

          <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>

            {/* Sign-ups bar chart */}
            <div style={card}>
              <div style={sectionLabel}>Sign-ups — Last 14 Days</div>
              <div style={subLabel}>Google Sheet · all real users</div>
              {signupsByDay.some(v=>v>0) ? (
                <>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:"3px", height:"64px" }}>
                    {signupsByDay.map((v,i) => {
                      const max = Math.max(...signupsByDay,1);
                      const h = Math.max((v/max)*60, v>0?3:0);
                      const isToday = i===signupsByDay.length-1;
                      return (
                        <div key={i} title={`${v} sign-up${v!==1?"s":""}`} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"64px", cursor:"default" }}>
                          <div style={{ width:"100%", height:`${h}px`, background:isToday?C.copper:C.teal, borderRadius:"2px 2px 0 0", opacity:isToday?1:0.55 }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:"5px", fontSize:"9px", color:"rgba(232,220,203,0.25)" }}>
                    <span>14 days ago</span><span>Today</span>
                  </div>
                </>
              ) : <div style={{ color:"rgba(232,220,203,0.3)", fontSize:"12px", padding:"16px 0" }}>No sign-ups recorded yet.</div>}
            </div>

            {/* Acquisition funnel */}
            <div style={card}>
              <div style={sectionLabel}>Acquisition Funnel</div>
              <div style={subLabel}>
                {emails.length>0&&totalLocalPV>0 ? `Overall conversion: ${Math.round((emails.length/totalLocalPV)*100)}%` : "Sign-ups from all users · page views local only"}
              </div>
              <FunnelRow label="Page Views (local)"      value={totalLocalPV}          max={Math.max(totalLocalPV,1)} color={C.copper} />
              <FunnelRow label="App Views (local)"       value={appViews}              max={Math.max(totalLocalPV,1)} color={C.teal} />
              <FunnelRow label="Sign-ups ✅ all users"   value={filteredEmails.length} max={Math.max(totalLocalPV,1)} color={C.sage}
                pct={totalLocalPV>0 ? Math.round(filteredEmails.length/totalLocalPV*100) : null} />
              <FunnelRow label="Book Clicks"             value={bookClicks.length}     max={Math.max(totalLocalPV,1)} color="#8B5CF6" />
              <FunnelRow label="Campfire Clicks"         value={campfireClicks}        max={Math.max(totalLocalPV,1)} color="#E87C5A" />
            </div>
          </div>

          <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            {/* Traffic sources */}
            <div style={card}>
              <div style={sectionLabel}>Traffic Sources</div>
              <div style={subLabel}>Sign-up referrers · all users ✅</div>
              {Object.keys(sources).length ? <BarBreak data={sources} /> : <div style={{ color:"rgba(232,220,203,0.3)", fontSize:"12px" }}>No data yet</div>}
            </div>

            {/* Page-by-page table */}
            <div style={card}>
              <div style={sectionLabel}>Page Views by Page</div>
              <div style={subLabel}>⚠️ Your browser only · use GA4 for all users</div>
              {pageTable.length > 0 ? (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 44px 52px 58px 52px", gap:"4px", fontSize:"9px", color:"rgba(232,220,203,0.3)", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:"6px", padding:"0 2px" }}>
                    <span>Page</span><span style={{textAlign:"right"}}>Today</span><span style={{textAlign:"right"}}>Week</span><span style={{textAlign:"right"}}>Month</span><span style={{textAlign:"right"}}>All</span>
                  </div>
                  {pageTable.slice(0,8).map(([page,counts]) => (
                    <div key={page} className="rh" style={{ display:"grid", gridTemplateColumns:"1fr 44px 52px 58px 52px", gap:"4px", padding:"6px 2px", borderBottom:"1px solid rgba(232,220,203,0.04)", fontSize:"12px" }}>
                      <span style={{ color:C.cream, textTransform:"capitalize" }}>{page}</span>
                      <span style={{ textAlign:"right", color:counts.today>0?C.copper:"rgba(232,220,203,0.25)", fontWeight:counts.today>0?700:400 }}>{counts.today}</span>
                      <span style={{ textAlign:"right", color:"rgba(232,220,203,0.55)" }}>{counts.week}</span>
                      <span style={{ textAlign:"right", color:"rgba(232,220,203,0.55)" }}>{counts.month}</span>
                      <span style={{ textAlign:"right", color:C.copper, fontWeight:600 }}>{counts.all}</span>
                    </div>
                  ))}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 44px 52px 58px 52px", gap:"4px", padding:"7px 2px 0", fontSize:"11px", fontWeight:700 }}>
                    <span style={{ color:"rgba(232,220,203,0.4)" }}>Total</span>
                    <span style={{ textAlign:"right", color:C.copper }}>{pageTable.reduce((a,p)=>a+p[1].today,0)}</span>
                    <span style={{ textAlign:"right", color:C.copper }}>{pageTable.reduce((a,p)=>a+p[1].week,0)}</span>
                    <span style={{ textAlign:"right", color:C.copper }}>{pageTable.reduce((a,p)=>a+p[1].month,0)}</span>
                    <span style={{ textAlign:"right", color:C.copper }}>{pageTable.reduce((a,p)=>a+p[1].all,0)}</span>
                  </div>
                </>
              ) : <div style={{ color:"rgba(232,220,203,0.3)", fontSize:"12px" }}>No page view data yet. Browse your site to generate it.</div>}
            </div>
          </div>
        </>)}

        {/* ════════════════ EMAILS ════════════════ */}
        {tab === "emails" && (<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px", flexWrap:"wrap", gap:"10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <div style={{ display:"flex", alignItems:"center", background:"rgba(232,220,203,0.04)", border:"1px solid rgba(232,220,203,0.1)", borderRadius:"8px", padding:"0 10px" }}>
                <span style={{ color:"rgba(232,220,203,0.4)" }}>🔍</span>
                <input type="text" placeholder="Search emails..." value={search} onChange={e=>setSearch(e.target.value)}
                  style={{ padding:"9px 8px", background:"transparent", border:"none", color:C.cream, fontSize:"12px", outline:"none", width:"180px" }} />
              </div>
              <span style={{ fontSize:"12px", color:"rgba(232,220,203,0.35)" }}>{filteredList.length} of {emails.length}</span>
            </div>
            <button onClick={exportCSV} style={{ padding:"7px 14px", background:"rgba(194,122,58,0.15)", border:`1px solid ${C.copper}`, borderRadius:"8px", color:C.copper, fontSize:"12px", fontWeight:600, cursor:"pointer" }}>⬇ Export CSV</button>
          </div>

          <div className="srow" style={{ display:"flex", gap:"10px", marginBottom:"14px" }}>
            {[{label:"Total",value:emails.length,color:C.copper},{label:"Today",value:todaySignups,color:C.teal},{label:"This Week",value:weekSignups,color:C.sage},{label:"This Month",value:monthSignups,color:"#8B5CF6"}].map(s => (
              <div key={s.label} style={{ ...card, flex:1, minWidth:"90px" }}>
                <div style={{ fontSize:"9px", color:"rgba(232,220,203,0.4)", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"4px" }}>{s.label}</div>
                <div style={{ fontSize:"24px", fontWeight:800, color:s.color, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background:"rgba(232,220,203,0.02)", border:"1px solid rgba(232,220,203,0.06)", borderRadius:"10px", overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr", padding:"10px 16px", background:"rgba(232,220,203,0.04)", borderBottom:"1px solid rgba(232,220,203,0.06)", fontSize:"10px", color:"rgba(232,220,203,0.45)", fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase" }}>
              {[["email","Email"],["timestamp","Date"],["screenSize","Screen"],["referrer","Source"]].map(([k,l]) => (
                <div key={k} onClick={()=>{setSortF(k);setSortD(d=>d==="asc"?"desc":"asc");}} style={{ cursor:"pointer" }}>
                  {l} {sortF===k?(sortD==="asc"?"↑":"↓"):""}
                </div>
              ))}
            </div>
            {filteredList.length===0 ? (
              <div style={{ padding:"32px", textAlign:"center", color:"rgba(232,220,203,0.3)", fontSize:"13px" }}>{loading?"Loading...":"No emails yet"}</div>
            ) : filteredList.map((e,i) => (
              <div key={i} className="rh" style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr", padding:"10px 16px", borderBottom:"1px solid rgba(232,220,203,0.03)", fontSize:"12px", background:i%2?"rgba(232,220,203,0.01)":"transparent" }}>
                <span style={{ color:C.cream }}>{e.email||"—"}</span>
                <span style={{ color:"rgba(232,220,203,0.45)" }}>{e.timestamp ? new Date(e.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}</span>
                <span style={{ color:"rgba(232,220,203,0.45)" }}>{e.screenSize||"—"}</span>
                <span style={{ color:"rgba(232,220,203,0.45)" }}>{(()=>{const r=e.referrer||"direct";if(r==="direct")return"Direct";try{return new URL(r).hostname.replace("www.","");}catch{return r;}})()}</span>
              </div>
            ))}
          </div>
        </>)}

        {/* ════════════════ BEHAVIOR ════════════════ */}
        {tab === "behavior" && (<>
          {!usingSupabase && (
            <div style={{ padding:"11px 16px", background:"rgba(194,122,58,0.08)", border:"1px solid rgba(194,122,58,0.2)", borderRadius:"10px", marginBottom:"14px", fontSize:"12px", color:"rgba(232,220,203,0.6)" }}>
              ⚠️ Behavior data is from <strong>your browser only</strong>. To see all users' clicks and filter usage, set up the Supabase <code style={{ color:C.copper }}>analytics_events</code> table in the{" "}
              <button onClick={()=>setTab("setup")} style={{ background:"none", border:"none", color:C.teal, fontWeight:700, cursor:"pointer", fontSize:"12px", padding:0 }}>Setup tab</button>.
            </div>
          )}

          <div className="srow" style={{ display:"flex", gap:"10px", marginBottom:"14px", flexWrap:"wrap" }}>
            {[
              {label:"Book Clicks",    value:bookClicks.length,  color:C.copper},
              {label:"Campfire Nav",   value:campfireClicks,     color:"#E87C5A"},
              {label:"Friends Opened", value:friendsClicks,      color:C.teal},
              {label:"Barcode Opens",  value:barcodeClicks,      color:C.sage},
              {label:"Feedback Clicks",value:feedbackClicks,     color:"#8B5CF6"},
              {label:"Filter Actions", value:filterEvents.length,color:C.copper},
            ].map(s => (
              <div key={s.label} style={{ ...card, flex:1, minWidth:"110px" }}>
                <div style={{ fontSize:"9px", color:"rgba(232,220,203,0.4)", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"4px" }}>{s.label}</div>
                <div style={{ fontSize:"24px", fontWeight:800, color:s.color, fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
            <div style={card}>
              <div style={sectionLabel}>Most Used Filters {usingSupabase&&<span style={{color:C.teal,fontWeight:400}}>· all users ✅</span>}</div>
              {Object.keys(filterCounts).length ? (
                Object.entries(filterCounts).sort((a,b)=>b[1]-a[1]).map(([k,v]) => {
                  const max = Math.max(...Object.values(filterCounts));
                  return (
                    <div key={k} style={{ marginBottom:"9px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"3px" }}>
                        <span style={{ color:C.cream }}>{k}</span>
                        <span style={{ color:C.copper, fontWeight:700 }}>{v}×</span>
                      </div>
                      <div style={{ height:"4px", background:"rgba(232,220,203,0.06)", borderRadius:"2px" }}>
                        <div style={{ height:"100%", width:`${(v/max)*100}%`, background:C.copper, borderRadius:"2px", opacity:0.65 }} />
                      </div>
                    </div>
                  );
                })
              ) : <div style={{ color:"rgba(232,220,203,0.3)", fontSize:"12px" }}>No filter data yet.</div>}
            </div>

            <div style={card}>
              <div style={sectionLabel}>Most Clicked Books {usingSupabase&&<span style={{color:C.teal,fontWeight:400}}>· all users ✅</span>}</div>
              {Object.keys(topBooks).length ? (
                Object.entries(topBooks).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v]) => (
                  <div key={k} className="rh" style={{ display:"flex", justifyContent:"space-between", padding:"6px 2px", borderBottom:"1px solid rgba(232,220,203,0.04)", fontSize:"12px" }}>
                    <span style={{ color:C.cream, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"200px" }}>{k}</span>
                    <span style={{ color:C.copper, fontWeight:600, marginLeft:"8px", flexShrink:0 }}>{v}</span>
                  </div>
                ))
              ) : <div style={{ color:"rgba(232,220,203,0.3)", fontSize:"12px" }}>No book click data yet.</div>}
            </div>
          </div>

          <div style={card}>
            <div style={sectionLabel}>Session Durations <span style={{color:"rgba(232,220,203,0.3)",fontWeight:400}}>· your browser only</span></div>
            {localSessions.length ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"3px" }}>
                {localSessions.slice(-20).reverse().map((s,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 2px", borderBottom:"1px solid rgba(232,220,203,0.04)", fontSize:"11px" }}>
                    <span style={{ color:"rgba(232,220,203,0.4)" }}>{s.timestamp?new Date(s.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}</span>
                    <span style={{ color:s.duration>60?C.teal:s.duration>20?C.copper:"#8B3A3A", fontWeight:600 }}>{s.duration}s · {s.exitPage||"app"}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ color:"rgba(232,220,203,0.3)", fontSize:"12px" }}>No session data yet.</div>}
          </div>
        </>)}

        {/* ════════════════ DEMOGRAPHICS ════════════════ */}
        {tab === "demographics" && (<>
          <div style={{ padding:"10px 16px", background:"rgba(53,96,90,0.08)", border:"1px solid rgba(53,96,90,0.18)", borderRadius:"8px", marginBottom:"14px", fontSize:"11px", color:"rgba(232,220,203,0.5)" }}>
            ✅ All demographic data is from your <strong style={{color:C.teal}}>Google Sheet sign-ups</strong> — reflects real users.
          </div>
          <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            {[{title:"Devices",data:devices},{title:"Browsers",data:browsers},{title:"Traffic Sources",data:sources},{title:"Languages",data:languages}].map(({title,data}) => (
              <div key={title} style={card}>
                <div style={sectionLabel}>{title}</div>
                {Object.keys(data).length ? <BarBreak data={data} /> : <div style={{color:"rgba(232,220,203,0.3)",fontSize:"12px"}}>No data yet</div>}
              </div>
            ))}
            <div style={card}>
              <div style={sectionLabel}>Screen Sizes</div>
              {(() => { const s=filteredEmails.reduce((a,e)=>{const k=e.screenSize||"unknown";a[k]=(a[k]||0)+1;return a;},{}); return Object.entries(s).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>(
                <div key={k} className="rh" style={{display:"flex",justifyContent:"space-between",padding:"5px 2px",borderBottom:"1px solid rgba(232,220,203,0.04)",fontSize:"12px"}}>
                  <span style={{color:C.cream}}>{k}</span><span style={{color:C.copper,fontWeight:600}}>{v}</span>
                </div>
              ));})()}
            </div>
            <div style={card}>
              <div style={sectionLabel}>Timezones</div>
              {(() => { const t=filteredEmails.reduce((a,e)=>{const k=e.timezone||"unknown";a[k]=(a[k]||0)+1;return a;},{}); return Object.entries(t).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>(
                <div key={k} className="rh" style={{display:"flex",justifyContent:"space-between",padding:"5px 2px",borderBottom:"1px solid rgba(232,220,203,0.04)",fontSize:"11px"}}>
                  <span style={{color:C.cream}}>{k}</span><span style={{color:C.copper,fontWeight:600}}>{v}</span>
                </div>
              ));})()}
            </div>
          </div>
        </>)}

        {/* ════════════════ SETUP ════════════════ */}
        {tab === "setup" && (
          <div style={{ maxWidth:"720px" }}>
            {/* Supabase all-user tracking */}
            <div style={{ ...card, borderColor:"rgba(53,96,90,0.3)", background:"rgba(53,96,90,0.07)", marginBottom:"14px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", color:C.cream, marginBottom:"6px", fontSize:"16px" }}>📊 Enable All-User Event Tracking</h3>
              <p style={{ color:"rgba(232,220,203,0.6)", fontSize:"12px", lineHeight:1.7, marginBottom:"14px" }}>
                Run this SQL in your <strong style={{color:C.teal}}>Supabase SQL Editor</strong> to start tracking filter usage and button clicks from all users — not just your browser:
              </p>
              <div style={{ background:"rgba(0,0,0,0.4)", borderRadius:"8px", padding:"14px", fontSize:"11px", fontFamily:"monospace", color:C.cream, lineHeight:1.6, overflowX:"auto", whiteSpace:"pre", marginBottom:"14px" }}>
{`create table if not exists analytics_events (
  id         uuid        default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  event_name text        not null,
  page       text,
  user_id    uuid,
  properties jsonb       default '{}'
);
alter table analytics_events enable row level security;
create policy "insert_events" on analytics_events
  for insert with check (true);
create policy "admin_read"    on analytics_events
  for select using (true);`}
              </div>
              <p style={{ color:"rgba(232,220,203,0.5)", fontSize:"11px", lineHeight:1.7, marginBottom:"10px" }}>
                Then add this to your <strong style={{color:C.copper}}>BookApp.jsx</strong> (paste after the OWNER_EMAIL line) and replace the existing <code style={{color:C.copper}}>trackFilter</code>:
              </p>
              <div style={{ background:"rgba(0,0,0,0.4)", borderRadius:"8px", padding:"14px", fontSize:"11px", fontFamily:"monospace", color:C.cream, lineHeight:1.6, overflowX:"auto", whiteSpace:"pre" }}>
{`// Save event to Supabase so admin sees ALL users (not just your browser)
const saveEvent = async (eventName, properties = {}) => {
  try {
    await supabase.from("analytics_events").insert({
      event_name: eventName,
      page: window.location.pathname,
      properties,
    });
  } catch {}
};

// trackFilter — skips owner email, saves to GA + Supabase
const trackFilter = (filterName, value) => {
  if (user?.email === OWNER_EMAIL) return;
  trackGA("filter_used", { filter: filterName, value: String(value) });
  saveEvent("filter_used", { filter: filterName, value: String(value) });
};`}
              </div>
            </div>

            {/* Google Apps Script */}
            <div style={{ ...card, marginBottom:"14px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", color:C.cream, marginBottom:"8px", fontSize:"16px" }}>Google Apps Script</h3>
              <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:"8px", padding:"14px", fontSize:"11px", fontFamily:"monospace", color:C.cream, lineHeight:1.6, overflowX:"auto", whiteSpace:"pre" }}>
{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([data.email, data.timestamp||new Date().toISOString(),
    data.userAgent||"", data.screenSize||"", data.language||"",
    data.referrer||"", data.timezone||"", data.platform||"", data.source||""]);
  return ContentService
    .createTextOutput(JSON.stringify({status:"success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (e.parameter.action === "getEmails") {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var h = ["email","timestamp","userAgent","screenSize",
             "language","referrer","timezone","platform","source"];
    var emails = [];
    for (var i = 1; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < h.length; j++) row[h[j]] = data[i][j]||"";
      emails.push(row);
    }
    return ContentService
      .createTextOutput(JSON.stringify({emails:emails}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput(JSON.stringify({error:"Unknown"}))
    .setMimeType(ContentService.MimeType.JSON);
}`}
              </div>
              <p style={{ color:"rgba(232,220,203,0.5)", fontSize:"11px", marginTop:"12px", lineHeight:1.6 }}>
                <strong style={{color:C.copper}}>Steps:</strong> Apps Script → replace code → Deploy → New Deployment → Web App → Execute as "Me" + access "Anyone" → Deploy.
              </p>
            </div>

            {/* Password + clear */}
            <div style={card}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", color:C.cream, marginBottom:"8px", fontSize:"16px" }}>Admin Password</h3>
              <p style={{ color:"rgba(232,220,203,0.6)", fontSize:"12px", lineHeight:1.7, marginBottom:"14px" }}>
                Current: <code style={{color:C.copper,background:"rgba(194,122,58,0.15)",padding:"1px 5px",borderRadius:"3px"}}>{ADMIN_PASSWORD}</code> — change in <code style={{color:C.copper,background:"rgba(194,122,58,0.15)",padding:"1px 5px",borderRadius:"3px"}}>Admin.jsx</code> line 6.
              </p>
              <button onClick={()=>{["rr_pageviews","rr_events","rr_sessions","rr_clicks"].forEach(k=>localStorage.removeItem(k));window.location.reload();}}
                style={{ padding:"7px 14px", background:"rgba(139,58,58,0.15)", border:"1px solid rgba(139,58,58,0.3)", borderRadius:"8px", color:"#C27A3A", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>
                🗑 Clear Local Analytics Cache
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
