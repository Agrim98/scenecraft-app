import { useState, useRef } from "react";

const N8N_BASE_URL = '/n8n';
const ENDPOINTS = {
  analyze:     '/n8n/scenecraft/analyze',
  buildPrompt: '/n8n/scenecraft/build-prompt',
};
const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

async function callClaude(messages, maxTokens = 1000) {
  const res = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: maxTokens, messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Claude API error ' + res.status);
  return data.content?.[0]?.text || '';
}

function extractJSON(text) {
  try { return JSON.parse(text.trim()); } catch(e) {}
  const s = text.indexOf('['), e2 = text.lastIndexOf(']');
  if (s !== -1 && e2 > s) { try { return JSON.parse(text.slice(s, e2+1)); } catch(e) {} }
  const s2 = text.indexOf('{'), e3 = text.lastIndexOf('}');
  if (s2 !== -1 && e3 > s2) { try { return JSON.parse(text.slice(s2, e3+1)); } catch(e) {} }
  throw new Error('Could not parse JSON');
}

// Compress image to ~150KB
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const STAGES = { HOME:'home', MCQ:'mcq', PROCESSING:'processing', SUMMARY:'summary', CALENDAR:'calendar', PUBLISH:'publish' };
const ACCENT='#E8FF47', BG='#0A0A0A', SURFACE='#141414', SURFACE2='#1E1E1E', MUTED='#555', TEXT='#F0F0F0', SUBTEXT='#888', GREEN='#4ADE80', RED='#FF6B6B', BLUE='#60A5FA', ORANGE='#FB923C';

const S = {
  app:{ minHeight:'100vh', background:BG, color:TEXT, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto', overflowX:'hidden' },
  header:{ padding:'18px 20px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1A1A1A' },
  logo:{ fontSize:17, fontWeight:700, letterSpacing:'-0.5px', color:TEXT, display:'flex', alignItems:'center', gap:8 },
  logoDot:{ width:8, height:8, borderRadius:'50%', background:ACCENT, display:'inline-block' },
  page:{ padding:'0 20px 100px' },
  sectionTitle:{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', color:SUBTEXT, textTransform:'uppercase', marginBottom:14, marginTop:26 },
  ctaBtn:{ width:'100%', padding:'15px 0', background:ACCENT, color:'#000', border:'none', borderRadius:13, fontSize:15, fontWeight:700, cursor:'pointer', marginTop:22 },
  igBtn:{ width:'100%', padding:'15px 0', background:'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366)', color:'#fff', border:'none', borderRadius:13, fontSize:15, fontWeight:700, cursor:'pointer', marginTop:10 },
  secondaryBtn:{ width:'100%', padding:'13px 0', background:'transparent', color:TEXT, border:'1.5px solid #2A2A2A', borderRadius:13, fontSize:14, fontWeight:500, cursor:'pointer', marginTop:10 },
  card:{ background:SURFACE, borderRadius:18, padding:18, marginTop:14 },
  cardLabel:{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:ACCENT, textTransform:'uppercase', marginBottom:8 },
  errorBox:{ background:'rgba(255,80,80,0.08)', border:'1px solid rgba(255,80,80,0.25)', borderRadius:11, padding:'13px 14px', fontSize:13, color:RED, marginTop:10, lineHeight:1.5 },
  successBox:{ background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:11, padding:'13px 14px', fontSize:13, color:GREEN, marginTop:10, lineHeight:1.5 },
  promptBox:{ background:SURFACE2, borderRadius:12, padding:14, fontSize:13, lineHeight:1.75, color:TEXT, border:'1px solid #2A2A2A', marginTop:10 },
  tagRow:{ display:'flex', flexWrap:'wrap', gap:5, marginTop:10 },
  tag:{ background:SURFACE2, border:'1px solid #2A2A2A', borderRadius:20, padding:'4px 10px', fontSize:11, color:SUBTEXT },
  hashTag:{ background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:20, padding:'4px 10px', fontSize:11, color:BLUE },
  tokenBadge:{ display:'flex', alignItems:'center', gap:5, background:SURFACE2, border:'1px solid #2A2A2A', borderRadius:20, padding:'4px 10px', fontSize:12 },
  input:{ width:'100%', background:SURFACE2, border:'1.5px solid #2A2A2A', borderRadius:11, padding:'13px 14px', fontSize:14, color:TEXT, outline:'none', boxSizing:'border-box' },
  textarea:{ width:'100%', background:SURFACE2, border:'1.5px solid #2A2A2A', borderRadius:11, padding:'13px 14px', fontSize:13, color:TEXT, outline:'none', boxSizing:'border-box', resize:'vertical', minHeight:90, lineHeight:1.6, fontFamily:"'DM Sans',sans-serif" },
  backBtn:{ background:'transparent', border:'none', color:SUBTEXT, fontSize:22, cursor:'pointer', padding:0 },
  progressBar:{ height:3, background:'#1E1E1E', borderRadius:10, marginBottom:26, marginTop:6, overflow:'hidden' },
  progressFill:{ height:'100%', background:ACCENT, borderRadius:10, transition:'width 0.4s ease' },
  optionBtn:{ width:'100%', padding:'13px 14px', marginBottom:7, background:SURFACE2, border:'1.5px solid #2A2A2A', borderRadius:11, color:TEXT, fontSize:13, fontWeight:500, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:11, lineHeight:1.4 },
  optionBtnSel:{ background:'rgba(232,255,71,0.08)', border:'1.5px solid '+ACCENT, color:ACCENT },
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

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
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!token.trim().startsWith('SC-')) { setError('Invalid token. Must start with SC-'); return; }
    const parts = token.trim().split('-');
    if (parts.length < 3) { setError('Malformed token.'); return; }
    const credits = parseInt(parts[1]);
    if (isNaN(credits) || credits <= 0) { setError('Token has no credits.'); return; }
    onSave({ token: token.trim(), credits, usedCredits: 0 });
  };

  return (
    <div style={{ padding:'40px 20px' }}>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:44, marginBottom:14 }}>🔑</div>
        <div style={{ fontSize:21, fontWeight:700, marginBottom:8 }}>Enter Access Token</div>
        <div style={{ fontSize:13, color:SUBTEXT, lineHeight:1.7 }}>Get your token from the publisher. Each token includes AI prompt credits.</div>
      </div>
      <div style={{ fontSize:12, color:SUBTEXT, fontWeight:700, marginBottom:7, letterSpacing:'0.06em', textTransform:'uppercase' }}>Your Token</div>
      <input style={{ ...S.input, fontFamily:'monospace', fontSize:15, letterSpacing:1 }} placeholder="SC-10-XXXXXXXX" value={token} onChange={e => { setToken(e.target.value); setError(''); }} onKeyDown={e => e.key==='Enter' && validate()} />
      {error && <div style={S.errorBox}>{error}</div>}
      <div style={{ marginTop:14, padding:'12px 14px', background:SURFACE, borderRadius:11, fontSize:12, color:SUBTEXT, lineHeight:1.65 }}>
        💡 Format: <span style={{ color:TEXT, fontFamily:'monospace' }}>SC-[credits]-[code]</span><br/>
        Example: <span style={{ color:ACCENT, fontFamily:'monospace' }}>SC-10-ABC12345</span> = 10 credits
      </div>
      <button style={S.ctaBtn} onClick={validate}>Activate →</button>
    </div>
  );
}

// ── MCQ Flow ──────────────────────────────────────────────────────────────────
function MCQFlow({ sceneIndex, imageDesc, questions, onComplete, onSkip }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  const toggle = (val) => {
    if (q.type === 'multi') {
      const prev = answers[q.id] || [];
      if (val === 'none') { setAnswers({ ...answers, [q.id]: prev.includes('none') ? [] : ['none'] }); return; }
      const filtered = prev.filter(v => v !== 'none');
      const next = filtered.includes(val) ? filtered.filter(v => v !== val) : filtered.length < 2 ? [...filtered, val] : filtered;
      setAnswers({ ...answers, [q.id]: next });
    } else {
      setAnswers({ ...answers, [q.id]: val });
    }
  };

  const isSelected = (val) => q.type === 'multi' ? (answers[q.id] || []).includes(val) : answers[q.id] === val;
  const canNext = q.type === 'multi' ? (answers[q.id] || []).length > 0 : !!answers[q.id];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <div style={{ fontSize:13, fontWeight:700, color:ACCENT }}>Scene {sceneIndex + 1} Questions</div>
        <button style={{ background:'transparent', border:'none', color:SUBTEXT, fontSize:12, cursor:'pointer' }} onClick={onSkip}>Skip scene →</button>
      </div>
      <div style={{ background:SURFACE, borderRadius:12, padding:'10px 14px', marginBottom:16, fontSize:12, color:SUBTEXT, lineHeight:1.5, borderLeft:'3px solid '+ACCENT }}>
        <span style={{ fontWeight:600, color:TEXT }}>Claude sees: </span>{imageDesc}
      </div>
      <div style={S.progressBar}><div style={{ ...S.progressFill, width:`${progress}%` }} /></div>
      <div style={{ background:SURFACE, borderRadius:18, padding:20, marginBottom:10 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:ACCENT, textTransform:'uppercase', marginBottom:6 }}>{q.step}</div>
        <div style={{ fontSize:16, fontWeight:600, lineHeight:1.5, marginBottom:6 }}>{q.question}</div>
        {q.why_asking && <div style={{ fontSize:11, color:SUBTEXT, marginBottom:14, fontStyle:'italic' }}>Why: {q.why_asking}</div>}
        {q.type === 'multi' && <div style={{ fontSize:11, color:SUBTEXT, marginBottom:10, textAlign:'right' }}>Pick up to 2</div>}
        {q.options.map(opt => (
          <button key={opt.value} style={{ ...S.optionBtn, ...(isSelected(opt.value) ? S.optionBtnSel : {}) }} onClick={() => toggle(opt.value)}>
            <span style={{ fontSize:19, flexShrink:0 }}>{opt.emoji}</span>
            <div style={{ flex:1 }}>
              <div>{opt.label}</div>
              {opt.prompt_impact && <div style={{ fontSize:11, color: isSelected(opt.value) ? 'rgba(232,255,71,0.6)' : MUTED, marginTop:2 }}>{opt.prompt_impact}</div>}
            </div>
          </button>
        ))}
      </div>
      <button style={{ ...S.ctaBtn, opacity:canNext?1:0.35, marginTop:8 }} disabled={!canNext} onClick={() => {
        if (current < questions.length - 1) setCurrent(current + 1);
        else onComplete(answers);
      }}>
        {current < questions.length - 1 ? 'Next →' : 'Generate Prompt ✦'}
      </button>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function CalendarView({ allDayScenes, onBack, onPublishScene }) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const days = getCalendarDays(calYear, calMonth);
  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();
  const today = now.getDate();

  const prevMonth = () => { if (calMonth===0){setCalMonth(11);setCalYear(calYear-1);}else setCalMonth(calMonth-1); };
  const nextMonth = () => { if (calMonth===11){setCalMonth(0);setCalYear(calYear+1);}else setCalMonth(calMonth+1); };
  const dayKey = (d) => `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const selectedScenes = selectedDay ? (allDayScenes[dayKey(selectedDay)] || []) : [];

  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button style={S.backBtn} onClick={onBack}>←</button>
          <div style={S.logo}><span style={S.logoDot}/>Calendar</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button style={{ ...S.backBtn, fontSize:18 }} onClick={prevMonth}>‹</button>
          <span style={{ fontSize:13, fontWeight:700, color:TEXT, minWidth:70, textAlign:'center' }}>{MONTH_NAMES[calMonth]} {calYear}</span>
          <button style={{ ...S.backBtn, fontSize:18 }} onClick={nextMonth}>›</button>
        </div>
      </div>
      <div style={{ padding:'18px 14px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
          {DAY_NAMES.map(d => <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:MUTED, padding:'3px 0' }}>{d}</div>)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
          {days.map((d, i) => {
            if (!d) return <div key={i}/>;
            const key = dayKey(d);
            const scns = allDayScenes[key] || [];
            const isToday = isCurrentMonth && d === today;
            const isSel = selectedDay === d;
            return (
              <button key={i} onClick={() => setSelectedDay(isSel ? null : d)} style={{
                aspectRatio:'1', borderRadius:9, border:'none', cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
                background: isSel ? ACCENT : isToday ? 'rgba(232,255,71,0.1)' : SURFACE,
                outline: isToday && !isSel ? `1.5px solid ${ACCENT}` : 'none',
              }}>
                <span style={{ fontSize:13, fontWeight:600, color: isSel ? '#000' : isToday ? ACCENT : TEXT }}>{d}</span>
                {scns.length > 0 && <div style={{ display:'flex', gap:2 }}>
                  {scns.slice(0,5).map((sc,si) => <div key={si} style={{ width:4, height:4, borderRadius:'50%', background: sc?.published ? GREEN : isSel ? '#000' : ACCENT }}/>)}
                </div>}
              </button>
            );
          })}
        </div>
        <div style={{ display:'flex', gap:14, padding:'13px 2px 0', fontSize:11, color:SUBTEXT }}>
          <span><span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:ACCENT, marginRight:4 }}/>Ready</span>
          <span><span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:GREEN, marginRight:4 }}/>Published</span>
        </div>
      </div>
      {selectedDay && (
        <div style={{ padding:'18px 16px 100px' }}>
          <div style={S.sectionTitle}>{MONTH_NAMES[calMonth]} {selectedDay}</div>
          {selectedScenes.length === 0 ? (
            <div style={{ background:SURFACE, borderRadius:14, padding:22, textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:8 }}>📭</div>
              <div style={{ fontSize:13, color:SUBTEXT }}>No scenes for this day</div>
            </div>
          ) : selectedScenes.map((scene, i) => scene ? (
            <div key={i} style={{ background:SURFACE, borderRadius:14, padding:14, marginBottom:9 }}>
              <div style={{ display:'flex', gap:11 }}>
                {scene.img && <img src={scene.img} style={{ width:58, height:58, borderRadius:9, objectFit:'cover', flexShrink:0 }}/>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Scene {i+1} {scene.published ? <span style={{ fontSize:10, color:GREEN }}>✓ Published</span> : <span style={{ fontSize:10, color:ACCENT }}>● Ready</span>}</div>
                  <div style={{ fontSize:11, color:SUBTEXT, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{scene.prompt}</div>
                </div>
              </div>
              {!scene.published && <button style={{ ...S.igBtn, marginTop:10, padding:'10px 0', fontSize:13 }} onClick={() => onPublishScene(scene, i)}>📸 Publish to Instagram</button>}
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );
}

// ── Publish View ──────────────────────────────────────────────────────────────
function PublishView({ scene, sceneIndex, onBack, onPublish }) {
  const [caption, setCaption] = useState(scene?.caption || '');
  const [hashtags, setHashtags] = useState(scene?.hashtags || '#aiVideo #contentCreator #reels #higgsfield #aiads');
  const [publishNow, setPublishNow] = useState(true);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState('');

  const fullCaption = `${caption}\n\n${hashtags}`.trim();

  const handlePublish = async () => {
    setPosting(true);
    await new Promise(r => setTimeout(r, 1800));
    const when = publishNow ? 'immediately' : `on ${scheduleDate} at ${scheduleTime}`;
    setStatus(`✅ Queued for Instagram ${when}`);
    setPosting(false);
    setTimeout(() => onPublish({ ...scene, published:true }), 1400);
  };

  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} textarea{font-family:'DM Sans',sans-serif}`}</style>
      <div style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button style={S.backBtn} onClick={onBack}>←</button>
          <div style={S.logo}><span style={S.logoDot}/>Publish Scene {sceneIndex+1}</div>
        </div>
      </div>
      <div style={S.page}>
        {scene?.img && <div style={{ marginTop:18, borderRadius:14, overflow:'hidden' }}>
          <img src={scene.img} style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }}/>
        </div>}
        {scene?.prompt && <div style={S.card}>
          <div style={S.cardLabel}>Higgsfield Prompt</div>
          <div style={S.promptBox}>{scene.prompt}</div>
        </div>}
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:11, color:SUBTEXT, fontWeight:700, marginBottom:7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Caption</div>
          <textarea style={S.textarea} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write your caption…"/>
        </div>
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:11, color:SUBTEXT, fontWeight:700, marginBottom:7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Hashtags</div>
          <textarea style={{ ...S.textarea, minHeight:75, fontSize:12, color:BLUE }} value={hashtags} onChange={e => setHashtags(e.target.value)}/>
        </div>
        <div style={S.card}>
          <div style={S.cardLabel}>When to Post</div>
          <div style={{ display:'flex', gap:7, marginTop:10 }}>
            {[{label:'Post Now',val:true},{label:'Schedule',val:false}].map(opt => (
              <button key={String(opt.val)} onClick={() => setPublishNow(opt.val)} style={{
                flex:1, padding:'11px 0', borderRadius:11, fontSize:13, fontWeight:600, cursor:'pointer',
                background: publishNow===opt.val ? ACCENT : SURFACE2,
                color: publishNow===opt.val ? '#000' : TEXT,
                border: publishNow===opt.val ? 'none' : '1.5px solid #2A2A2A',
              }}>{opt.label}</button>
            ))}
          </div>
          {!publishNow && <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
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
        <div style={S.card}>
          <div style={S.cardLabel}>Post Preview</div>
          <div style={{ fontSize:13, color:TEXT, lineHeight:1.7, marginTop:8, whiteSpace:'pre-wrap' }}>{fullCaption}</div>
        </div>
        {status && <div style={S.successBox}>{status}</div>}
        <button style={{ ...S.igBtn, opacity:posting?0.6:1 }} disabled={posting} onClick={handlePublish}>
          {posting ? '⏳ Queuing…' : publishNow ? '📸 Publish to Instagram Now' : '📅 Schedule Post'}
        </button>
        <button style={S.secondaryBtn} onClick={onBack}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [stage, setStage] = useState(STAGES.HOME);
  const [tokenData, setTokenData] = useState(() => { try { return JSON.parse(localStorage.getItem('sc_token')||'null'); } catch(e){return null;} });

  // 5 scene slots — each can hold { img, file } when uploaded
  const [sceneImages, setSceneImages] = useState([null,null,null,null,null]);
  // After processing — holds full scene data with prompts
  const [scenes, setScenes] = useState([null,null,null,null,null]);

  // MCQ state — which scene we're questioning
  const [mcqSceneIndex, setMcqSceneIndex] = useState(0);
  const [mcqQueue, setMcqQueue] = useState([]); // indices still to process
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingIndex, setProcessingIndex] = useState(0);

  // Publish
  const [publishScene, setPublishScene] = useState(null);
  const [publishSceneIdx, setPublishSceneIdx] = useState(null);
  const [allDayScenes, setAllDayScenes] = useState({});

  const fileRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const todayLabel = today.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
  const creditsLeft = tokenData ? tokenData.credits - tokenData.usedCredits : 0;
  const credColor = creditsLeft > 5 ? ACCENT : creditsLeft > 1 ? ORANGE : RED;
  const uploadedCount = sceneImages.filter(Boolean).length;
  const readyCount = scenes.filter(Boolean).length;

  const saveToken = (data) => { try { localStorage.setItem('sc_token', JSON.stringify(data)); } catch(e){} setTokenData(data); };
  const consumeCredit = () => {
    const updated = { ...tokenData, usedCredits: tokenData.usedCredits + 1 };
    try { localStorage.setItem('sc_token', JSON.stringify(updated)); } catch(e){}
    setTokenData(updated);
  };

  const handleFileSelect = async (index, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const compressed = await compressImage(file);
    const newImages = [...sceneImages];
    newImages[index] = compressed;
    setSceneImages(newImages);
  };

  const removeScene = (index) => {
    const newImages = [...sceneImages];
    newImages[index] = null;
    setSceneImages(newImages);
    const newScenes = [...scenes];
    newScenes[index] = null;
    setScenes(newScenes);
  };

  // ── Start processing all uploaded scenes via n8n ──
  const startProcessing = async () => {
    const indicesToProcess = sceneImages.map((img, i) => img ? i : null).filter(i => i !== null);
    if (indicesToProcess.length === 0) return;

    const firstIdx = indicesToProcess[0];
    setProcessingStatus(`Analyzing Scene ${firstIdx + 1}…`);
    setProcessingIndex(firstIdx);
    setStage(STAGES.PROCESSING);

    try {
      const base64 = sceneImages[firstIdx].split(',')[1];

      // ── Call n8n via Vercel proxy — NO fallback, n8n is required ──
      let res;
      try {
        res = await fetch(ENDPOINTS.analyze, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: base64,
            media_type: 'image/jpeg',
            client_token: tokenData.token,
            session_id: 'sess_' + Date.now(),
          }),
        });
      } catch(fetchErr) {
        throw new Error('Cannot reach server. Check your connection. (' + fetchErr.message + ')');
      }

      const rawText = await res.text();

      if (!res.ok) {
        let errMsg = `Server error ${res.status}`;
        try { errMsg = JSON.parse(rawText)?.error || errMsg; } catch(e) {}
        throw new Error(errMsg);
      }

      let data;
      try { data = JSON.parse(rawText); }
      catch(e) { throw new Error('Invalid response from server: ' + rawText.slice(0, 100)); }

      if (!data.success || !data.questions) {
        throw new Error(data.error || 'Server returned no questions');
      }

      setCurrentAnalysis(data.analysis || { description: 'A cinematic scene' });
      setCurrentQuestions(data.questions);
      setMcqSceneIndex(firstIdx);
      setMcqQueue(indicesToProcess.slice(1));
      setStage(STAGES.MCQ);
      return;

    } catch(e) {
      alert('Analysis failed: ' + e.message);
      setStage(STAGES.HOME);
    }
  };

  // ── User answered MCQ — send to n8n to build final prompt ──
  const handleMCQComplete = async (answers) => {
    setStage(STAGES.PROCESSING);
    setProcessingStatus(`Building prompt for Scene ${mcqSceneIndex + 1}…`);

    try {
      // ── Call n8n build-prompt — n8n only, no fallback ──
      let res;
      try {
        res = await fetch(ENDPOINTS.buildPrompt, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: 'sess_' + Date.now(),
            client_token: tokenData.token,
            image_description: currentAnalysis?.description || '',
            analysis: currentAnalysis,
            answers,
            questions: currentQuestions,
          }),
        });
      } catch(fetchErr) {
        throw new Error('Cannot reach server: ' + fetchErr.message);
      }

      const rawText = await res.text();
      if (!res.ok) {
        let errMsg = `Server error ${res.status}`;
        try { errMsg = JSON.parse(rawText)?.error || errMsg; } catch(e) {}
        throw new Error(errMsg);
      }

      let data;
      try { data = JSON.parse(rawText); }
      catch(e) { throw new Error('Invalid response: ' + rawText.slice(0, 100)); }

      if (!data.success) throw new Error(data.error || 'Prompt generation failed');

      let parsed = {
        higgsfield_prompt: data.higgsfield_prompt || '',
        caption: data.caption || '',
        hashtags: data.hashtags || '#ai #reels #contentcreator',
        scene_role: data.scene_role || 'middle',
        next_scene_suggestion: data.next_scene_suggestion || '',
      };

      consumeCredit();

      const sceneObj = {
        img: sceneImages[mcqSceneIndex],
        prompt: parsed.higgsfield_prompt,
        caption: parsed.caption,
        hashtags: parsed.hashtags,
        scene_role: parsed.scene_role,
        next_scene_suggestion: parsed.next_scene_suggestion,
        published: false,
      };

      const newScenes = [...scenes];
      newScenes[mcqSceneIndex] = sceneObj;
      setScenes(newScenes);

      // Update allDayScenes
      setAllDayScenes(prev => {
        const existing = [...(prev[todayStr] || [])];
        existing[mcqSceneIndex] = { ...sceneObj };
        return { ...prev, [todayStr]: existing };
      });

      // Move to next scene in queue
      if (mcqQueue.length > 0) {
        const nextIdx = mcqQueue[0];
        const remaining = mcqQueue.slice(1);
        setProcessingStatus(`Analyzing Scene ${nextIdx + 1}…`);
        setProcessingIndex(nextIdx);

        // Analyze next scene via n8n
        const base64next = sceneImages[nextIdx].split(',')[1];
        let nextRes;
        try {
          nextRes = await fetch(ENDPOINTS.analyze, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_base64: base64next,
              media_type: 'image/jpeg',
              client_token: tokenData.token,
              session_id: 'sess_' + Date.now(),
            }),
          });
        } catch(fetchErr) {
          throw new Error('Cannot reach server: ' + fetchErr.message);
        }

        const nextRaw = await nextRes.text();
        if (!nextRes.ok) throw new Error(`Server error ${nextRes.status}`);

        let nextData;
        try { nextData = JSON.parse(nextRaw); }
        catch(e) { throw new Error('Invalid response from server'); }

        if (!nextData.success || !nextData.questions) throw new Error(nextData.error || 'No questions returned');

        setCurrentAnalysis(nextData.analysis || { description: 'A cinematic scene' });
        let qs = nextData.questions;

        setCurrentQuestions(qs);
        setMcqSceneIndex(nextIdx);
        setMcqQueue(remaining);
        setStage(STAGES.MCQ);
      } else {
        // All done!
        setStage(STAGES.SUMMARY);
      }
    } catch(e) {
      alert('Prompt generation failed: ' + e.message);
      setStage(STAGES.HOME);
    }
  };

  const handleSkipScene = () => {
    if (mcqQueue.length > 0) {
      // Move to next scene — for now just skip to summary or next
      // TODO: could auto-generate without MCQ
      setStage(STAGES.HOME);
    } else {
      setStage(STAGES.SUMMARY);
    }
  };

  const handlePublishDone = (updatedScene) => {
    const newScenes = [...scenes];
    if (publishSceneIdx !== null) newScenes[publishSceneIdx] = { ...newScenes[publishSceneIdx], published: true };
    setScenes(newScenes);
    setAllDayScenes(prev => {
      const existing = [...(prev[todayStr] || [])];
      if (publishSceneIdx !== null) existing[publishSceneIdx] = { ...(existing[publishSceneIdx] || {}), published: true };
      return { ...prev, [todayStr]: existing };
    });
    setStage(STAGES.SUMMARY);
    setPublishScene(null); setPublishSceneIdx(null);
  };

  // ── Token gate ──
  if (!tokenData) return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={S.header}><div style={S.logo}><span style={S.logoDot}/>SceneCraft</div><div style={{ fontSize:12, color:SUBTEXT, background:SURFACE2, padding:'4px 10px', borderRadius:20, border:'1px solid #2A2A2A' }}>{todayLabel}</div></div>
      <TokenSetup onSave={saveToken}/>
    </div>
  );

  // ── Publish ──
  if (stage === STAGES.PUBLISH && publishScene) return (
    <PublishView scene={publishScene} sceneIndex={publishSceneIdx||0} onBack={() => setStage(STAGES.SUMMARY)} onPublish={handlePublishDone}/>
  );

  // ── Calendar ──
  if (stage === STAGES.CALENDAR) return (
    <CalendarView allDayScenes={allDayScenes} onBack={() => setStage(STAGES.HOME)} onPublishScene={(scene, idx) => { setPublishScene(scene); setPublishSceneIdx(idx); setStage(STAGES.PUBLISH); }}/>
  );

  // ── Processing ──
  if (stage === STAGES.PROCESSING) return (
    <div style={S.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={S.header}><div style={S.logo}><span style={S.logoDot}/>SceneCraft</div></div>
      <div style={{ padding:'56px 20px', textAlign:'center' }}>
        <div style={{ width:52, height:52, borderRadius:'50%', border:'3px solid #1E1E1E', borderTop:'3px solid '+ACCENT, animation:'spin 0.9s linear infinite', margin:'0 auto 20px' }}/>
        <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>Building your prompts…</div>
        <div style={{ fontSize:13, color:ACCENT, fontWeight:600, marginBottom:6 }}>{processingStatus}</div>
        <div style={{ fontSize:12, color:SUBTEXT }}>Claude is crafting your Higgsfield prompt</div>
      </div>
    </div>
  );

  // ── MCQ ──
  if (stage === STAGES.MCQ) return (
    <div style={S.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button:active{opacity:0.75}`}</style>
      <div style={S.header}>
        <div style={S.logo}><span style={S.logoDot}/>SceneCraft</div>
        <div style={{ ...S.tokenBadge }}><span>🎟️</span><span style={{ fontWeight:700, color:credColor }}>{creditsLeft}</span><span style={{ color:SUBTEXT }}>left</span></div>
      </div>
      <div style={S.page}>
        <div style={{ marginTop:16 }}>
          <MCQFlow
            sceneIndex={mcqSceneIndex}
            imageDesc={currentAnalysis?.description || ''}
            questions={currentQuestions}
            onComplete={handleMCQComplete}
            onSkip={handleSkipScene}
          />
          <div style={{ marginTop:12, fontSize:12, color:SUBTEXT, textAlign:'center' }}>
            {mcqQueue.length > 0 ? `${mcqQueue.length} more scene${mcqQueue.length > 1 ? 's' : ''} after this` : 'Last scene!'}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Summary ──
  if (stage === STAGES.SUMMARY) return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button:active{opacity:0.75}`}</style>
      <div style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button style={S.backBtn} onClick={() => setStage(STAGES.HOME)}>←</button>
          <div style={S.logo}><span style={S.logoDot}/>Prompts Ready</div>
        </div>
        <div style={S.tokenBadge}><span>🎟️</span><span style={{ fontWeight:700, color:credColor }}>{creditsLeft}</span><span style={{ color:SUBTEXT }}>left</span></div>
      </div>
      <div style={S.page}>
        <div style={{ marginTop:22, textAlign:'center', marginBottom:22 }}>
          <div style={{ fontSize:30, marginBottom:7 }}>✦</div>
          <div style={{ fontSize:19, fontWeight:700, marginBottom:5 }}>All Scenes Ready!</div>
          <div style={{ fontSize:13, color:SUBTEXT }}>Your Higgsfield prompts are crafted</div>
        </div>

        {scenes.map((scene, i) => scene ? (
          <div key={i} style={{ background:SURFACE, borderRadius:16, padding:16, marginBottom:12 }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <img src={scene.img} style={{ width:64, height:64, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>Scene {i+1}</span>
                  {scene.scene_role && <span style={{ fontSize:9, background:'rgba(96,165,250,0.1)', color:BLUE, padding:'2px 7px', borderRadius:20, border:'1px solid rgba(96,165,250,0.2)', textTransform:'capitalize' }}>{scene.scene_role}</span>}
                  {scene.published
                    ? <span style={{ fontSize:9, background:'rgba(74,222,128,0.1)', color:GREEN, padding:'2px 7px', borderRadius:20, border:'1px solid rgba(74,222,128,0.2)' }}>Published</span>
                    : <span style={{ fontSize:9, background:'rgba(232,255,71,0.1)', color:ACCENT, padding:'2px 7px', borderRadius:20, border:'1px solid rgba(232,255,71,0.2)' }}>Ready</span>
                  }
                </div>
                <div style={{ fontSize:11, color:SUBTEXT, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' }}>{scene.prompt}</div>
              </div>
            </div>
            {!scene.published && (
              <button style={{ ...S.igBtn, marginTop:11, padding:'11px 0', fontSize:13 }} onClick={() => { setPublishScene(scene); setPublishSceneIdx(i); setStage(STAGES.PUBLISH); }}>
                📸 Publish Scene {i+1} to Instagram
              </button>
            )}
            {scene.next_scene_suggestion && (
              <div style={{ marginTop:8, padding:'8px 12px', background:SURFACE2, borderRadius:9, fontSize:11, color:SUBTEXT }}>
                💡 Next: {scene.next_scene_suggestion}
              </div>
            )}
          </div>
        ) : null)}

        <button style={S.secondaryBtn} onClick={() => setStage(STAGES.HOME)}>← Add More Scenes</button>
      </div>
    </div>
  );

  // ── HOME ──
  return (
    <div style={S.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button:active{opacity:0.8}`}</style>
      <div style={S.header}>
        <div style={S.logo}><span style={S.logoDot}/>SceneCraft</div>
        <div style={{ display:'flex', gap:7, alignItems:'center' }}>
          <div style={S.tokenBadge}><span>🎟️</span><span style={{ fontWeight:700, color:credColor }}>{creditsLeft}</span><span style={{ color:SUBTEXT }}>credits</span></div>
          <button style={{ background:'transparent', border:'1px solid #2A2A2A', borderRadius:7, color:SUBTEXT, fontSize:12, padding:'4px 8px', cursor:'pointer' }} onClick={() => { try{localStorage.removeItem('sc_token');}catch(e){} setTokenData(null); }}>🔑</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, padding:'14px 20px 0', borderBottom:'1px solid #1A1A1A' }}>
        {[{id:'today',label:'📋 Today'},{id:'calendar',label:'📅 Calendar'}].map(t => (
          <button key={t.id} style={{ padding:'8px 14px', fontSize:13, fontWeight:600, background:'transparent', border:'none', color: t.id==='today' ? ACCENT : SUBTEXT, cursor:'pointer', borderBottom: t.id==='today' ? '2px solid '+ACCENT : 'none' }}
            onClick={() => { if(t.id==='calendar') setStage(STAGES.CALENDAR); }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={S.page}>
        <div style={S.sectionTitle}>Upload Your Scenes · {todayLabel}</div>

        {/* Big upload grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
          {sceneImages.map((img, i) => (
            <div key={i} style={{ position:'relative' }}>
              <div
                style={{ aspectRatio:'1', borderRadius:12, background:SURFACE, border: img ? '1.5px solid #2A2A2A' : '1.5px dashed #2A2A2A', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative' }}
                onClick={() => !img && fileRefs[i].current.click()}
              >
                {img ? (
                  <>
                    <img src={img} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    {scenes[i] && <div style={{ position:'absolute', top:4, right:4, width:8, height:8, borderRadius:'50%', background: scenes[i].published ? GREEN : ACCENT }}/>}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize:18, color:MUTED }}>+</span>
                    <span style={{ fontSize:9, color:MUTED, fontWeight:700, marginTop:3 }}>Scene {i+1}</span>
                  </>
                )}
              </div>
              {img && !scenes[i] && (
                <button onClick={() => removeScene(i)} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:RED, border:'none', color:'#fff', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>×</button>
              )}
              <input ref={fileRefs[i]} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFileSelect(i, e.target.files[0])}/>
            </div>
          ))}
        </div>

        {/* Status */}
        <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:SUBTEXT }}>{uploadedCount} of 5 scenes uploaded</span>
          <span style={{ fontSize:12, color: uploadedCount===5 ? GREEN : ACCENT, fontWeight:600 }}>
            {uploadedCount===5 ? 'All uploaded! 🎬' : `${5-uploadedCount} remaining`}
          </span>
        </div>

        {/* How it works */}
        {uploadedCount === 0 && (
          <div style={{ marginTop:24, background:SURFACE, borderRadius:18, padding:20 }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>How it works</div>
            {[
              { emoji:'📸', title:'Upload up to 5 scenes', desc:'Tap each slot to add a photo' },
              { emoji:'🤖', title:'Claude asks smart questions', desc:'AI interviews you about each scene' },
              { emoji:'🎬', title:'Get Higgsfield prompts', desc:'Perfect video prompts + captions + hashtags' },
              { emoji:'📱', title:'Publish to Instagram', desc:'Schedule or post immediately' },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', gap:12, marginBottom:14, alignItems:'flex-start' }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{item.emoji}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{item.title}</div>
                  <div style={{ fontSize:12, color:SUBTEXT }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prompt queue */}
        {scenes.some(Boolean) && (
          <>
            <div style={S.sectionTitle}>Prompt Queue</div>
            {scenes.map((scene, i) => scene ? (
              <div key={i} style={{ background:SURFACE, borderRadius:14, padding:'13px 14px', marginBottom:9, display:'flex', alignItems:'center', gap:12 }}>
                <img src={scene.img} style={{ width:50, height:50, borderRadius:9, objectFit:'cover', flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:3, display:'flex', alignItems:'center', gap:6 }}>
                    Scene {i+1}
                    {scene.scene_role && <span style={{ fontSize:9, background:'rgba(96,165,250,0.1)', color:BLUE, padding:'2px 7px', borderRadius:20, border:'1px solid rgba(96,165,250,0.2)', textTransform:'capitalize' }}>{scene.scene_role}</span>}
                    {scene.published
                      ? <span style={{ fontSize:9, background:'rgba(74,222,128,0.1)', color:GREEN, padding:'2px 7px', borderRadius:20, border:'1px solid rgba(74,222,128,0.2)' }}>Published</span>
                      : <span style={{ fontSize:9, background:'rgba(232,255,71,0.1)', color:ACCENT, padding:'2px 7px', borderRadius:20, border:'1px solid rgba(232,255,71,0.2)' }}>Ready</span>
                    }
                  </div>
                  <div style={{ fontSize:11, color:SUBTEXT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{scene.prompt}</div>
                </div>
                {!scene.published && (
                  <button onClick={() => { setPublishScene(scene); setPublishSceneIdx(i); setStage(STAGES.PUBLISH); }} style={{ flexShrink:0, padding:'7px 11px', background:'linear-gradient(135deg,#f09433,#dc2743)', border:'none', borderRadius:9, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>Post</button>
                )}
              </div>
            ) : null)}
          </>
        )}

        {/* Main CTA */}
        {uploadedCount > 0 && (
          <button
            style={{ ...S.ctaBtn, opacity: creditsLeft < uploadedCount ? 0.4 : 1 }}
            disabled={creditsLeft < uploadedCount}
            onClick={startProcessing}
          >
            {scenes.some(Boolean) && sceneImages.some((img, i) => img && !scenes[i])
              ? `✦ Process Remaining Scenes (${sceneImages.filter((img,i) => img && !scenes[i]).length})`
              : `✦ Analyze All ${uploadedCount} Scene${uploadedCount>1?'s':''} & Build Prompts`
            }
          </button>
        )}
        {creditsLeft < uploadedCount && uploadedCount > 0 && (
          <div style={S.errorBox}>Not enough credits. You have {creditsLeft} credits but need {uploadedCount}.</div>
        )}
      </div>
    </div>
  );
}
