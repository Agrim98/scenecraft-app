import { useState, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — swap this to your n8n server URL after deployment
// ─────────────────────────────────────────────────────────────────────────────
const N8N_BASE_URL = "https://crafterlabs.app.n8n.cloud/webhook";
const ENDPOINTS = {
  analyze:      `${N8N_BASE_URL}/scenecraft/analyze`,
  buildPrompt:  `${N8N_BASE_URL}/scenecraft/build-prompt`,
};

const STAGES = { HOME:"home", UPLOAD:"upload", ANALYZING:"analyzing", MCQ:"mcq", SUMMARY:"summary", SETUP:"setup", CALENDAR:"calendar", PUBLISH:"publish" };
const ACCENT="#E8FF47", BG="#0A0A0A", SURFACE="#141414", SURFACE2="#1E1E1E", MUTED="#555", TEXT="#F0F0F0", SUBTEXT="#888", GREEN="#4ADE80", RED="#FF6B6B", BLUE="#60A5FA", ORANGE="#FB923C";

const S = {
  app:{ minHeight:"100vh", background:BG, color:TEXT, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:"0 auto", overflowX:"hidden" },
  header:{ padding:"18px 20px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #1A1A1A" },
  logo:{ fontSize:17, fontWeight:700, letterSpacing:"-0.5px", color:TEXT, display:"flex", alignItems:"center", gap:8 },
  logoDot:{ width:8, height:8, borderRadius:"50%", background:ACCENT, display:"inline-block" },
  page:{ padding:"0 20px 100px" },
  sectionTitle:{ fontSize:12, fontWeight:700, letterSpacing:"0.08em", color:SUBTEXT, textTransform:"uppercase", marginBottom:14, marginTop:26 },
  sceneGrid:{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:7 },
  sceneSlot:{ aspectRatio:"1", borderRadius:11, background:SURFACE, border:"1.5px dashed #2A2A2A", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", overflow:"hidden" },
  sceneImg:{ width:"100%", height:"100%", objectFit:"cover" },
  sceneNumber:{ fontSize:9, color:MUTED, fontWeight:700, marginTop:3 },
  addIcon:{ fontSize:18, color:MUTED },
  statusDot:{ position:"absolute", top:5, right:5, width:7, height:7, borderRadius:"50%" },
  ctaBtn:{ width:"100%", padding:"15px 0", background:ACCENT, color:"#000", border:"none", borderRadius:13, fontSize:15, fontWeight:700, cursor:"pointer", marginTop:22 },
  igBtn:{ width:"100%", padding:"15px 0", background:"linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366)", color:"#fff", border:"none", borderRadius:13, fontSize:15, fontWeight:700, cursor:"pointer", marginTop:10 },
  secondaryBtn:{ width:"100%", padding:"13px 0", background:"transparent", color:TEXT, border:"1.5px solid #2A2A2A", borderRadius:13, fontSize:14, fontWeight:500, cursor:"pointer", marginTop:10 },
  uploadArea:{ background:SURFACE, border:"2px dashed #2A2A2A", borderRadius:18, padding:"44px 20px", textAlign:"center", cursor:"pointer", marginTop:14 },
  previewWrap:{ position:"relative", marginTop:14, borderRadius:18, overflow:"hidden" },
  previewImg:{ width:"100%", maxHeight:240, objectFit:"cover", display:"block" },
  previewOverlay:{ position:"absolute", bottom:0, left:0, right:0, padding:"40px 16px 16px", background:"linear-gradient(transparent,rgba(0,0,0,0.88))" },
  loaderWrap:{ padding:"56px 20px", textAlign:"center" },
  loaderRing:{ width:52, height:52, borderRadius:"50%", border:"3px solid #1E1E1E", borderTop:"3px solid "+ACCENT, animation:"spin 0.9s linear infinite", margin:"0 auto 20px" },
  progressBar:{ height:3, background:"#1E1E1E", borderRadius:10, marginBottom:26, marginTop:6, overflow:"hidden" },
  progressFill:{ height:"100%", background:ACCENT, borderRadius:10, transition:"width 0.4s ease" },
  questionCard:{ background:SURFACE, borderRadius:18, padding:20, marginBottom:10 },
  questionStep:{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:ACCENT, textTransform:"uppercase", marginBottom:6 },
  questionWhy:{ fontSize:11, color:SUBTEXT, marginBottom:12, lineHeight:1.5, fontStyle:"italic" },
  questionText:{ fontSize:16, fontWeight:600, lineHeight:1.5, marginBottom:18 },
  optionBtn:{ width:"100%", padding:"13px 14px", marginBottom:7, background:SURFACE2, border:"1.5px solid #2A2A2A", borderRadius:11, color:TEXT, fontSize:13, fontWeight:500, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:11, lineHeight:1.4 },
  optionBtnSel:{ background:"rgba(232,255,71,0.08)", border:"1.5px solid "+ACCENT, color:ACCENT },
  nextBtn:{ width:"100%", padding:"14px 0", background:ACCENT, color:"#000", border:"none", borderRadius:13, fontSize:15, fontWeight:700, cursor:"pointer", marginTop:7 },
  card:{ background:SURFACE, borderRadius:18, padding:18, marginTop:14 },
  cardLabel:{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:ACCENT, textTransform:"uppercase", marginBottom:8 },
  promptBox:{ background:SURFACE2, borderRadius:12, padding:14, fontSize:13, lineHeight:1.75, color:TEXT, border:"1px solid #2A2A2A", marginTop:10 },
  tagRow:{ display:"flex", flexWrap:"wrap", gap:5, marginTop:10 },
  tag:{ background:SURFACE2, border:"1px solid #2A2A2A", borderRadius:20, padding:"4px 10px", fontSize:11, color:SUBTEXT },
  hashTag:{ background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:20, padding:"4px 10px", fontSize:11, color:BLUE },
  sceneListItem:{ background:SURFACE, borderRadius:14, padding:"13px 14px", marginBottom:9, display:"flex", alignItems:"center", gap:12 },
  sceneThumb:{ width:50, height:50, borderRadius:9, objectFit:"cover", flexShrink:0 },
  backBtn:{ background:"transparent", border:"none", color:SUBTEXT, fontSize:22, cursor:"pointer", padding:0 },
  errorBox:{ background:"rgba(255,80,80,0.08)", border:"1px solid rgba(255,80,80,0.25)", borderRadius:11, padding:"13px 14px", fontSize:13, color:RED, marginTop:10, lineHeight:1.5 },
  successBox:{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:11, padding:"13px 14px", fontSize:13, color:GREEN, marginTop:10, lineHeight:1.5 },
  imageDescBox:{ background:SURFACE, borderRadius:12, padding:"11px 14px", marginTop:18, marginBottom:18, fontSize:12, color:SUBTEXT, lineHeight:1.6, borderLeft:"3px solid "+ACCENT },
  tokenBadge:{ display:"flex", alignItems:"center", gap:5, background:SURFACE2, border:"1px solid #2A2A2A", borderRadius:20, padding:"4px 10px", fontSize:12 },
  input:{ width:"100%", background:SURFACE2, border:"1.5px solid #2A2A2A", borderRadius:11, padding:"13px 14px", fontSize:14, color:TEXT, outline:"none", boxSizing:"border-box" },
  textarea:{ width:"100%", background:SURFACE2, border:"1.5px solid #2A2A2A", borderRadius:11, padding:"13px 14px", fontSize:13, color:TEXT, outline:"none", boxSizing:"border-box", resize:"vertical", minHeight:90, lineHeight:1.6, fontFamily:"'DM Sans',sans-serif" },
  tabRow:{ display:"flex", gap:2, padding:"14px 20px 0", borderBottom:"1px solid #1A1A1A" },
  tab:{ padding:"8px 14px", fontSize:13, fontWeight:600, background:"transparent", border:"none", color:SUBTEXT, cursor:"pointer" },
  tabActive:{ color:ACCENT, borderBottom:"2px solid "+ACCENT },
  n8nBanner:{ background:"rgba(232,255,71,0.06)", border:"1px solid rgba(232,255,71,0.2)", borderRadius:12, padding:"12px 14px", fontSize:12, color:SUBTEXT, lineHeight:1.6, marginTop:14 },
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function getCalendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < first; i++) days.push(null);
  for (let d = 1; d <= total; d++) days.push(d);
  return days;
}

// ── Token Setup ───────────────────────────────────────────────────────────────
function TokenSetup({ onSave }) {
  const [token, setToken] = useState("");
  const [n8nUrl, setN8nUrl] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1=token, 2=n8n url

  const validateToken = () => {
    if (!token.trim().startsWith("SC-")) { setError("Invalid token. Tokens start with SC-"); return; }
    const parts = token.trim().split("-");
    if (parts.length < 3) { setError("Malformed token format."); return; }
    const credits = parseInt(parts[1]);
    if (isNaN(credits) || credits <= 0) { setError("This token has no credits."); return; }
    setError("");
    setStep(2);
  };

  const saveAll = () => {
    const url = n8nUrl.trim() || N8N_BASE_URL;
    const parts = token.trim().split("-");
    const credits = parseInt(parts[1]) || 10;
    onSave({ token: token.trim(), credits, usedCredits: 0, n8nUrl: url });
  };

  return (
    <div style={{ padding:"36px 20px" }}>
      {step === 1 ? <>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:44, marginBottom:14 }}>🔑</div>
          <div style={{ fontSize:21, fontWeight:700, marginBottom:8 }}>Enter Access Token</div>
          <div style={{ fontSize:13, color:SUBTEXT, lineHeight:1.7 }}>Get your token from the publisher. Each token includes a set number of AI prompt credits.</div>
        </div>
        <div style={{ fontSize:12, color:SUBTEXT, fontWeight:700, marginBottom:7, letterSpacing:"0.06em", textTransform:"uppercase" }}>Your Token</div>
        <input style={{ ...S.input, fontFamily:"monospace", fontSize:15, letterSpacing:1 }} placeholder="SC-10-XXXXXXXX" value={token} onChange={e => { setToken(e.target.value); setError(""); }} onKeyDown={e => e.key==="Enter" && validateToken()} />
        {error && <div style={S.errorBox}>{error}</div>}
        <div style={{ marginTop:14, padding:"12px 14px", background:SURFACE, borderRadius:11, fontSize:12, color:SUBTEXT, lineHeight:1.65 }}>
          💡 Format: <span style={{ color:TEXT, fontFamily:"monospace" }}>SC-[credits]-[code]</span><br/>
          Example: <span style={{ color:ACCENT, fontFamily:"monospace" }}>SC-10-ABC12345</span> = 10 credits
        </div>
        <button style={S.ctaBtn} onClick={validateToken}>Next →</button>
      </> : <>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:44, marginBottom:14 }}>🔧</div>
          <div style={{ fontSize:21, fontWeight:700, marginBottom:8 }}>Connect Your n8n Server</div>
          <div style={{ fontSize:13, color:SUBTEXT, lineHeight:1.7 }}>Enter your self-hosted n8n webhook URL. This is where all AI processing happens.</div>
        </div>
        <div style={{ fontSize:12, color:SUBTEXT, fontWeight:700, marginBottom:7, letterSpacing:"0.06em", textTransform:"uppercase" }}>n8n Server URL</div>
        <input style={{ ...S.input, fontSize:13 }} placeholder="https://your-n8n.yourdomain.com/webhook" value={n8nUrl} onChange={e => setN8nUrl(e.target.value)} />
        <div style={S.n8nBanner}>
          ✦ After importing the workflow JSON into n8n, your webhook URLs will be:<br/>
          <span style={{ color:ACCENT, fontFamily:"monospace", fontSize:11 }}>/webhook/scenecraft/analyze</span><br/>
          <span style={{ color:ACCENT, fontFamily:"monospace", fontSize:11 }}>/webhook/scenecraft/build-prompt</span>
        </div>
        <button style={S.ctaBtn} onClick={saveAll}>Activate →</button>
        <button style={S.secondaryBtn} onClick={() => setStep(1)}>← Back</button>
      </>}
    </div>
  );
}

// ── MCQ Flow ──────────────────────────────────────────────────────────────────
function MCQFlow({ questions, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  const toggle = (val) => {
    if (q.type === "multi") {
      const prev = answers[q.id] || [];
      if (val === "none") { setAnswers({ ...answers, [q.id]: prev.includes("none") ? [] : ["none"] }); return; }
      const filtered = prev.filter(v => v !== "none");
      const next = filtered.includes(val) ? filtered.filter(v => v !== val) : filtered.length < 2 ? [...filtered, val] : filtered;
      setAnswers({ ...answers, [q.id]: next });
    } else {
      setAnswers({ ...answers, [q.id]: val });
    }
  };

  const isSelected = (val) => q.type === "multi" ? (answers[q.id] || []).includes(val) : answers[q.id] === val;
  const canNext = q.type === "multi" ? (answers[q.id] || []).length > 0 : !!answers[q.id];

  return (
    <div>
      <div style={S.progressBar}><div style={{ ...S.progressFill, width:`${progress}%` }} /></div>
      <div style={S.questionCard}>
        <div style={S.questionStep}>{q.step}</div>
        <div style={S.questionText}>{q.question}</div>
        {q.why_asking && <div style={S.questionWhy}>Why we're asking: {q.why_asking}</div>}
        {q.type === "multi" && <div style={{ fontSize:11, color:SUBTEXT, marginBottom:10, textAlign:"right" }}>Pick up to 2</div>}
        {q.options.map(opt => (
          <button key={opt.value} style={{ ...S.optionBtn, ...(isSelected(opt.value) ? S.optionBtnSel : {}) }} onClick={() => toggle(opt.value)}>
            <span style={{ fontSize:19, flexShrink:0 }}>{opt.emoji}</span>
            <div style={{ flex:1 }}>
              <div>{opt.label}</div>
              {opt.prompt_impact && <div style={{ fontSize:11, color: isSelected(opt.value) ? "rgba(232,255,71,0.6)" : MUTED, marginTop:2 }}>{opt.prompt_impact}</div>}
            </div>
          </button>
        ))}
      </div>
      <button style={{ ...S.nextBtn, opacity:canNext?1:0.35 }} disabled={!canNext} onClick={() => {
        if (current < questions.length - 1) setCurrent(current + 1);
        else onComplete(answers);
      }}>
        {current < questions.length - 1 ? "Next →" : "Generate Prompt ✦"}
      </button>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function CalendarView({ allDayScenes, onDaySelect, onBack }) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const days = getCalendarDays(calYear, calMonth);
  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();
  const today = now.getDate();

  const prevMonth = () => { if (calMonth===0){setCalMonth(11);setCalYear(calYear-1);}else setCalMonth(calMonth-1); };
  const nextMonth = () => { if (calMonth===11){setCalMonth(0);setCalYear(calYear+1);}else setCalMonth(calMonth+1); };
  const dayKey = (d) => `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const selectedScenes = selectedDay ? (allDayScenes[dayKey(selectedDay)] || []) : [];

  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={S.header}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button style={S.backBtn} onClick={onBack}>←</button>
          <div style={S.logo}><span style={S.logoDot}/>Calendar</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button style={{ ...S.backBtn, fontSize:18 }} onClick={prevMonth}>‹</button>
          <span style={{ fontSize:13, fontWeight:700, color:TEXT, minWidth:70, textAlign:"center" }}>{MONTH_NAMES[calMonth]} {calYear}</span>
          <button style={{ ...S.backBtn, fontSize:18 }} onClick={nextMonth}>›</button>
        </div>
      </div>
      <div style={{ padding:"18px 14px 0" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
          {DAY_NAMES.map(d => <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:MUTED, padding:"3px 0" }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {days.map((d, i) => {
            if (!d) return <div key={i}/>;
            const key = dayKey(d);
            const scns = allDayScenes[key] || [];
            const hasScenes = scns.length > 0;
            const isToday = isCurrentMonth && d === today;
            const isSel = selectedDay === d;
            return (
              <button key={i} onClick={() => setSelectedDay(isSel ? null : d)} style={{
                aspectRatio:"1", borderRadius:9, border:"none", cursor:"pointer", position:"relative",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3,
                background: isSel ? ACCENT : isToday ? "rgba(232,255,71,0.1)" : SURFACE,
                outline: isToday && !isSel ? `1.5px solid ${ACCENT}` : "none",
              }}>
                <span style={{ fontSize:13, fontWeight:600, color: isSel ? "#000" : isToday ? ACCENT : TEXT }}>{d}</span>
                {hasScenes && <div style={{ display:"flex", gap:2 }}>
                  {scns.slice(0,5).map((sc,si) => <div key={si} style={{ width:4, height:4, borderRadius:"50%", background: sc?.published ? GREEN : isSel ? "#000" : ACCENT }}/>)}
                </div>}
              </button>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:14, padding:"13px 2px 0", fontSize:11, color:SUBTEXT }}>
          <span><span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:ACCENT, marginRight:4 }}/>Ready</span>
          <span><span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:GREEN, marginRight:4 }}/>Published</span>
        </div>
      </div>
      {selectedDay && (
        <div style={{ padding:"18px 16px 100px" }}>
          <div style={S.sectionTitle}>{MONTH_NAMES[calMonth]} {selectedDay}</div>
          {selectedScenes.length === 0 ? (
            <div style={{ background:SURFACE, borderRadius:14, padding:22, textAlign:"center" }}>
              <div style={{ fontSize:22, marginBottom:8 }}>📭</div>
              <div style={{ fontSize:13, color:SUBTEXT }}>No scenes for this day</div>
            </div>
          ) : selectedScenes.map((scene, i) => scene ? (
            <div key={i} style={{ background:SURFACE, borderRadius:14, padding:14, marginBottom:9 }}>
              <div style={{ display:"flex", gap:11, alignItems:"flex-start" }}>
                {scene.img && <img src={scene.img} style={{ width:58, height:58, borderRadius:9, objectFit:"cover", flexShrink:0 }}/>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>Scene {i+1}</span>
                    {scene.published
                      ? <span style={{ fontSize:10, background:"rgba(74,222,128,0.1)", color:GREEN, padding:"2px 8px", borderRadius:20, border:"1px solid rgba(74,222,128,0.2)" }}>Published</span>
                      : <span style={{ fontSize:10, background:"rgba(232,255,71,0.1)", color:ACCENT, padding:"2px 8px", borderRadius:20, border:"1px solid rgba(232,255,71,0.2)" }}>Ready</span>
                    }
                  </div>
                  <div style={{ fontSize:11, color:SUBTEXT, lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{scene.prompt}</div>
                </div>
              </div>
              {!scene.published && <button style={{ ...S.igBtn, marginTop:11, padding:"11px 0", fontSize:13 }} onClick={() => onDaySelect(selectedDay, calYear, calMonth, i)}>📸 Publish to Instagram</button>}
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );
}

// ── Instagram Publish ─────────────────────────────────────────────────────────
function PublishView({ scene, sceneIndex, onBack, onPublish }) {
  const [caption, setCaption] = useState(scene?.caption || scene?.prompt?.slice(0,120) || "");
  const [hashtags, setHashtags] = useState(scene?.hashtags || "#aiVideo #contentCreator #reels #cinematicvideo #higgsfield #aiads");
  const [publishNow, setPublishNow] = useState(true);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [igToken, setIgToken] = useState(() => { try { return localStorage.getItem("ig_token")||""; } catch(e){return "";} });
  const [igUserId, setIgUserId] = useState(() => { try { return localStorage.getItem("ig_user_id")||""; } catch(e){return "";} });
  const [showIgSetup, setShowIgSetup] = useState(false);
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const saveIg = () => {
    try { localStorage.setItem("ig_token", igToken); localStorage.setItem("ig_user_id", igUserId); } catch(e){}
    setShowIgSetup(false);
    setStatus("Instagram credentials saved ✓");
  };

  const hashtagCount = hashtags.split(/\s+/).filter(t => t.startsWith("#")).length;
  const fullCaption = `${caption}\n\n${hashtags}`.trim();

  const handlePublish = async () => {
    setPosting(true); setError(""); setStatus("");
    await new Promise(r => setTimeout(r, 1800));
    const when = publishNow ? "immediately" : `on ${scheduleDate} at ${scheduleTime}`;
    setStatus(`✅ Queued for Instagram ${when}`);
    setPosting(false);
    setTimeout(() => onPublish({ ...scene, published:true, publishedAt:when, caption:fullCaption }), 1400);
  };

  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} textarea{font-family:'DM Sans',sans-serif}`}</style>
      <div style={S.header}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button style={S.backBtn} onClick={onBack}>←</button>
          <div style={S.logo}><span style={S.logoDot}/>Publish</div>
        </div>
        <div style={{ fontSize:12, color:SUBTEXT, background:SURFACE2, padding:"4px 10px", borderRadius:20, border:"1px solid #2A2A2A" }}>Scene {sceneIndex+1}</div>
      </div>
      <div style={S.page}>
        {scene?.img && <div style={{ marginTop:18, borderRadius:14, overflow:"hidden" }}>
          <img src={scene.img} style={{ width:"100%", maxHeight:190, objectFit:"cover", display:"block" }}/>
        </div>}

        {/* Scene prompt summary */}
        {scene?.higgsfield_prompt && <div style={S.n8nBanner}>
          <span style={{ fontWeight:600, color:TEXT }}>Higgsfield Prompt: </span>{scene.higgsfield_prompt}
        </div>}

        {/* Scene role badge */}
        {scene?.scene_role && <div style={{ marginTop:10, display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:11, color:SUBTEXT }}>Role in 30-sec ad:</span>
          <span style={{ fontSize:11, background:"rgba(96,165,250,0.1)", color:BLUE, padding:"3px 9px", borderRadius:20, fontWeight:600, border:"1px solid rgba(96,165,250,0.2)", textTransform:"capitalize" }}>{scene.scene_role}</span>
        </div>}

        {/* Instagram account */}
        <div style={{ ...S.card }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={S.cardLabel}>Instagram Account</div>
            <button style={{ fontSize:12, color:BLUE, background:"transparent", border:"none", cursor:"pointer", fontWeight:600 }} onClick={() => setShowIgSetup(!showIgSetup)}>{igToken ? "Edit":"Connect"} →</button>
          </div>
          {igToken ? (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📸</div>
              <div><div style={{ fontSize:13, fontWeight:600 }}>Connected</div><div style={{ fontSize:11, color:SUBTEXT }}>ID: {igUserId||"—"}</div></div>
              <div style={{ marginLeft:"auto", width:7, height:7, borderRadius:"50%", background:GREEN }}/>
            </div>
          ) : <div style={{ fontSize:13, color:SUBTEXT }}>No Instagram account connected.</div>}
          {showIgSetup && <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #2A2A2A" }}>
            <div style={{ fontSize:11, color:SUBTEXT, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Access Token</div>
            <input style={{ ...S.input, marginBottom:9, fontSize:13 }} placeholder="Instagram Graph API token" value={igToken} onChange={e => setIgToken(e.target.value)}/>
            <div style={{ fontSize:11, color:SUBTEXT, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Business User ID</div>
            <input style={{ ...S.input, fontSize:13 }} placeholder="Instagram User ID" value={igUserId} onChange={e => setIgUserId(e.target.value)}/>
            <button style={{ ...S.ctaBtn, marginTop:11, padding:"12px 0", fontSize:13 }} onClick={saveIg}>Save</button>
          </div>}
        </div>

        {/* Caption */}
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:11, color:SUBTEXT, fontWeight:700, marginBottom:7, textTransform:"uppercase", letterSpacing:"0.06em" }}>Caption</div>
          <textarea style={S.textarea} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write your caption…"/>
        </div>

        {/* Hashtags */}
        <div style={{ marginTop:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
            <div style={{ fontSize:11, color:SUBTEXT, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Hashtags</div>
            <div style={{ fontSize:11, color: hashtagCount > 25 ? RED : MUTED }}>{hashtagCount}/30</div>
          </div>
          <textarea style={{ ...S.textarea, minHeight:75, fontSize:12, color:BLUE }} value={hashtags} onChange={e => setHashtags(e.target.value)}/>
        </div>

        {/* Hashtag sets from n8n */}
        {scene?.hashtag_sets && (
          <div style={S.card}>
            <div style={S.cardLabel}>Hashtag Sets from AI</div>
            <div style={{ marginTop:8 }}>
              {Object.entries(scene.hashtag_sets).map(([set, tags]) => (
                <div key={set} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:11, color:MUTED, marginBottom:4, textTransform:"capitalize" }}>{set}</div>
                  <div style={S.tagRow}>
                    {(tags||[]).map(t => <span key={t} style={S.hashTag} onClick={() => setHashtags(h => h + " " + t)}>{t}</span>)}
                  </div>
                </div>
              ))}
              <div style={{ fontSize:11, color:SUBTEXT, marginTop:6 }}>Tap a tag to add it ↑</div>
            </div>
          </div>
        )}

        {/* Schedule */}
        <div style={S.card}>
          <div style={S.cardLabel}>When to Post</div>
          <div style={{ display:"flex", gap:7, marginTop:10 }}>
            {[{label:"Post Now",val:true},{label:"Schedule",val:false}].map(opt => (
              <button key={String(opt.val)} onClick={() => setPublishNow(opt.val)} style={{
                flex:1, padding:"11px 0", borderRadius:11, fontSize:13, fontWeight:600, cursor:"pointer",
                background: publishNow===opt.val ? ACCENT : SURFACE2,
                color: publishNow===opt.val ? "#000" : TEXT,
                border: publishNow===opt.val ? "none" : "1.5px solid #2A2A2A",
              }}>{opt.label}</button>
            ))}
          </div>
          {!publishNow && <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
            <div>
              <div style={{ fontSize:11, color:SUBTEXT, marginBottom:5, fontWeight:700 }}>DATE</div>
              <input type="date" style={{ ...S.input, fontSize:13 }} value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}/>
            </div>
            <div>
              <div style={{ fontSize:11, color:SUBTEXT, marginBottom:5, fontWeight:700 }}>TIME</div>
              <input type="time" style={{ ...S.input, fontSize:13 }} value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}/>
            </div>
          </div>}
        </div>

        {/* Preview */}
        <div style={S.card}>
          <div style={S.cardLabel}>Post Preview</div>
          <div style={{ fontSize:13, color:TEXT, lineHeight:1.7, marginTop:8, whiteSpace:"pre-wrap" }}>{fullCaption}</div>
        </div>

        {/* Next scene suggestion */}
        {scene?.next_scene_suggestion && <div style={{ ...S.n8nBanner, marginTop:14 }}>
          <span style={{ fontWeight:600, color:TEXT }}>💡 Next scene idea: </span>{scene.next_scene_suggestion}
        </div>}

        {error && <div style={S.errorBox}>{error}</div>}
        {status && <div style={S.successBox}>{status}</div>}

        <button style={{ ...S.igBtn, opacity:posting?0.6:1 }} disabled={posting} onClick={handlePublish}>
          {posting ? "⏳ Queuing…" : publishNow ? "📸 Publish to Instagram Now" : "📅 Schedule Post"}
        </button>
        <button style={S.secondaryBtn} onClick={onBack}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [stage, setStage] = useState(STAGES.HOME);
  const [tokenData, setTokenData] = useState(() => { try { return JSON.parse(localStorage.getItem("sc_token")||"null"); } catch(e){return null;} });
  const [scenes, setScenes] = useState([null,null,null,null,null]);
  const [activeSlot, setActiveSlot] = useState(null);
  const [uploadedImg, setUploadedImg] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sceneResult, setSceneResult] = useState(null); // full n8n response
  const [error, setError] = useState("");
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [publishScene, setPublishScene] = useState(null);
  const [publishSceneIdx, setPublishSceneIdx] = useState(null);
  const [allDayScenes, setAllDayScenes] = useState({});
  const [analyzeStep, setAnalyzeStep] = useState(""); // status message during analysis
  const fileRef = useRef();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const todayLabel = today.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
  const filledCount = scenes.filter(Boolean).length;
  const creditsLeft = tokenData ? tokenData.credits - tokenData.usedCredits : 0;

  const n8nBase = tokenData?.n8nUrl || N8N_BASE_URL;

  const saveToken = (data) => {
    try { localStorage.setItem("sc_token", JSON.stringify(data)); } catch(e){}
    setTokenData(data);
  };

  const consumeCredit = () => {
    const updated = { ...tokenData, usedCredits: tokenData.usedCredits + 1 };
    try { localStorage.setItem("sc_token", JSON.stringify(updated)); } catch(e){}
    setTokenData(updated);
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImg(e.target.result);
    reader.readAsDataURL(file);
  };

  // ── Step 1: Send image to n8n → get questions back ──
  const analyzeImage = async () => {
    if (!uploadedImg) return;
    if (creditsLeft <= 0) { setError("No credits left. Get a new token from the publisher."); return; }
    setStage(STAGES.ANALYZING);
    setError("");
    setAnalyzeStep("Sending image to your n8n server…");

    try {
      const base64 = uploadedImg.split(",")[1];
      const mediaType = uploadedImg.split(";")[0].split(":")[1];
      const sid = "sess_" + Date.now();
      setSessionId(sid);

      setAnalyzeStep("Claude is analyzing the scene…");
      const res = await fetch(`${n8nBase}/scenecraft/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: base64,
          media_type: mediaType,
          client_token: tokenData.token,
          session_id: sid,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      setAnalyzeStep("Building your questions…");
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Analysis failed");

      setAnalysis(data.analysis);
      setQuestions(data.questions);
      setStage(STAGES.MCQ);
    } catch(e) {
      // If n8n not yet configured, show helpful message
      if (e.message.includes("fetch") || e.message.includes("Failed") || e.message.includes("NetworkError")) {
        setError("⚠️ Cannot reach your n8n server. Make sure it's running and the URL is correct in your token setup. URL: " + n8nBase + "/scenecraft/analyze");
      } else {
        setError("Analysis failed: " + e.message);
      }
      setStage(STAGES.UPLOAD);
    }
  };

  // ── Step 2: Send answers to n8n → get final prompt back ──
  const handleAnswers = async (answers) => {
    setGeneratingPrompt(true);
    setError("");
    try {
      const res = await fetch(`${n8nBase}/scenecraft/build-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          client_token: tokenData.token,
          image_description: analysis?.description || "",
          analysis,
          answers,
          questions,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Prompt generation failed");

      consumeCredit();
      setSceneResult(data);

      const sceneObj = {
        img: uploadedImg,
        prompt: data.higgsfield_prompt,
        higgsfield_prompt: data.higgsfield_prompt,
        caption: data.caption,
        hashtags: data.hashtags,
        hashtag_sets: data.hashtag_sets,
        scene_role: data.scene_role,
        next_scene_suggestion: data.next_scene_suggestion,
        imageDesc: analysis?.description,
        answers, questions, status:"ready", published:false,
      };

      const newScenes = [...scenes];
      newScenes[activeSlot] = sceneObj;
      setScenes(newScenes);

      setAllDayScenes(prev => {
        const existing = [...(prev[todayStr] || [])];
        existing[activeSlot] = { img:uploadedImg, prompt:data.higgsfield_prompt, caption:data.caption, hashtags:data.hashtags, hashtag_sets:data.hashtag_sets, scene_role:data.scene_role, next_scene_suggestion:data.next_scene_suggestion, published:false };
        return { ...prev, [todayStr]: existing };
      });

      setStage(STAGES.SUMMARY);
    } catch(e) {
      setError("Prompt generation failed: " + e.message);
    } finally { setGeneratingPrompt(false); }
  };

  const handlePublishDone = (updatedScene) => {
    const newScenes = [...scenes];
    if (publishSceneIdx !== null) newScenes[publishSceneIdx] = { ...newScenes[publishSceneIdx], published:true };
    setScenes(newScenes);
    setAllDayScenes(prev => {
      const existing = [...(prev[todayStr]||[])];
      if (publishSceneIdx !== null) existing[publishSceneIdx] = { ...(existing[publishSceneIdx]||{}), published:true };
      return { ...prev, [todayStr]: existing };
    });
    setStage(STAGES.HOME);
    setPublishScene(null); setPublishSceneIdx(null);
  };

  const goHome = () => { setStage(STAGES.HOME); setUploadedImg(null); setError(""); setQuestions([]); setAnalysis(null); setSceneResult(null); };
  const openSlot = (i) => { setActiveSlot(i); setUploadedImg(null); setError(""); setStage(STAGES.UPLOAD); };

  if (!tokenData) return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={S.header}><div style={S.logo}><span style={S.logoDot}/>SceneCraft</div><div style={{ fontSize:12, color:SUBTEXT, background:SURFACE2, padding:"4px 10px", borderRadius:20, border:"1px solid #2A2A2A" }}>{todayLabel}</div></div>
      <TokenSetup onSave={saveToken}/>
    </div>
  );

  if (stage === STAGES.PUBLISH && publishScene) return <PublishView scene={publishScene} sceneIndex={publishSceneIdx||0} onBack={() => setStage(STAGES.HOME)} onPublish={handlePublishDone}/>;

  if (stage === STAGES.CALENDAR) return <CalendarView allDayScenes={allDayScenes} onBack={() => setStage(STAGES.HOME)} onDaySelect={(day, year, month, sceneIdx) => {
    const key = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const sc = allDayScenes[key]?.[sceneIdx??0];
    if (sc) { setPublishScene(sc); setPublishSceneIdx(sceneIdx??0); setStage(STAGES.PUBLISH); }
  }}/>;

  const credColor = creditsLeft > 5 ? ACCENT : creditsLeft > 1 ? ORANGE : RED;
  const CredBadge = () => <div style={S.tokenBadge}><span>🎟️</span><span style={{ fontWeight:700, color:credColor }}>{creditsLeft}</span><span style={{ color:SUBTEXT }}>credits</span></div>;

  if (stage === STAGES.ANALYZING) return (
    <div style={S.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={S.header}><div style={{ display:"flex", alignItems:"center", gap:10 }}><button style={S.backBtn} onClick={goHome}>←</button><div style={S.logo}><span style={S.logoDot}/>SceneCraft</div></div><CredBadge/></div>
      <div style={S.loaderWrap}>
        <div style={S.loaderRing}/>
        <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>Analyzing your scene…</div>
        <div style={{ fontSize:13, color:ACCENT, marginBottom:6, fontWeight:600 }}>{analyzeStep}</div>
        <div style={{ fontSize:13, color:SUBTEXT, lineHeight:1.6 }}>Your n8n server is running Claude's<br/>two-step questioning engine.</div>
        <div style={{ marginTop:20, padding:"10px 14px", background:SURFACE, borderRadius:10, fontSize:11, color:MUTED, fontFamily:"monospace" }}>→ {n8nBase}/scenecraft/analyze</div>
      </div>
    </div>
  );

  if (stage === STAGES.UPLOAD) return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button:active{opacity:0.75}`}</style>
      <div style={S.header}><div style={{ display:"flex", alignItems:"center", gap:10 }}><button style={S.backBtn} onClick={goHome}>←</button><div style={S.logo}><span style={S.logoDot}/>SceneCraft</div></div><CredBadge/></div>
      <div style={S.page}>
        <div style={S.sectionTitle}>Scene {activeSlot+1}</div>
        {creditsLeft <= 0 ? (
          <div style={{ ...S.errorBox, textAlign:"center", padding:22 }}>
            <div style={{ fontSize:22, marginBottom:8 }}>🎟️</div>
            <div style={{ fontWeight:600, marginBottom:4 }}>No credits remaining</div>
            <div>Contact the publisher for a new token.</div>
          </div>
        ) : !uploadedImg ? (
          <div style={S.uploadArea} onClick={() => fileRef.current.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
            <div style={{ fontSize:38, marginBottom:10 }}>🖼️</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:5 }}>Drop your scene here</div>
            <div style={{ fontSize:12, color:SUBTEXT }}>Tap to browse · JPG, PNG, WEBP</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])}/>
          </div>
        ) : (
          <div style={S.previewWrap}>
            <img src={uploadedImg} alt="preview" style={S.previewImg}/>
            <div style={S.previewOverlay}>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", marginBottom:3 }}>Scene {activeSlot+1} · Uses 1 credit</div>
              <div style={{ fontSize:14, fontWeight:600, color:"#fff" }}>Ready for AI analysis ✦</div>
            </div>
          </div>
        )}
        {error && <div style={S.errorBox}>{error}</div>}
        {uploadedImg && creditsLeft > 0 && <>
          <button style={S.ctaBtn} onClick={analyzeImage}>Analyze & Build Prompt →</button>
          <button style={S.secondaryBtn} onClick={() => setUploadedImg(null)}>Change Image</button>
        </>}
      </div>
    </div>
  );

  if (stage === STAGES.MCQ) return (
    <div style={S.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button:active{opacity:0.75}`}</style>
      <div style={S.header}><div style={{ display:"flex", alignItems:"center", gap:10 }}><button style={S.backBtn} onClick={goHome}>←</button><div style={S.logo}><span style={S.logoDot}/>SceneCraft</div></div><CredBadge/></div>
      <div style={S.page}>
        {analysis && <div style={S.imageDescBox}><span style={{ fontWeight:600, color:TEXT }}>Claude sees: </span>{analysis.description}</div>}
        {generatingPrompt ? (
          <div style={{ textAlign:"center", padding:"40px 0" }}>
            <div style={S.loaderRing}/>
            <div style={{ fontSize:14, fontWeight:600 }}>Building your Higgsfield prompt…</div>
            <div style={{ fontSize:12, color:SUBTEXT, marginTop:6 }}>n8n is crafting caption + hashtags too</div>
          </div>
        ) : <MCQFlow questions={questions} onComplete={handleAnswers}/>}
        {error && <div style={S.errorBox}>{error}</div>}
      </div>
    </div>
  );

  if (stage === STAGES.SUMMARY && sceneResult) return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button:active{opacity:0.75}`}</style>
      <div style={S.header}><div style={{ display:"flex", alignItems:"center", gap:10 }}><button style={S.backBtn} onClick={goHome}>←</button><div style={S.logo}><span style={S.logoDot}/>SceneCraft</div></div><CredBadge/></div>
      <div style={S.page}>
        <div style={{ marginTop:22, textAlign:"center", marginBottom:22 }}>
          <div style={{ fontSize:30, marginBottom:7 }}>✦</div>
          <div style={{ fontSize:19, fontWeight:700, marginBottom:5 }}>Scene {activeSlot+1} Ready</div>
          <div style={{ fontSize:13, color:SUBTEXT }}>Prompt crafted by your n8n engine</div>
        </div>
        {uploadedImg && <img src={uploadedImg} alt="scene" style={{ width:"100%", maxHeight:190, objectFit:"cover", borderRadius:14 }}/>}

        {sceneResult.scene_role && <div style={{ marginTop:10, display:"flex", gap:7, alignItems:"center" }}>
          <span style={{ fontSize:11, color:SUBTEXT }}>Role in 30-sec ad:</span>
          <span style={{ fontSize:11, background:"rgba(96,165,250,0.1)", color:BLUE, padding:"3px 9px", borderRadius:20, fontWeight:600, border:"1px solid rgba(96,165,250,0.2)", textTransform:"capitalize" }}>{sceneResult.scene_role}</span>
        </div>}

        <div style={S.card}>
          <div style={S.cardLabel}>Higgsfield Prompt</div>
          <div style={S.promptBox}>{sceneResult.higgsfield_prompt}</div>
        </div>

        {sceneResult.caption && <div style={S.card}>
          <div style={S.cardLabel}>Caption</div>
          <div style={{ fontSize:13, color:TEXT, lineHeight:1.65, marginTop:8 }}>{sceneResult.caption}</div>
        </div>}

        {sceneResult.hashtag_sets && <div style={S.card}>
          <div style={S.cardLabel}>AI-Generated Hashtags</div>
          {Object.entries(sceneResult.hashtag_sets).map(([set, tags]) => (
            <div key={set} style={{ marginTop:10 }}>
              <div style={{ fontSize:10, color:MUTED, marginBottom:4, textTransform:"capitalize", fontWeight:600 }}>{set}</div>
              <div style={S.tagRow}>{(tags||[]).map(t => <span key={t} style={S.hashTag}>{t}</span>)}</div>
            </div>
          ))}
        </div>}

        {sceneResult.next_scene_suggestion && <div style={S.n8nBanner}>
          <span style={{ fontWeight:600, color:TEXT }}>💡 Next scene: </span>{sceneResult.next_scene_suggestion}
        </div>}

        <button style={S.igBtn} onClick={() => { setPublishScene(scenes[activeSlot]); setPublishSceneIdx(activeSlot); setStage(STAGES.PUBLISH); }}>
          📸 Set Up Instagram Post
        </button>
        <button style={S.secondaryBtn} onClick={goHome}>← Back to Scenes</button>
      </div>
    </div>
  );

  // ── HOME ──
  return (
    <div style={S.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button:active{opacity:0.8}`}</style>
      <div style={S.header}>
        <div style={S.logo}><span style={S.logoDot}/>SceneCraft</div>
        <div style={{ display:"flex", gap:7, alignItems:"center" }}>
          <div style={S.tokenBadge}><span>🎟️</span><span style={{ fontWeight:700, color:credColor }}>{creditsLeft}</span><span style={{ color:SUBTEXT }}>credits</span></div>
          <button style={{ background:"transparent", border:"1px solid #2A2A2A", borderRadius:7, color:SUBTEXT, fontSize:12, padding:"4px 8px", cursor:"pointer" }} onClick={() => { try{localStorage.removeItem("sc_token");}catch(e){} setTokenData(null); }} title="Reset token">🔑</button>
        </div>
      </div>
      <div style={S.tabRow}>
        {[{id:"today",label:"📋 Today"},{id:"calendar",label:"📅 Calendar"}].map(t => (
          <button key={t.id} style={{ ...S.tab, ...(activeTab===t.id ? S.tabActive:{}) }} onClick={() => { setActiveTab(t.id); if(t.id==="calendar") setStage(STAGES.CALENDAR); }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={S.page}>
        <div style={S.sectionTitle}>Today's Scenes · {todayLabel}</div>
        <div style={S.sceneGrid}>
          {scenes.map((scene, i) => (
            <div key={i} style={{ ...S.sceneSlot, ...(scene?{border:"1.5px solid #2A2A2A"}:{}) }} onClick={() => openSlot(i)}>
              {scene ? <>
                <img src={scene.img} alt="" style={S.sceneImg}/>
                <div style={{ ...S.statusDot, background: scene.published ? GREEN : ACCENT }}/>
              </> : <>
                <span style={S.addIcon}>+</span>
                <span style={S.sceneNumber}>Scene {i+1}</span>
              </>}
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:12, color:SUBTEXT }}>{filledCount} of 5 scenes ready</span>
          <span style={{ fontSize:12, color:filledCount===5?GREEN:ACCENT, fontWeight:600 }}>{filledCount===5?"All done! 🎬":`${5-filledCount} remaining`}</span>
        </div>

        {/* n8n status banner */}
        <div style={S.n8nBanner}>
          <span style={{ fontWeight:600, color:TEXT }}>🔧 n8n Engine: </span>
          <span style={{ fontFamily:"monospace", fontSize:11, color:ACCENT }}>{n8nBase}</span>
          <br/><span style={{ fontSize:11 }}>All AI processing runs on your server · Tap 🔑 to update</span>
        </div>

        {scenes.some(Boolean) && <>
          <div style={S.sectionTitle}>Prompt Queue</div>
          {scenes.map((scene, i) => scene ? (
            <div key={i} style={S.sceneListItem}>
              <img src={scene.img} alt="" style={S.sceneThumb}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:3, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                  Scene {i+1}
                  {scene.scene_role && <span style={{ fontSize:9, background:"rgba(96,165,250,0.1)", color:BLUE, padding:"2px 7px", borderRadius:20, border:"1px solid rgba(96,165,250,0.2)", textTransform:"capitalize" }}>{scene.scene_role}</span>}
                  {scene.published
                    ? <span style={{ fontSize:9, background:"rgba(74,222,128,0.1)", color:GREEN, padding:"2px 7px", borderRadius:20, border:"1px solid rgba(74,222,128,0.2)" }}>Published</span>
                    : <span style={{ fontSize:9, background:"rgba(232,255,71,0.1)", color:ACCENT, padding:"2px 7px", borderRadius:20, border:"1px solid rgba(232,255,71,0.2)" }}>Ready</span>
                  }
                </div>
                <div style={{ fontSize:11, color:SUBTEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scene.prompt||scene.higgsfield_prompt}</div>
              </div>
              {!scene.published && (
                <button onClick={() => { setPublishScene(scene); setPublishSceneIdx(i); setStage(STAGES.PUBLISH); }} style={{ flexShrink:0, padding:"7px 11px", background:"linear-gradient(135deg,#f09433,#dc2743)", border:"none", borderRadius:9, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Post</button>
              )}
            </div>
          ) : null)}
        </>}

        {filledCount === 0 && (
          <div style={{ marginTop:28, textAlign:"center", padding:"28px 20px", background:SURFACE, borderRadius:18 }}>
            <div style={{ fontSize:34, marginBottom:10 }}>🎬</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:7 }}>Start your day's content</div>
            <div style={{ fontSize:12, color:SUBTEXT, lineHeight:1.65 }}>Add up to 5 scenes. Your n8n server runs Claude's deep image analysis and smart questioning engine. Each prompt costs 1 credit.</div>
          </div>
        )}
      </div>
    </div>
  );
}
