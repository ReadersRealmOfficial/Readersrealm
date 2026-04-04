import { useState, useEffect, useCallback } from "react";

const C = { darkPurple:"#2B1E2F", copper:"#C27A3A", cream:"#E8DCCB", darkBrown:"#4A2C23", teal:"#35605A", sage:"#5B6C5D" };
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-sVVBLxol9DB2Z1oPhrFXOATQeikm4IkVYswrtHkA2-KQXWcgbB8Jrso8ZgfdL6Dq/exec";
const ADMIN_PASSWORD = "ReadersRealm2026!";

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [sortF, setSortF] = useState("timestamp");
  const [sortD, setSortD] = useState("desc");

  useEffect(() => { if (sessionStorage.getItem("rr_admin") === "true") setAuth(true); }, []);

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuth(true); sessionStorage.setItem("rr_admin", "true"); setPwErr(""); }
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
      setFetchErr("Could not fetch emails. Ensure your Apps Script has the doGet function deployed (see Setup tab).");
      try { const c = JSON.parse(localStorage.getItem("rr_admin_emails_cache") || "[]"); if (c.length) setEmails(c); } catch {}
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (auth) fetchEmails(); }, [auth, fetchEmails]);
  useEffect(() => { if (emails.length) localStorage.setItem("rr_admin_emails_cache", JSON.stringify(emails)); }, [emails]);

  // Local analytics data
  const pageViews = JSON.parse(localStorage.getItem("rr_pageviews") || "[]");
  const events = JSON.parse(localStorage.getItem("rr_events") || "[]");
  const sessions = JSON.parse(localStorage.getItem("rr_sessions") || "[]");
  const clicks = JSON.parse(localStorage.getItem("rr_clicks") || "[]");

  // Filter usage stats
  const filterEvents = events.filter(e => e.action === "filter_used");
  const filterCounts = filterEvents.reduce((acc, e) => { acc[e.filter] = (acc[e.filter] || 0) + 1; return acc; }, {});
  const bookClicks = events.filter(e => e.action === "book_click");
  const topBooks = bookClicks.reduce((acc, e) => { const k = e.title || "Unknown"; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const feedbackClicks = events.filter(e => e.action === "feedback_click").length;

  // Session stats
  const avgSession = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / sessions.length) : 0;
  const totalSessions = sessions.length;

  // Email stats
  const filtered = emails.filter(e => !search || (e.email && e.email.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => { const av = a[sortF] || "", bv = b[sortF] || ""; return sortD === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });

  const today = new Date().toISOString().split("T")[0];
  const todaySignups = emails.filter(e => e.timestamp && e.timestamp.startsWith(today)).length;
  const last7 = emails.filter(e => { if (!e.timestamp) return false; return (Date.now() - new Date(e.timestamp)) < 7*24*60*60*1000; }).length;

  // Demographics
  const devices = emails.reduce((a, e) => { const u = (e.userAgent||"").toLowerCase(); if (u.includes("mobile")||u.includes("android")||u.includes("iphone")) a.Mobile++; else if (u.includes("tablet")||u.includes("ipad")) a.Tablet++; else a.Desktop++; return a; }, { Desktop:0, Mobile:0, Tablet:0 });
  const browsers = emails.reduce((a, e) => { const u = (e.userAgent||"").toLowerCase(); if (u.includes("chrome")&&!u.includes("edg")) a.Chrome=(a.Chrome||0)+1; else if (u.includes("firefox")) a.Firefox=(a.Firefox||0)+1; else if (u.includes("safari")&&!u.includes("chrome")) a.Safari=(a.Safari||0)+1; else if (u.includes("edg")) a.Edge=(a.Edge||0)+1; else a.Other=(a.Other||0)+1; return a; }, {});
  const languages = emails.reduce((a, e) => { const l = (e.language||"unknown").split("-")[0]; a[l]=(a[l]||0)+1; return a; }, {});
  const sources = emails.reduce((a, e) => { const r = e.referrer||"direct"; const k = r==="direct"?"Direct":(() => { try { return new URL(r).hostname.replace("www.",""); } catch { return r; } })(); a[k]=(a[k]||0)+1; return a; }, {});

  const exportCSV = () => {
    const h = ["Email","Timestamp","UserAgent","ScreenSize","Language","Timezone","Referrer","Platform","Source"];
    const rows = filtered.map(e => [e.email,e.timestamp,e.userAgent?.substring(0,80),e.screenSize,e.language,e.timezone,e.referrer,e.platform,e.source]);
    const csv = [h.join(","), ...rows.map(r => r.map(c => `"${(c||"").replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rr-signups-${today}.csv`; a.click();
  };

  const clearAnalytics = () => { ["rr_pageviews","rr_events","rr_sessions","rr_clicks"].forEach(k => localStorage.removeItem(k)); window.location.reload(); };

  const Stat = ({ label, value, color = C.copper, sub }) => (
    <div style={{ padding:"18px 20px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px",flex:1,minWidth:"120px" }}>
      <div style={{ fontSize:"10px",color:"rgba(232,220,203,0.45)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"4px" }}>{label}</div>
      <div style={{ fontSize:"28px",fontWeight:800,color,fontFamily:"'Playfair Display',serif" }}>{value}</div>
      {sub && <div style={{ fontSize:"11px",color:"rgba(232,220,203,0.35)",marginTop:"2px" }}>{sub}</div>}
    </div>
  );

  const Bar = ({ data }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
    const colors = [C.copper, C.teal, C.sage, C.darkBrown, "#8B3A3A", "#6B5B7B", "#4A6B5B", "#7B5B3A"];
    return (
      <div>
        <div style={{ display:"flex",borderRadius:"6px",overflow:"hidden",height:"8px",marginBottom:"10px" }}>
          {Object.entries(data).map(([k, v], i) => <div key={k} style={{ width:`${(v/total)*100}%`,background:colors[i%colors.length] }} />)}
        </div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:"10px" }}>
          {Object.entries(data).sort((a,b)=>b[1]-a[1]).map(([k, v], i) => (
            <div key={k} style={{ display:"flex",alignItems:"center",gap:"5px",fontSize:"11px",color:"rgba(232,220,203,0.55)" }}>
              <div style={{ width:"7px",height:"7px",borderRadius:"2px",background:colors[i%colors.length] }} />
              {k}: {v} ({Math.round(v/total*100)}%)
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Table = ({ items, columns }) => (
    <div style={{ background:"rgba(232,220,203,0.02)",border:"1px solid rgba(232,220,203,0.06)",borderRadius:"10px",overflow:"hidden" }}>
      <div style={{ display:"grid",gridTemplateColumns:columns.map(c=>c.w||"1fr").join(" "),padding:"10px 16px",background:"rgba(232,220,203,0.04)",borderBottom:"1px solid rgba(232,220,203,0.06)",fontSize:"10px",color:"rgba(232,220,203,0.45)",fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase" }}>
        {columns.map(c => <div key={c.key} onClick={c.sortable ? ()=>{ setSortF(c.key); setSortD(d=>d==="asc"?"desc":"asc"); } : undefined} style={{ cursor:c.sortable?"pointer":"default" }}>{c.label} {sortF===c.key?(sortD==="asc"?"↑":"↓"):""}</div>)}
      </div>
      {items.length === 0 ? (
        <div style={{ padding:"32px 16px",textAlign:"center",color:"rgba(232,220,203,0.35)",fontSize:"13px" }}>{loading?"Loading...":"No data yet"}</div>
      ) : items.map((item, i) => (
        <div key={i} style={{ display:"grid",gridTemplateColumns:columns.map(c=>c.w||"1fr").join(" "),padding:"10px 16px",borderBottom:"1px solid rgba(232,220,203,0.03)",fontSize:"12px",color:C.cream,background:i%2?"rgba(232,220,203,0.015)":"transparent" }}>
          {columns.map(c => <div key={c.key} style={{ color:c.dim?"rgba(232,220,203,0.45)":C.cream,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.render ? c.render(item) : (item[c.key]||"—")}</div>)}
        </div>
      ))}
    </div>
  );

  // ─── Password Gate ───
  if (!auth) return (
    <div style={{ fontFamily:"'Source Sans 3',sans-serif",background:C.darkPurple,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Source+Sans+3:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ background:"linear-gradient(160deg,#2B1E2F,#1a1220)",borderRadius:"20px",padding:"40px",maxWidth:"380px",width:"100%",border:"1px solid rgba(194,122,58,0.2)",textAlign:"center" }}>
        <div style={{ fontSize:"32px",marginBottom:"10px" }}>🔐</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif",color:C.cream,marginBottom:"6px" }}>Admin Access</h2>
        <p style={{ color:"rgba(232,220,203,0.45)",fontSize:"12px",marginBottom:"20px" }}>Enter admin password</p>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
          style={{ width:"100%",padding:"13px 16px",background:"rgba(43,30,47,0.6)",border:"1px solid rgba(194,122,58,0.3)",borderRadius:"10px",color:C.cream,fontSize:"14px",marginBottom:"10px",outline:"none",boxSizing:"border-box" }} />
        {pwErr && <div style={{ color:C.copper,fontSize:"12px",marginBottom:"8px" }}>{pwErr}</div>}
        <button onClick={login} style={{ width:"100%",padding:"13px",background:`linear-gradient(135deg,${C.copper},#A86830)`,color:"#fff",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:700,cursor:"pointer" }}>Log In</button>
      </div>
    </div>
  );

  // ─── Dashboard ───
  return (
    <div style={{ fontFamily:"'Source Sans 3',sans-serif",background:"linear-gradient(180deg,#1a1220,#2B1E2F)",minHeight:"100vh",color:C.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:rgba(194,122,58,0.3);border-radius:3px}
        .tab:hover{background:rgba(232,220,203,0.06) !important}
        @media(max-width:768px){.stat-row{flex-direction:column !important}.grid-2{grid-template-columns:1fr !important}.admin-hdr{flex-direction:column !important;gap:10px !important}}
      `}</style>

      {/* Header */}
      <div className="admin-hdr" style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 28px",borderBottom:"1px solid rgba(232,220,203,0.06)",background:"rgba(74,44,35,0.3)",backdropFilter:"blur(8px)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
          <span style={{ fontSize:"18px" }}>📖</span>
          <span style={{ fontFamily:"'Playfair Display',serif",fontSize:"17px",color:C.copper,fontWeight:700,fontStyle:"italic" }}>Readers' Realm</span>
          <span style={{ fontSize:"9px",padding:"3px 8px",background:"rgba(194,122,58,0.15)",border:"1px solid rgba(194,122,58,0.3)",borderRadius:"10px",color:C.copper,fontWeight:700,letterSpacing:"0.5px" }}>ADMIN</span>
        </div>
        <div style={{ display:"flex",gap:"8px" }}>
          <button onClick={fetchEmails} disabled={loading} style={{ padding:"7px 14px",background:"rgba(53,96,90,0.2)",border:`1px solid ${C.teal}`,borderRadius:"8px",color:C.teal,fontSize:"12px",fontWeight:600,cursor:"pointer" }}>{loading?"...":"↻ Refresh"}</button>
          <button onClick={()=>{setAuth(false);sessionStorage.removeItem("rr_admin")}} style={{ padding:"7px 14px",background:"rgba(139,58,58,0.2)",border:"1px solid rgba(139,58,58,0.3)",borderRadius:"8px",color:"#C27A3A",fontSize:"12px",fontWeight:600,cursor:"pointer" }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth:"1100px",margin:"0 auto",padding:"20px 20px 60px" }}>
        {/* Tabs */}
        <div style={{ display:"flex",gap:"3px",marginBottom:"20px",background:"rgba(232,220,203,0.03)",borderRadius:"10px",padding:"3px",border:"1px solid rgba(232,220,203,0.06)",flexWrap:"wrap" }}>
          {[{id:"overview",l:"📊 Overview"},{id:"emails",l:"📧 Emails"},{id:"behavior",l:"🖱️ Behavior"},{id:"demographics",l:"👥 Demographics"},{id:"setup",l:"⚙️ Setup"}].map(t => (
            <button key={t.id} className="tab" onClick={()=>setTab(t.id)} style={{ flex:1,padding:"9px 12px",border:"none",borderRadius:"7px",fontSize:"12px",fontWeight:600,cursor:"pointer",color:tab===t.id?"#fff":"rgba(232,220,203,0.45)",background:tab===t.id?"rgba(194,122,58,0.3)":"transparent",minWidth:"80px" }}>{t.l}</button>
          ))}
        </div>

        {fetchErr && <div style={{ padding:"14px 18px",background:"rgba(194,122,58,0.1)",border:"1px solid rgba(194,122,58,0.3)",borderRadius:"10px",marginBottom:"16px",fontSize:"12px",color:"rgba(232,220,203,0.65)",lineHeight:1.6 }}>⚠️ {fetchErr}</div>}

        {/* ───── OVERVIEW ───── */}
        {tab === "overview" && (<>
          <div className="stat-row" style={{ display:"flex",gap:"12px",marginBottom:"20px",flexWrap:"wrap" }}>
            <Stat label="Total Sign-ups" value={emails.length} />
            <Stat label="Today" value={todaySignups} color={C.teal} />
            <Stat label="Last 7 Days" value={last7} color={C.sage} />
            <Stat label="Avg Session" value={avgSession ? `${avgSession}s` : "—"} color={C.darkBrown} sub={`${totalSessions} sessions`} />
          </div>
          <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"14px" }}>
            <div style={{ padding:"18px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px" }}>
              <div style={{ fontSize:"11px",color:C.copper,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"12px" }}>Page Views</div>
              {(() => {
                const pv = pageViews.reduce((a, v) => { a[v.page] = (a[v.page]||0)+1; return a; }, {});
                return Object.keys(pv).length ? <Bar data={pv} /> : <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"12px" }}>No page view data yet</div>;
              })()}
            </div>
            <div style={{ padding:"18px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px" }}>
              <div style={{ fontSize:"11px",color:C.copper,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"12px" }}>Device Types</div>
              {emails.length ? <Bar data={devices} /> : <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"12px" }}>No data yet</div>}
            </div>
          </div>
          <div style={{ padding:"14px 18px",background:"rgba(53,96,90,0.1)",border:"1px solid rgba(53,96,90,0.2)",borderRadius:"10px" }}>
            <div style={{ fontSize:"12px",color:"rgba(232,220,203,0.6)" }}>📈 For detailed click/page analytics, visit <a href="https://analytics.google.com" target="_blank" rel="noreferrer" style={{ color:C.teal,fontWeight:600 }}>Google Analytics</a> (G-E49R644RVW). Local analytics below track filter usage and session data.</div>
          </div>
        </>)}

        {/* ───── EMAILS ───── */}
        {tab === "emails" && (<>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"10px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
              <div style={{ display:"flex",alignItems:"center",background:"rgba(232,220,203,0.04)",border:"1px solid rgba(232,220,203,0.1)",borderRadius:"8px",padding:"0 10px" }}>
                <span style={{ color:"rgba(232,220,203,0.4)",fontSize:"13px" }}>🔍</span>
                <input type="text" placeholder="Search emails..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:"9px 8px",background:"transparent",border:"none",color:C.cream,fontSize:"12px",outline:"none",width:"180px" }} />
              </div>
              <span style={{ fontSize:"12px",color:"rgba(232,220,203,0.35)" }}>{filtered.length} results</span>
            </div>
            <button onClick={exportCSV} style={{ padding:"7px 14px",background:"rgba(194,122,58,0.15)",border:`1px solid ${C.copper}`,borderRadius:"8px",color:C.copper,fontSize:"12px",fontWeight:600,cursor:"pointer" }}>⬇ Export CSV</button>
          </div>
          <Table items={filtered} columns={[
            { key:"email", label:"Email", w:"2fr", sortable:true },
            { key:"timestamp", label:"Date", w:"1.5fr", sortable:true, dim:true, render: e => e.timestamp ? new Date(e.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—" },
            { key:"screenSize", label:"Screen", w:"1fr", dim:true },
            { key:"referrer", label:"Source", w:"1fr", dim:true, render: e => { const r=e.referrer||"direct"; if(r==="direct")return "Direct"; try{return new URL(r).hostname.replace("www.","");}catch{return r;} } },
          ]} />
        </>)}

        {/* ───── BEHAVIOR ───── */}
        {tab === "behavior" && (<>
          <div className="stat-row" style={{ display:"flex",gap:"12px",marginBottom:"20px",flexWrap:"wrap" }}>
            <Stat label="Book Clicks" value={bookClicks.length} color={C.copper} />
            <Stat label="Feedback Clicks" value={feedbackClicks} color={C.teal} />
            <Stat label="Filter Actions" value={filterEvents.length} color={C.teal} />
            <Stat label="Sessions Tracked" value={totalSessions} color={C.sage} />
            <Stat label="Avg Duration" value={avgSession ? `${avgSession}s` : "—"} color={C.darkBrown} />
          </div>

          <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"14px" }}>
            <div style={{ padding:"18px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px" }}>
              <div style={{ fontSize:"11px",color:C.copper,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"14px" }}>Filter Usage (which filters were used)</div>
              {Object.keys(filterCounts).length ? (
                Object.entries(filterCounts).sort((a,b)=>b[1]-a[1]).map(([k, v]) => (
                  <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(232,220,203,0.04)",fontSize:"12px" }}>
                    <span style={{ color:C.cream }}>{k}</span>
                    <span style={{ color:C.copper,fontWeight:600 }}>{v} uses</span>
                  </div>
                ))
              ) : <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"12px" }}>No filter data yet. Use the app to generate data.</div>}
            </div>

            <div style={{ padding:"18px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px" }}>
              <div style={{ fontSize:"11px",color:C.copper,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"14px" }}>Most Clicked Books</div>
              {Object.keys(topBooks).length ? (
                Object.entries(topBooks).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([k, v]) => (
                  <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(232,220,203,0.04)",fontSize:"12px" }}>
                    <span style={{ color:C.cream,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"200px" }}>{k}</span>
                    <span style={{ color:C.copper,fontWeight:600 }}>{v}</span>
                  </div>
                ))
              ) : <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"12px" }}>No book click data yet.</div>}
            </div>
          </div>

          <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px" }}>
            <div style={{ padding:"18px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px" }}>
              <div style={{ fontSize:"11px",color:C.copper,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"14px" }}>Session Durations (where users left)</div>
              {sessions.length ? sessions.slice(-20).reverse().map((s, i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(232,220,203,0.04)",fontSize:"12px" }}>
                  <span style={{ color:"rgba(232,220,203,0.5)" }}>{s.timestamp ? new Date(s.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}</span>
                  <span style={{ color:s.duration > 60 ? C.teal : s.duration > 20 ? C.copper : "#8B3A3A", fontWeight:600 }}>{s.duration}s on {s.exitPage||"app"}</span>
                </div>
              )) : <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"12px" }}>No session data yet. Browse the app and close the tab to record.</div>}
            </div>

            <div style={{ padding:"18px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px" }}>
              <div style={{ fontSize:"11px",color:C.copper,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"14px" }}>Page Views</div>
              {pageViews.length ? pageViews.slice(-20).reverse().map((v, i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(232,220,203,0.04)",fontSize:"12px" }}>
                  <span style={{ color:C.cream }}>{v.page}</span>
                  <span style={{ color:"rgba(232,220,203,0.5)" }}>{v.timestamp ? new Date(v.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}</span>
                </div>
              )) : <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"12px" }}>No page view data yet.</div>}
            </div>
          </div>

          <div style={{ marginTop:"14px",textAlign:"right" }}>
            <button onClick={clearAnalytics} style={{ padding:"7px 14px",background:"rgba(139,58,58,0.15)",border:"1px solid rgba(139,58,58,0.3)",borderRadius:"8px",color:"#8B3A3A",fontSize:"11px",fontWeight:600,cursor:"pointer" }}>🗑 Clear Local Analytics</button>
          </div>
        </>)}

        {/* ───── DEMOGRAPHICS ───── */}
        {tab === "demographics" && (<>
          <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"14px" }}>
            {[
              { title:"Devices", data:devices },
              { title:"Browsers", data:browsers },
              { title:"Traffic Sources", data:sources },
              { title:"Languages", data:languages },
            ].map(({ title, data }) => (
              <div key={title} style={{ padding:"20px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px" }}>
                <div style={{ fontSize:"11px",color:C.copper,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"14px" }}>{title}</div>
                {Object.keys(data).length ? (<>
                  <Bar data={data} />
                  <div style={{ marginTop:"12px" }}>
                    {Object.entries(data).sort((a,b)=>b[1]-a[1]).map(([k, v]) => (
                      <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(232,220,203,0.04)",fontSize:"12px" }}>
                        <span style={{ color:C.cream }}>{k}</span><span style={{ color:C.copper,fontWeight:600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </>) : <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"12px" }}>No data yet</div>}
              </div>
            ))}
          </div>
          <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px" }}>
            <div style={{ padding:"20px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px" }}>
              <div style={{ fontSize:"11px",color:C.copper,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"14px" }}>Screen Sizes</div>
              {(() => { const s = emails.reduce((a,e)=>{const k=e.screenSize||"unknown";a[k]=(a[k]||0)+1;return a;},{}); return Object.entries(s).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>(
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(232,220,203,0.04)",fontSize:"12px" }}>
                  <span style={{ color:C.cream }}>{k}</span><span style={{ color:C.copper,fontWeight:600 }}>{v}</span></div>
              )); })()}
            </div>
            <div style={{ padding:"20px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px" }}>
              <div style={{ fontSize:"11px",color:C.copper,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"14px" }}>Timezones</div>
              {(() => { const t = emails.reduce((a,e)=>{const k=e.timezone||"unknown";a[k]=(a[k]||0)+1;return a;},{}); return Object.entries(t).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>(
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(232,220,203,0.04)",fontSize:"12px" }}>
                  <span style={{ color:C.cream,fontSize:"11px" }}>{k}</span><span style={{ color:C.copper,fontWeight:600 }}>{v}</span></div>
              )); })()}
            </div>
          </div>
        </>)}

        {/* ───── SETUP ───── */}
        {tab === "setup" && (
          <div style={{ maxWidth:"700px" }}>
            <div style={{ padding:"22px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px",marginBottom:"16px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif",color:C.cream,marginBottom:"10px",fontSize:"16px" }}>Apps Script — Updated Code</h3>
              <p style={{ color:"rgba(232,220,203,0.6)",fontSize:"12px",lineHeight:1.7,marginBottom:"14px" }}>
                To enable the admin dashboard to read emails, update your Apps Script with both <code style={{ color:C.copper,background:"rgba(194,122,58,0.15)",padding:"1px 5px",borderRadius:"3px" }}>doPost</code> and <code style={{ color:C.copper,background:"rgba(194,122,58,0.15)",padding:"1px 5px",borderRadius:"3px" }}>doGet</code>:
              </p>
              <div style={{ background:"rgba(0,0,0,0.3)",borderRadius:"8px",padding:"14px",fontSize:"11px",fontFamily:"monospace",color:C.cream,lineHeight:1.6,overflowX:"auto",whiteSpace:"pre" }}>
{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.email, data.timestamp || new Date().toISOString(),
    data.userAgent||"", data.screenSize||"", data.language||"",
    data.referrer||"", data.timezone||"", data.platform||"", data.source||""
  ]);
  return ContentService.createTextOutput(JSON.stringify({status:"success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (e.parameter.action === "getEmails") {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var h = ["email","timestamp","userAgent","screenSize","language","referrer","timezone","platform","source"];
    var emails = [];
    for (var i = 1; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < h.length; j++) row[h[j]] = data[i][j] || "";
      emails.push(row);
    }
    return ContentService.createTextOutput(JSON.stringify({emails:emails}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({error:"Unknown"}))
    .setMimeType(ContentService.MimeType.JSON);
}`}
              </div>
              <p style={{ color:"rgba(232,220,203,0.5)",fontSize:"11px",marginTop:"12px",lineHeight:1.6 }}>
                <strong style={{ color:C.copper }}>Steps:</strong> Apps Script → replace code → Deploy → New Deployment → Web App → "Me" + "Anyone" → Deploy. Update the URL in Landing.jsx and Admin.jsx if it changes.
              </p>
            </div>
            <div style={{ padding:"22px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px",marginBottom:"16px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif",color:C.cream,marginBottom:"10px",fontSize:"16px" }}>Sheet Headers (Row 1)</h3>
              <div style={{ display:"flex",flexWrap:"wrap",gap:"5px",marginTop:"8px" }}>
                {["Email","Timestamp","UserAgent","ScreenSize","Language","Referrer","Timezone","Platform","Source"].map(h => (
                  <span key={h} style={{ padding:"3px 9px",background:"rgba(194,122,58,0.15)",borderRadius:"5px",fontSize:"11px",color:C.copper,fontWeight:600 }}>{h}</span>
                ))}
              </div>
            </div>
            <div style={{ padding:"22px",background:"rgba(232,220,203,0.03)",border:"1px solid rgba(232,220,203,0.08)",borderRadius:"12px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif",color:C.cream,marginBottom:"10px",fontSize:"16px" }}>Admin Password</h3>
              <p style={{ color:"rgba(232,220,203,0.6)",fontSize:"12px",lineHeight:1.7 }}>
                Current: <code style={{ color:C.copper,background:"rgba(194,122,58,0.15)",padding:"1px 5px",borderRadius:"3px" }}>{ADMIN_PASSWORD}</code> — change in <code style={{ color:C.copper,background:"rgba(194,122,58,0.15)",padding:"1px 5px",borderRadius:"3px" }}>src/pages/Admin.jsx</code> line 5.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
