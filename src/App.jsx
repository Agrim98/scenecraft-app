import { useState, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const ENDPOINTS = {
  analyze:         '/n8n/scenecraft/analyze',
  buildPrompt:     '/n8n/scenecraft/build-prompt',
  generatePrompts: '/n8n/scenecraft/generate-prompts',
  render: 'https://crafterlabs.app.n8n.cloud/webhook/scenecraft/render', // DIRECT — bypasses Vercel 30s timeout
};
const PUBLISHER_EMAIL = 'crafterlabs0506@gmail.com';

function extractJSON(text) {
  try { return JSON.parse(text.trim()); } catch(e) {}
  const s = text.indexOf('['), e2 = text.lastIndexOf(']');
  if (s !== -1 && e2 > s) { try { return JSON.parse(text.slice(s, e2+1)); } catch(e) {} }
  const s2 = text.indexOf('{'), e3 = text.lastIndexOf('}');
  if (s2 !== -1 && e3 > s2) { try { return JSON.parse(text.slice(s2, e3+1)); } catch(e) {} }
  throw new Error('Could not parse JSON');
}

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

// ── Parse token: SC-[credits]-[days]-[code] or SC-[credits]-[code] ───────────
function parseToken(token) {
  if (!token.startsWith('SC-')) return null;
  const parts = token.split('-');
  if (parts.length < 3) return null;
  const credits = parseInt(parts[1]);
  if (isNaN(credits) || credits <= 0) return null;
  if (parts.length >= 4 && !isNaN(parseInt(parts[2]))) {
    const days = parseInt(parts[2]);
    const code = parts.slice(3).join('-');
    return { token, credits, days, code, usedCredits: 0, activatedAt: Date.now() };
  }
  const code = parts.slice(2).join('-');
  return { token, credits, days: null, code, usedCredits: 0, activatedAt: Date.now() };
}

// ── Stages ────────────────────────────────────────────────────────────────────
const S = {
  TOKEN: 'token',
  DASHBOARD: 'dashboard',
  UPLOAD: 'upload',
  MCQ: 'mcq',
  STORIES: 'stories',
  PROCESSING: 'processing',
  GENERATING_PROMPTS: 'generating_prompts',
  PROMPTS: 'prompts',
  RENDER: 'render',
  VIDEO_PREVIEW: 'video_preview',
  PREVIEW: 'preview',
  SCHEDULE: 'schedule',
};

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#080808', surface: '#111', surface2: '#1a1a1a', border: '#222',
  accent: '#E8FF47', accentDim: 'rgba(232,255,71,0.08)', accentBorder: 'rgba(232,255,71,0.25)',
  text: '#F0F0F0', muted: '#666', sub: '#999',
  green: '#4ADE80', red: '#FF6B6B', blue: '#60A5FA', orange: '#FB923C', purple: '#A78BFA',
  ig: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: ${C.bg}; overscroll-behavior: none; }
  button { transition: opacity 0.15s, transform 0.1s; }
  button:active { opacity: 0.75; transform: scale(0.97); }
  textarea, input { font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 0; }
`;

const Btn = ({ children, onClick, variant='primary', disabled=false, style={} }) => {
  const base = { width:'100%', padding:'15px 0', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:disabled?'not-allowed':'pointer', fontFamily:"'Syne',sans-serif", letterSpacing:'0.01em', transition:'all 0.2s', ...style };
  const variants = {
    primary: { background: disabled ? C.surface2 : C.accent, color: disabled ? C.muted : '#000' },
    ig: { background: disabled ? C.surface2 : C.ig, color: disabled ? C.muted : '#fff' },
    ghost: { background: 'transparent', color: C.sub, border: `1.5px solid ${C.border}` },
    danger: { background: 'rgba(255,107,107,0.1)', color: C.red, border: `1.5px solid rgba(255,107,107,0.2)` },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
};

const Header = ({ title, sub, onBack, right }) => (
  <div style={{ padding:'18px 20px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      {onBack && <button onClick={onBack} style={{ background:'none', border:'none', color:C.sub, fontSize:22, cursor:'pointer', padding:'0 6px 0 0', lineHeight:1 }}>←</button>}
      <div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:C.text, display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:C.accent, flexShrink:0 }}/>
          {title}
        </div>
        {sub && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
    {right}
  </div>
);

const CreditBadge = ({ used, total }) => {
  const left = total - used;
  const color = left > 5 ? C.green : left > 2 ? C.orange : C.red;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:20, padding:'4px 11px', fontSize:12 }}>
      🎟️ <span style={{ fontWeight:700, color, marginLeft:2 }}>{left}</span>
      <span style={{ color:C.muted }}>left</span>
    </div>
  );
};

// ── TOKEN ENTRY ───────────────────────────────────────────────────────────────
function TokenEntry({ onActivate }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const activate = () => {
    const parsed = parseToken(token.trim());
    if (!parsed) { setError('Invalid token format. Must start with SC- and include credits.'); return; }
    onActivate(parsed);
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 24px', fontFamily:"'DM Sans',sans-serif", maxWidth:440, margin:'0 auto' }}>
      <style>{css}</style>
      <div style={{ width:'100%', animation:'slideUp 0.5s ease' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>🎬</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:C.text, marginBottom:6 }}>SceneCraft</div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>AI-powered 30-second Instagram ad generator<br/>by CrafterLabs</div>
        </div>

        <div style={{ background:C.surface, borderRadius:20, padding:24, marginBottom:16, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:C.muted, textTransform:'uppercase', marginBottom:10 }}>Access Token</div>
          <input
            style={{ width:'100%', background:C.surface2, border:`1.5px solid ${error ? C.red : C.border}`, borderRadius:11, padding:'14px 16px', fontSize:15, color:C.text, outline:'none', fontFamily:'monospace', letterSpacing:1, marginBottom:error?8:16 }}
            placeholder="SC-10-XXXXXXXX"
            value={token}
            onChange={e => { setToken(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && activate()}
          />
          {error && <div style={{ fontSize:12, color:C.red, marginBottom:14, lineHeight:1.5 }}>⚠️ {error}</div>}
          <Btn onClick={activate} disabled={!token.trim()}>Activate My Account →</Btn>
        </div>

        <div style={{ fontSize:12, color:C.muted, textAlign:'center', lineHeight:1.8 }}>
          Don't have a token?{' '}
          <a href={`mailto:${PUBLISHER_EMAIL}?subject=SceneCraft Access Token Request`} style={{ color:C.accent, textDecoration:'none', fontWeight:600 }}>
            Contact CrafterLabs
          </a>
        </div>

        <div style={{ marginTop:20, background:C.surface2, borderRadius:12, padding:'12px 16px', fontSize:11, color:C.muted, lineHeight:1.8, border:`1px solid ${C.border}` }}>
          <div style={{ fontWeight:700, color:C.sub, marginBottom:4 }}>Token formats:</div>
          <div><span style={{ fontFamily:'monospace', color:C.text }}>SC-10-XXXXXX</span> — 10 credits</div>
          <div><span style={{ fontFamily:'monospace', color:C.text }}>SC-10-30-XXXXXX</span> — 10 credits, 30 days</div>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ tokenData, onStart, onLogout }) {
  const creditsLeft = tokenData.credits - tokenData.usedCredits;
  const creditsUsed = tokenData.usedCredits;
  const pct = (creditsLeft / tokenData.credits) * 100;
  const barColor = creditsLeft > 5 ? C.green : creditsLeft > 2 ? C.orange : C.red;

  const daysActive = tokenData.activatedAt ? Math.floor((Date.now() - tokenData.activatedAt) / 86400000) : 0;
  const adsPerDay = daysActive > 0 ? creditsUsed / daysActive : 0.5;
  const daysLeft = adsPerDay > 0 ? Math.floor(creditsLeft / adsPerDay) : null;
  const tokenDaysLeft = tokenData.days ? Math.floor(tokenData.days - daysActive) : null;

  const apis = [
    { name:'Claude AI', desc:'Image analysis & story generation', status:'live', icon:'🧠' },
    { name:'Kling O3', desc:'AI video clip rendering', status:'live', icon:'🎬' },
    { name:'Cloudinary', desc:'Image processing & hosting', status:'live', icon:'☁️' },
    { name:'Instagram', desc:'Auto-publishing & scheduling', status:'soon', icon:'📸' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column' }}>
      <style>{css}</style>
      <Header
        title="SceneCraft"
        sub="by CrafterLabs"
        right={
          <button onClick={onLogout} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, fontSize:11, padding:'5px 10px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Change Token
          </button>
        }
      />

      <div style={{ flex:1, overflowY:'auto', padding:'24px 20px 100px' }}>
        <div style={{ marginBottom:24, animation:'slideUp 0.4s ease' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>Welcome back 👋</div>
          <div style={{ fontSize:13, color:C.muted }}>Token: <span style={{ fontFamily:'monospace', color:C.sub }}>{tokenData.token}</span></div>
        </div>

        <div style={{ background:C.surface, borderRadius:20, padding:22, marginBottom:14, border:`1px solid ${C.border}`, animation:'slideUp 0.45s ease' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:C.muted, textTransform:'uppercase', marginBottom:4 }}>Credits Remaining</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, color:creditsLeft > 5 ? C.green : creditsLeft > 2 ? C.orange : C.red }}>
                {creditsLeft}
                <span style={{ fontSize:16, color:C.muted, fontWeight:400 }}> / {tokenData.credits}</span>
              </div>
            </div>
            <div style={{ fontSize:32 }}>🎟️</div>
          </div>

          <div style={{ height:6, background:C.surface2, borderRadius:10, overflow:'hidden', marginBottom:12 }}>
            <div style={{ height:'100%', width:`${pct}%`, background:barColor, borderRadius:10, transition:'width 0.5s ease' }}/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {daysLeft && (
              <div style={{ background:C.surface2, borderRadius:11, padding:'10px 12px', border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Est. Runway</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:C.text }}>~{daysLeft}d</div>
                <div style={{ fontSize:10, color:C.muted }}>at current pace</div>
              </div>
            )}
            {tokenDaysLeft !== null && tokenDaysLeft > 0 && (
              <div style={{ background:C.surface2, borderRadius:11, padding:'10px 12px', border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Token Expires</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color: tokenDaysLeft < 7 ? C.orange : C.text }}>{tokenDaysLeft}d</div>
                <div style={{ fontSize:10, color:C.muted }}>remaining</div>
              </div>
            )}
            <div style={{ background:C.surface2, borderRadius:11, padding:'10px 12px', border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Ads Created</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:C.text }}>{creditsUsed}</div>
              <div style={{ fontSize:10, color:C.muted }}>so far</div>
            </div>
          </div>
        </div>

        <div style={{ background:C.surface, borderRadius:20, padding:20, marginBottom:14, border:`1px solid ${C.border}`, animation:'slideUp 0.5s ease' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:C.muted, textTransform:'uppercase', marginBottom:14 }}>What 1 Credit Gets You</div>
          {[
            { icon:'🧠', text:'Claude analyzes all 5 scenes together' },
            { icon:'🎯', text:'4 image-specific creative questions' },
            { icon:'📖', text:'2 unique story directions to choose from' },
            { icon:'🎬', text:'5 Kling O3 video clip prompts' },
            { icon:'📝', text:'Caption + hashtags + music vibe' },
            { icon:'📱', text:'Instagram-ready 30-second ad' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'center', marginBottom: i < 5 ? 10 : 0 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
              <span style={{ fontSize:13, color:C.sub }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{ background:C.surface, borderRadius:20, padding:20, marginBottom:20, border:`1px solid ${C.border}`, animation:'slideUp 0.55s ease' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:C.muted, textTransform:'uppercase', marginBottom:14 }}>Platform Status</div>
          {apis.map((api, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom: i < apis.length-1 ? 12 : 0 }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{api.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{api.name}</div>
                <div style={{ fontSize:11, color:C.muted }}>{api.desc}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background: api.status === 'live' ? C.green : C.muted }}/>
                <span style={{ fontSize:11, color: api.status === 'live' ? C.green : C.muted, fontWeight:600 }}>
                  {api.status === 'live' ? 'Live' : 'Soon'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {creditsLeft <= 3 && (
          <div style={{ background:'rgba(251,146,60,0.08)', border:`1px solid rgba(251,146,60,0.2)`, borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.orange, marginBottom:4 }}>⚠️ Credits Running Low</div>
            <div style={{ fontSize:12, color:C.sub, lineHeight:1.6, marginBottom:12 }}>
              You have {creditsLeft} credit{creditsLeft !== 1 ? 's' : ''} remaining. Contact CrafterLabs to top up.
            </div>
            <a
              href={`mailto:${PUBLISHER_EMAIL}?subject=SceneCraft Credit Top-up Request&body=Hi, I need to top up my SceneCraft credits. My token is: ${tokenData.token}`}
              style={{ display:'block', textAlign:'center', padding:'10px 0', background:'rgba(251,146,60,0.15)', color:C.orange, borderRadius:10, fontSize:13, fontWeight:700, textDecoration:'none' }}
            >
              📧 Request More Credits
            </a>
          </div>
        )}

        <Btn onClick={onStart} disabled={creditsLeft < 1}>
          {creditsLeft < 1 ? 'No Credits Remaining' : '✦ Start Creating My Ad'}
        </Btn>
      </div>
    </div>
  );
}

// ── UPLOAD ────────────────────────────────────────────────────────────────────
function UploadStage({ scenes, onScenesChange, onAnalyze, tokenData }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef()];
  const filled = scenes.filter(Boolean).length;
  const creditsLeft = tokenData.credits - tokenData.usedCredits;

  const handleFile = async (i, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const compressed = await compressImage(file);
    const next = [...scenes];
    next[i] = compressed;
    onScenesChange(next);
  };

  const remove = (i) => {
    const next = [...scenes];
    next[i] = null;
    onScenesChange(next);
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column' }}>
      <style>{css}</style>
      <Header title="SceneCraft" sub="Upload your scenes" right={<CreditBadge used={tokenData.usedCredits} total={tokenData.credits} />} />

      <div style={{ flex:1, overflowY:'auto', padding:'24px 20px 100px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:21, fontWeight:800, color:C.text, marginBottom:6 }}>Build Your 30-sec Ad</div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>Upload up to 5 scenes. Claude studies all of them together to craft one linked story.</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:14 }}>
          {scenes.map((img, i) => (
            <div key={i} style={{ position:'relative' }}>
              <div
                onClick={() => !img && refs[i].current.click()}
                style={{ aspectRatio:'3/4', borderRadius:12, background: img ? 'transparent' : C.surface, border: `1.5px ${img ? 'solid' : 'dashed'} ${C.border}`, overflow:'hidden', cursor: img ? 'default' : 'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
              >
                {img ? <img src={img} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (
                  <><div style={{ fontSize:18, color:C.muted }}>+</div><div style={{ fontSize:9, color:C.muted, fontWeight:600, marginTop:3 }}>S{i+1}</div></>
                )}
              </div>
              {img && <button onClick={() => remove(i)} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:C.red, border:'none', color:'#fff', fontSize:10, cursor:'pointer', fontWeight:700 }}>×</button>}
              <input ref={refs[i]} type="file" accept="image/*" onChange={e => handleFile(i, e.target.files[0])} style={{ display:'none' }} />
            </div>
          ))}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24, fontSize:12 }}>
          <span style={{ color:C.muted }}>{filled} of 5 scenes uploaded</span>
          <span style={{ color: filled >= 5 ? C.green : C.accent, fontWeight:600 }}>{filled >= 5 ? '🎬 All scenes ready!' : `${5-filled} more to go`}</span>
        </div>

        <div style={{ background:C.surface, borderRadius:18, padding:20, marginBottom:24, border:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:C.text, marginBottom:14, letterSpacing:'0.04em' }}>HOW IT WORKS</div>
          {[
            { e:'📸', t:'5 scenes', d:'become 5 × 6-second video clips' },
            { e:'🧠', t:'Claude reads all', d:'understands your full story arc' },
            { e:'🎯', t:'Smart questions', d:'specific to what Claude sees in your photos' },
            { e:'📖', t:'2 story directions', d:'pick the one that fits your brand' },
            { e:'⚡', t:'Kling O3 renders', d:'stitched into 30-sec Instagram ad' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom: i < 4 ? 12 : 0, alignItems:'flex-start' }}>
              <span style={{ fontSize:17, flexShrink:0, marginTop:1 }}>{item.e}</span>
              <div><div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:1 }}>{item.t}</div><div style={{ fontSize:12, color:C.muted }}>{item.d}</div></div>
            </div>
          ))}
        </div>

        {filled > 0 && <Btn onClick={onAnalyze} disabled={creditsLeft < 1}>{filled === 1 ? '✦ Analyze Scene & Build Story' : `✦ Analyze All ${filled} Scenes & Build Story`}</Btn>}
      </div>
    </div>
  );
}

// ── PROCESSING ────────────────────────────────────────────────────────────────
function ProcessingStage({ status, sub }) {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`${css}`}</style>
      <div style={{ width:56, height:56, borderRadius:'50%', border:`3px solid ${C.surface2}`, borderTop:`3px solid ${C.accent}`, animation:'spin 0.9s linear infinite', marginBottom:28 }}/>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:C.text, marginBottom:8, textAlign:'center' }}>{status}</div>
      {sub && <div style={{ fontSize:13, color:C.accent, fontWeight:600, textAlign:'center', marginBottom:6 }}>{sub}</div>}
      <div style={{ fontSize:12, color:C.muted, textAlign:'center' }}>This may take 20-40 seconds</div>
    </div>
  );
}

// ── MCQ ───────────────────────────────────────────────────────────────────────
function MCQStage({ questions, sceneCount, onComplete, error, onRetry }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [freeTexts, setFreeTexts] = useState({});
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;
  const selectedVals = answers[q.id] || [];

  const toggle = (val) => {
    const prev = answers[q.id] || [];
    let next;
    if (q.type === 'single') {
      next = prev.includes(val) ? [] : [val];
    } else {
      next = prev.includes(val) ? prev.filter(v => v !== val) : prev.length < 3 ? [...prev, val] : prev;
    }
    setAnswers({ ...answers, [q.id]: next });
  };

  const isSelected = (val) => (answers[q.id] || []).includes(val);
  const canNext = (answers[q.id] || []).length > 0 || freeTexts[q.id]?.trim();

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      const finalAnswers = { ...answers };
      Object.entries(freeTexts).forEach(([qid, txt]) => {
        if (txt.trim()) finalAnswers[`${qid}_freetext`] = txt.trim();
      });
      onComplete(finalAnswers, freeTexts);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column' }}>
      <style>{css}</style>
      <Header title="SceneCraft" sub={`Claude studied all ${sceneCount} scenes`} />

      <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 100px' }}>
        <div style={{ height:2, background:C.surface2, borderRadius:4, marginBottom:20, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:C.accent, borderRadius:4, transition:'width 0.4s ease' }}/>
        </div>

        <div style={{ background:C.accentDim, border:`1px solid ${C.accentBorder}`, borderRadius:12, padding:'11px 14px', marginBottom:18, fontSize:12, color:C.sub, lineHeight:1.6, borderLeft:`3px solid ${C.accent}` }}>
          <span style={{ fontWeight:600, color:C.text }}>Claude is asking you — </span>
          questions based on what it actually sees in your {sceneCount} images
        </div>

        <div style={{ background:C.surface, borderRadius:18, padding:20, marginBottom:12, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:C.accent, textTransform:'uppercase', marginBottom:6 }}>{q.step}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:C.text, lineHeight:1.45, marginBottom: q.why_asking ? 8 : 16 }}>{q.question}</div>
          {q.why_asking && <div style={{ fontSize:11, color:C.muted, fontStyle:'italic', marginBottom:14, lineHeight:1.5 }}>💡 {q.why_asking}</div>}

          {q.type !== 'single' && (
            <div style={{ fontSize:11, color:C.muted, textAlign:'right', marginBottom:10 }}>Pick up to 3</div>
          )}

          {q.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              style={{
                width:'100%', padding:'12px 14px', marginBottom:7,
                background: isSelected(opt.value) ? 'rgba(232,255,71,0.08)' : C.surface2,
                border: `1.5px solid ${isSelected(opt.value) ? C.accent : C.border}`,
                borderRadius:11, color: isSelected(opt.value) ? C.accent : C.text,
                fontSize:13, fontWeight:500, cursor:'pointer',
                textAlign:'left', display:'flex', alignItems:'flex-start', gap:11, lineHeight:1.4,
              }}
            >
              <span style={{ fontSize:18, flexShrink:0 }}>{opt.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600 }}>{opt.label}</div>
                {opt.sublabel && <div style={{ fontSize:11, color: isSelected(opt.value) ? 'rgba(232,255,71,0.6)' : C.muted, marginTop:2 }}>{opt.sublabel}</div>}
              </div>
              {isSelected(opt.value) && <span style={{ fontSize:14, flexShrink:0 }}>✓</span>}
            </button>
          ))}

          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Your own thought (optional)</div>
            <textarea
              style={{ width:'100%', background:C.surface2, border:`1.5px solid ${C.border}`, borderRadius:10, padding:'11px 13px', fontSize:13, color:C.text, outline:'none', resize:'none', minHeight:72, lineHeight:1.6 }}
              placeholder="Add anything specific Claude should know (max 200 chars)…"
              maxLength={200}
              value={freeTexts[q.id] || ''}
              onChange={e => setFreeTexts({ ...freeTexts, [q.id]: e.target.value })}
            />
            <div style={{ textAlign:'right', fontSize:11, color: (freeTexts[q.id]||'').length > 180 ? C.orange : C.muted, marginTop:4 }}>
              {(freeTexts[q.id]||'').length}/200
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background:'rgba(255,107,107,0.08)', border:`1px solid rgba(255,107,107,0.25)`, borderRadius:12, padding:'13px 14px', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.red, marginBottom:6 }}>⚠️ Story generation failed</div>
            <div style={{ fontSize:12, color:C.sub, lineHeight:1.5, marginBottom:10 }}>{error}</div>
            <button
              onClick={onRetry}
              style={{ width:'100%', padding:'10px 0', background:'rgba(255,107,107,0.15)', border:`1px solid rgba(255,107,107,0.3)`, borderRadius:9, color:C.red, fontSize:13, fontWeight:700, cursor:'pointer' }}
            >
              🔄 Retry with same answers
            </button>
          </div>
        )}

        <Btn onClick={handleNext} disabled={!canNext}>
          {current < questions.length - 1 ? 'Next Question →' : 'Generate My Story Options ✦'}
        </Btn>
      </div>
    </div>
  );
}

// ── STORY PROPOSALS ───────────────────────────────────────────────────────────
function StoriesStage({ stories, sceneCount, onSelect, onBack }) {
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column' }}>
      <style>{css}</style>
      <Header title="Story Directions" sub="Pick your narrative" onBack={onBack} />

      <div style={{ flex:1, overflowY:'auto', padding:'24px 20px 120px' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:C.text, marginBottom:6 }}>Story Directions</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:22, lineHeight:1.6 }}>
          Claude crafted these from all {sceneCount} scenes. Each leads to a completely different 30-sec ad.
        </div>

        {stories.map((story, i) => {
          const isOpen = expanded === i;
          const isSel = selected === i;
          return (
            <div key={i} style={{ marginBottom:14, animation:`slideUp ${0.3 + i*0.1}s ease` }}>
              <button
                onClick={() => { setSelected(i); setExpanded(isOpen ? null : i); }}
                style={{
                  width:'100%', textAlign:'left', cursor:'pointer',
                  background: isSel ? 'rgba(232,255,71,0.05)' : C.surface,
                  border: `2px solid ${isSel ? C.accent : C.border}`,
                  borderRadius:18, padding:20, transition:'all 0.2s',
                }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color: isSel ? C.accent : C.muted, textTransform:'uppercase', marginBottom:4 }}>Story {String.fromCharCode(65+i)}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:19, fontWeight:800, color:C.text }}>{story.title}</div>
                  </div>
                  <div style={{ width:24, height:24, borderRadius:'50%', border:`2px solid ${isSel ? C.accent : C.border}`, background: isSel ? C.accent : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {isSel && <div style={{ width:8, height:8, borderRadius:'50%', background:'#000' }}/>}
                  </div>
                </div>

                <div style={{ fontSize:13, color:C.sub, fontStyle:'italic', marginBottom:14, lineHeight:1.5 }}>"{story.tagline}"</div>

                <div style={{ display:'flex', gap:5, marginBottom:14 }}>
                  {(story.arc || []).map((beat, j) => (
                    <div key={j} style={{ flex:1, background:C.surface2, borderRadius:8, padding:'7px 4px', textAlign:'center' }}>
                      <div style={{ fontSize:15, marginBottom:2 }}>{beat.emoji}</div>
                      <div style={{ fontSize:9, color:C.muted, fontWeight:600, lineHeight:1.2 }}>{beat.label}</div>
                    </div>
                  ))}
                </div>

                {story.script && (
                  <div style={{ background:C.surface2, borderRadius:12, padding:'13px 14px', marginBottom:12, borderLeft:`3px solid ${isSel ? C.accent : C.border}` }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:7 }}>30-Second Script</div>
                    <div style={{ fontSize:12, color:C.sub, lineHeight:1.75, fontStyle:'italic' }}>
                      {isOpen ? story.script : story.script.slice(0, 180) + (story.script.length > 180 ? '…' : '')}
                    </div>
                    {story.script.length > 180 && (
                      <div style={{ fontSize:11, color:C.accent, fontWeight:600, marginTop:7 }}>{isOpen ? '▲ Show less' : '▼ Read full script'}</div>
                    )}
                  </div>
                )}

                {isOpen && story.journey && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:8 }}>Your 30-Second Video</div>
                    {story.journey.map((beat, j) => (
                      <div key={j} style={{ display:'flex', gap:10, marginBottom:6, alignItems:'flex-start' }}>
                        <div style={{ fontSize:10, fontWeight:700, color:C.accent, background:C.accentDim, padding:'2px 8px', borderRadius:20, flexShrink:0, marginTop:1, whiteSpace:'nowrap' }}>{beat.time}</div>
                        <div style={{ fontSize:12, color:C.sub, lineHeight:1.5 }}>{beat.desc}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: story.musicVibe ? 10 : 0 }}>
                  {(story.vibes || []).map(v => (
                    <span key={v} style={{ fontSize:11, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:20, padding:'3px 10px', color:C.muted }}>{v}</span>
                  ))}
                </div>

                {story.musicVibe && (
                  <div style={{ fontSize:12, color:C.blue, marginTop:8 }}>🎵 {story.musicVibe}</div>
                )}
              </button>
            </div>
          );
        })}

        <Btn onClick={() => onSelect(stories[selected])} disabled={selected === null}>
          {selected !== null ? `Use Story ${String.fromCharCode(65+selected)} — Generate Prompts ✦` : 'Select a story direction'}
        </Btn>
      </div>
    </div>
  );
}

// ── PROMPTS REVIEW ────────────────────────────────────────────────────────────
function PromptsStage({ result, scenes, onRender, onBack }) {
  const [prompts, setPrompts] = useState(result.prompts || []);
  const [editingIdx, setEditingIdx] = useState(null);
  const [caption, setCaption] = useState(result.caption || '');
  const [hashtags, setHashtags] = useState(result.hashtags || '');
  const [editCaption, setEditCaption] = useState(false);
  const [editHashtags, setEditHashtags] = useState(false);

  const updatePrompt = (i, val) => {
    const next = [...prompts];
    next[i] = val;
    setPrompts(next);
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column' }}>
      <style>{css}</style>
      <Header title="Review Prompts" sub="Edit anything before rendering" onBack={onBack} />

      <div style={{ flex:1, overflowY:'auto', padding:'22px 20px 110px' }}>
        <div style={{ background:C.surface, borderRadius:16, padding:18, marginBottom:16, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:C.accent, textTransform:'uppercase', marginBottom:4 }}>Story Direction</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:C.text, marginBottom:4 }}>{result.storyTitle}</div>
          <div style={{ fontSize:12, color:C.muted, fontStyle:'italic' }}>"{result.tagline}"</div>
        </div>

        <div style={{ display:'flex', gap:6, marginBottom:18, overflowX:'auto', paddingBottom:4 }}>
          {scenes.filter(Boolean).map((img, i) => (
            <img key={i} src={img} style={{ width:60, height:75, objectFit:'cover', borderRadius:10, flexShrink:0, border:`1px solid ${C.border}` }} />
          ))}
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:12 }}>
            Video Prompts — Tap to Edit
          </div>
          {prompts.map((p, i) => (
            <div key={i} style={{ background:C.surface, borderRadius:14, padding:16, marginBottom:10, border:`1px solid ${editingIdx === i ? C.accent : C.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {scenes[i] && <img src={scenes[i]} style={{ width:36, height:36, objectFit:'cover', borderRadius:7, border:`1px solid ${C.border}` }}/>}
                  <span style={{ fontSize:10, fontWeight:700, color:C.accent, background:C.accentDim, padding:'2px 8px', borderRadius:20 }}>Clip {i+1} — 6 sec</span>
                </div>
                <button
                  onClick={() => setEditingIdx(editingIdx === i ? null : i)}
                  style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, fontSize:11, padding:'4px 10px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}
                >
                  {editingIdx === i ? 'Done' : '✏️ Edit'}
                </button>
              </div>
              {editingIdx === i ? (
                <textarea
                  style={{ width:'100%', background:C.surface2, border:`1.5px solid ${C.accent}`, borderRadius:10, padding:'11px 13px', fontSize:12, color:C.text, outline:'none', resize:'vertical', minHeight:110, lineHeight:1.7 }}
                  value={p}
                  onChange={e => updatePrompt(i, e.target.value)}
                  autoFocus
                />
              ) : (
                <div style={{ fontSize:12, color:C.sub, lineHeight:1.75 }}>{p}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ background:C.surface, borderRadius:14, padding:16, marginBottom:10, border:`1px solid ${editCaption ? C.accent : C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase' }}>Caption</div>
            <button onClick={() => setEditCaption(!editCaption)} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, fontSize:11, padding:'4px 10px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {editCaption ? 'Done' : '✏️ Edit'}
            </button>
          </div>
          {editCaption ? (
            <textarea style={{ width:'100%', background:C.surface2, border:`1.5px solid ${C.accent}`, borderRadius:10, padding:'11px 13px', fontSize:13, color:C.text, outline:'none', resize:'vertical', minHeight:80, lineHeight:1.6 }} value={caption} onChange={e => setCaption(e.target.value)} autoFocus/>
          ) : (
            <div style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>{caption}</div>
          )}
        </div>

        <div style={{ background:C.surface, borderRadius:14, padding:16, marginBottom:10, border:`1px solid ${editHashtags ? C.accent : C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase' }}>Hashtags</div>
            <button onClick={() => setEditHashtags(!editHashtags)} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, fontSize:11, padding:'4px 10px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {editHashtags ? 'Done' : '✏️ Edit'}
            </button>
          </div>
          {editHashtags ? (
            <textarea style={{ width:'100%', background:C.surface2, border:`1.5px solid ${C.accent}`, borderRadius:10, padding:'11px 13px', fontSize:12, color:C.blue, outline:'none', resize:'vertical', minHeight:70, lineHeight:1.7 }} value={hashtags} onChange={e => setHashtags(e.target.value)} autoFocus/>
          ) : (
            <div style={{ fontSize:12, color:C.blue, lineHeight:1.8 }}>{hashtags}</div>
          )}
        </div>

        {result.musicVibe && (
          <div style={{ background:'rgba(96,165,250,0.06)', border:`1px solid rgba(96,165,250,0.15)`, borderRadius:12, padding:'12px 14px', marginBottom:20 }}>
            <span style={{ fontSize:12, color:C.blue }}>🎵 <span style={{ fontWeight:600 }}>Music vibe:</span> {result.musicVibe}</span>
          </div>
        )}

        <Btn onClick={() => onRender({ ...result, prompts, caption, hashtags })}>
          🎬 Render My Videos
        </Btn>
        <div style={{ marginTop:10 }}>
          <Btn variant="ghost" onClick={onBack}>← Back to Story Selection</Btn>
        </div>
      </div>
    </div>
  );
}

// ── RENDER STAGE ─────────────────────────────────────────────────────────────
function RenderStage({ result, scenes, tokenData, onComplete, onError }) {
  const [stepLabel, setStepLabel] = useState('Preparing your scenes…');
  const [subLabel, setSubLabel] = useState('');
  const [pct, setPct] = useState(0);
  const [error, setError] = useState(null);
  const hasStarted = useRef(false);

  const filledScenes = scenes.filter(Boolean);

  // Progress ticker — shows realistic progress while waiting
  const startProgressTick = (from, to, durationMs, label, sub) => {
    setStepLabel(label);
    if (sub) setSubLabel(sub);
    const steps = 40;
    const interval = durationMs / steps;
    let current = from;
    const timer = setInterval(() => {
      current += (to - from) / steps;
      if (current >= to) { clearInterval(timer); current = to; }
      setPct(Math.round(current));
    }, interval);
    return timer;
  };

  const runRender = async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    try {
      setPct(3); setStepLabel('Uploading scenes to Cloudinary…');

      const images = filledScenes.map((img, i) => ({
        index: i,
        base64: img.split(',')[1],
        media_type: 'image/jpeg',
      }));

      // Single request — n8n handles everything
      const estimatedMs = filledScenes.length * 120000 + 60000; // 2min/clip + 1min stitch

      // Tick progress while waiting
      const tick1 = startProgressTick(3, 15, 10000, 'Uploading scenes to Cloudinary…', '');
      
      setTimeout(() => {
        clearInterval(tick1);
        startProgressTick(15, 75, filledScenes.length * 110000,
          `Rendering ${filledScenes.length} clips with Kling O3…`,
          `~${filledScenes.length * 2} minutes — keep screen open ☕`
        );
      }, 10000);

      setTimeout(() => {
        setStepLabel('Stitching your ad…');
        setSubLabel('Hard cuts with zoom punch 🎬');
        startProgressTick(75, 88, 30000, 'Stitching your ad…', 'Hard cuts with zoom punch 🎬');
      }, filledScenes.length * 110000 + 10000);

      setTimeout(() => {
        startProgressTick(88, 96, 20000, 'Adding music…', 'Matching track to your story vibe 🎵');
      }, filledScenes.length * 110000 + 40000);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), (filledScenes.length * 180000) + 120000);

      const res = await fetch(ENDPOINTS.render, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          client_token: tokenData.token,
          session_id: 'sess_' + Date.now(),
          scene_count: filledScenes.length,
          images,
          prompts: result.prompts,
          story_title: result.storyTitle,
          music_vibe: result.musicVibe || 'cinematic uplifting',
        }),
      });

      clearTimeout(timeoutId);
      const rawText = await res.text();

      let data;
      try { data = JSON.parse(rawText); }
      catch(e) { throw new Error('Bad response from server: ' + rawText.slice(0, 200)); }

      if (!data.success || !data.videoUrl) {
        throw new Error(data.error || 'No video URL returned');
      }

      setPct(100);
      setStepLabel('Your ad is ready! 🎉');
      setSubLabel('');

      setTimeout(() => onComplete({
        finalVideoUrl: data.videoUrl,
        clipUrls: data.clipUrls || [],
        musicUrl: data.musicUrl || null,
      }), 1000);

    } catch(e) {
      if (e.name === 'AbortError') {
        setError(`Render timed out after ${filledScenes.length * 3} minutes. Please try again.`);
      } else {
        setError(e.message);
      }
    }
  };

  useState(() => { runRender(); });

  if (error) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{css}</style>
      <div style={{ textAlign:'center', maxWidth:380 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:C.text, marginBottom:12 }}>Render Failed</div>
        <div style={{ fontSize:13, color:C.red, background:'rgba(255,107,107,0.08)', border:`1px solid rgba(255,107,107,0.2)`, borderRadius:12, padding:'12px 16px', marginBottom:24, lineHeight:1.6 }}>{error}</div>
        <Btn onClick={onError}>← Back to Prompts</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{css}</style>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🎬</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:C.text, marginBottom:8 }}>Rendering Your Ad</div>
          <div style={{ fontSize:13, color:C.muted }}>Kling O3 is crafting your video clips</div>
        </div>

        <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:24 }}>
          {filledScenes.map((img, i) => (
            <div key={i} style={{ position:'relative' }}>
              <img src={img} style={{ width:52, height:65, objectFit:'cover', borderRadius:8, border:`2px solid ${i < step ? C.green : i === step - 1 ? C.accent : C.border}`, transition:'border-color 0.5s' }}/>
              {i < step - 1 && (
                <div style={{ position:'absolute', top:-4, right:-4, width:14, height:14, borderRadius:'50%', background:C.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#000', fontWeight:700 }}>✓</div>
              )}
              {i === step - 1 && (
                <div style={{ position:'absolute', top:-4, right:-4, width:14, height:14, borderRadius:'50%', background:C.accent, border:`2px solid ${C.bg}`, animation:'spin 1s linear infinite' }}/>
              )}
            </div>
          ))}
        </div>

        <div style={{ height:4, background:C.surface2, borderRadius:10, overflow:'hidden', marginBottom:12 }}>
          <div style={{ height:'100%', width:`${pct}%`, background:C.accent, borderRadius:10, transition:'width 1s ease' }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:28, fontSize:12 }}>
          <span style={{ color:C.muted }}>{stepLabel}</span>
          <span style={{ color:C.accent, fontWeight:700 }}>{pct}%</span>
        </div>

        <div style={{ fontSize:12, color:C.muted, textAlign:'center', lineHeight:1.7 }}>
          Each clip takes ~1-2 minutes to render<br/>
          Please keep this screen open ☕
        </div>
      </div>
    </div>
  );
}

// ── VIDEO PREVIEW STAGE ───────────────────────────────────────────────────────
function VideoPreviewStage({ result, scenes, videoUrls, onSchedule, onRedo }) {
  const finalVideoUrl = videoUrls?.finalVideoUrl || null;
  const clipUrls = videoUrls?.clipUrls || (Array.isArray(videoUrls) ? videoUrls : []);
  const musicUrl = videoUrls?.musicUrl || null;
  const [currentClip, setCurrentClip] = useState(-1); // -1 = show final stitched
  const [igHandle, setIgHandle] = useState('');
  const [caption, setCaption] = useState(result.caption || '');
  const [hashtags, setHashtags] = useState(result.hashtags || '');
  const [title, setTitle] = useState(result.storyTitle || '');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const filledScenes = scenes.filter(Boolean);
  const validVideos = videoUrls.filter(Boolean);

  const handlePublish = async () => {
    if (!igHandle.trim()) { alert('Please add your Instagram handle first'); return; }
    setPublishing(true);
    await new Promise(r => setTimeout(r, 2000));
    setPublishing(false);
    setPublished(true);
  };

  if (published) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{css}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:20 }}>🎉</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:C.text, marginBottom:8 }}>Posted to Instagram!</div>
        <div style={{ fontSize:14, color:C.muted, marginBottom:8 }}>@{igHandle.replace('@','')}</div>
        <div style={{ fontSize:13, color:C.sub, marginBottom:32 }}>Your 30-second ad is live</div>
        <button onClick={onRedo} style={{ padding:'14px 28px', background:C.accent, color:'#000', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          Create Another Ad ✦
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column' }}>
      <style>{css}</style>
      <Header title="Your Ad is Ready!" sub="Review and publish" />

      <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 110px' }}>
        {validVideos.length > 0 ? (
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:10 }}>
              Your Video Clips — {validVideos.length} of {filledScenes.length} ready
            </div>
            <div style={{ background:C.surface, borderRadius:16, overflow:'hidden', marginBottom:12, border:`1px solid ${C.border}` }}>
              {videoUrls[currentClip] ? (
                <video
                  key={currentClip}
                  src={videoUrls[currentClip]}
                  controls
                  autoPlay
                  style={{ width:'100%', display:'block', maxHeight:280 }}
                />
              ) : (
                <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
                  <div style={{ fontSize:24 }}>❌</div>
                  <div style={{ fontSize:12, color:C.muted }}>Scene {currentClip + 1} failed to render</div>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
              {filledScenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentClip(i)}
                  style={{
                    flexShrink:0, position:'relative', cursor:'pointer',
                    border:`2px solid ${currentClip === i ? C.accent : C.border}`,
                    borderRadius:10, overflow:'hidden', background:'none', padding:0,
                  }}
                >
                  <img src={img} style={{ width:56, height:70, objectFit:'cover', display:'block' }}/>
                  <div style={{
                    position:'absolute', bottom:0, left:0, right:0,
                    background: videoUrls[i] ? 'rgba(74,222,128,0.8)' : 'rgba(255,107,107,0.8)',
                    fontSize:9, fontWeight:700, color:'#000', textAlign:'center', padding:'2px 0',
                  }}>
                    {videoUrls[i] ? `Clip ${i+1} ✓` : `Clip ${i+1} ✗`}
                  </div>
                </button>
              ))}
            </div>

            {videoUrls[currentClip] && (
              <a
                href={videoUrls[currentClip]}
                download={`scenecraft_clip_${currentClip + 1}.mp4`}
                style={{ display:'block', marginTop:10, textAlign:'center', padding:'9px 0', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, fontSize:12, color:C.sub, textDecoration:'none', fontWeight:600 }}
              >
                ⬇️ Download Clip {currentClip + 1}
              </a>
            )}
          </div>
        ) : (
          <div style={{ background:C.surface, borderRadius:16, overflow:'hidden', marginBottom:16, border:`1px solid ${C.border}` }}>
            <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:13, color:C.muted }}>Videos unavailable</div>
            </div>
          </div>
        )}

        <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:C.accent, textTransform:'uppercase', marginBottom:4 }}>Story</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:C.text }}>{result.storyTitle}</div>
          <div style={{ fontSize:12, color:C.muted, fontStyle:'italic', marginTop:2 }}>"{result.tagline}"</div>
        </div>

        <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:10, border:`1.5px solid ${igHandle ? C.green+'55' : 'rgba(255,107,107,0.4)'}` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:6 }}>
            Instagram Handle <span style={{ color:C.red }}>*required to publish</span>
          </div>
          <input
            style={{ width:'100%', background:C.surface2, border:`1.5px solid ${igHandle ? C.green : C.border}`, borderRadius:10, padding:'10px 13px', fontSize:14, color:C.text, outline:'none' }}
            placeholder="@yourbrand"
            value={igHandle}
            onChange={e => setIgHandle(e.target.value)}
          />
        </div>

        <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:10, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:6 }}>Caption</div>
          <textarea style={{ width:'100%', background:'transparent', border:'none', fontSize:13, color:C.sub, outline:'none', resize:'vertical', minHeight:60, lineHeight:1.65, fontFamily:"'DM Sans',sans-serif" }} value={caption} onChange={e => setCaption(e.target.value)}/>
        </div>

        <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:14, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:6 }}>Hashtags</div>
          <textarea style={{ width:'100%', background:'transparent', border:'none', fontSize:12, color:C.blue, outline:'none', resize:'vertical', minHeight:55, lineHeight:1.75, fontFamily:"'DM Sans',sans-serif" }} value={hashtags} onChange={e => setHashtags(e.target.value)}/>
        </div>

        {result.musicVibe && (
          <div style={{ background:'rgba(96,165,250,0.06)', border:`1px solid rgba(96,165,250,0.15)`, borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
            <span style={{ fontSize:12, color:C.blue }}>🎵 <span style={{ fontWeight:600 }}>Music vibe:</span> {result.musicVibe}</span>
          </div>
        )}

        <Btn variant="ig" onClick={handlePublish} disabled={publishing || !igHandle.trim()}>
          {publishing ? '⏳ Publishing…' : '📸 Post to Instagram Now'}
        </Btn>
        <div style={{ marginTop:10 }}>
          <Btn variant="ghost" onClick={onSchedule}>📅 Schedule for Later</Btn>
        </div>
        <div style={{ marginTop:10 }}>
          <Btn variant="ghost" onClick={() => {
            const text = `${title}\n\n${caption}\n\n${hashtags}`;
            if (navigator.share) navigator.share({ title, text });
            else alert('Prompts:\n\n' + (result.prompts || []).join('\n\n'));
          }}>⬇️ Download / Share</Btn>
        </div>
        <div style={{ marginTop:10 }}>
          <Btn variant="danger" onClick={onRedo}>↺ Start Over</Btn>
        </div>
      </div>
    </div>
  );
}

// ── SCHEDULE ──────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function ScheduleStage({ result, onBack, onScheduled }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [day, setDay] = useState(null);
  const [time, setTime] = useState('09:00');
  const [scheduled, setScheduled] = useState(false);

  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells = Array(first).fill(null).concat(Array.from({length:total}, (_,i) => i+1));

  const isToday = (d) => year === now.getFullYear() && month === now.getMonth() && d === now.getDate();
  const isPast = (d) => new Date(year, month, d) < new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const prev = () => { if(month===0){setMonth(11);setYear(year-1);}else setMonth(month-1); setDay(null); };
  const next = () => { if(month===11){setMonth(0);setYear(year+1);}else setMonth(month+1); setDay(null); };

  const handleSchedule = () => {
    if (!day) return;
    setScheduled(true);
    setTimeout(() => onScheduled(`${MONTHS[month]} ${day}, ${year} at ${time}`), 1500);
  };

  if (scheduled) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{css}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:16 }}>📅</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:C.text, marginBottom:8 }}>Scheduled!</div>
        <div style={{ fontSize:13, color:C.muted }}>Your ad will post on</div>
        <div style={{ fontSize:16, fontWeight:700, color:C.accent, marginTop:6 }}>{MONTHS[month]} {day}, {year} at {time}</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column' }}>
      <style>{css}</style>
      <Header title="Schedule Post" sub="Pick date and time" onBack={onBack} />

      <div style={{ flex:1, overflowY:'auto', padding:'22px 20px 100px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <button onClick={prev} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:18, padding:'6px 14px', cursor:'pointer' }}>‹</button>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:C.text }}>{MONTHS[month]} {year}</div>
          <button onClick={next} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:18, padding:'6px 14px', cursor:'pointer' }}>›</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:C.muted, padding:'3px 0' }}>{d}</div>)}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:24 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i}/>;
            const past = isPast(d);
            const today = isToday(d);
            const sel = day === d;
            return (
              <button key={i} disabled={past} onClick={() => setDay(d)} style={{
                aspectRatio:'1', borderRadius:10, border:'none', cursor: past ? 'not-allowed' : 'pointer',
                background: sel ? C.accent : today ? C.accentDim : C.surface,
                outline: today && !sel ? `1.5px solid ${C.accentBorder}` : 'none',
                opacity: past ? 0.3 : 1,
              }}>
                <span style={{ fontSize:14, fontWeight:600, color: sel ? '#000' : today ? C.accent : C.text }}>{d}</span>
              </button>
            );
          })}
        </div>

        {day && (
          <div style={{ background:C.surface, borderRadius:16, padding:18, marginBottom:20, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:10 }}>Post Time</div>
            <div style={{ display:'flex', gap:10 }}>
              {['07:00','09:00','12:00','18:00','20:00'].map(t => (
                <button key={t} onClick={() => setTime(t)} style={{
                  flex:1, padding:'9px 0', borderRadius:10, border:`1.5px solid ${time===t ? C.accent : C.border}`,
                  background: time===t ? C.accentDim : C.surface2, color: time===t ? C.accent : C.muted,
                  fontSize:12, fontWeight:600, cursor:'pointer',
                }}>{t}</button>
              ))}
            </div>
            <div style={{ marginTop:10 }}>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width:'100%', background:C.surface2, border:`1.5px solid ${C.border}`, borderRadius:10, padding:'11px 14px', fontSize:14, color:C.text, outline:'none' }}/>
            </div>
          </div>
        )}

        {day && (
          <div style={{ background:C.accentDim, border:`1px solid ${C.accentBorder}`, borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
            <div style={{ fontSize:13, color:C.text, fontWeight:600 }}>📅 Scheduled for: {MONTHS[month]} {day}, {year} at {time}</div>
          </div>
        )}

        <Btn onClick={handleSchedule} disabled={!day}>Confirm Schedule ✦</Btn>
        <div style={{ marginTop:10 }}><Btn variant="ghost" onClick={onBack}>← Back</Btn></div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tokenData, setTokenData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sc_token_v2') || 'null'); } catch(e) { return null; }
  });
  const [stage, setStage] = useState(tokenData ? S.DASHBOARD : S.TOKEN);
  const [scenes, setScenes] = useState([null,null,null,null,null]);
  const [questions, setQuestions] = useState([]);
  const [storyProposals, setStoryProposals] = useState([]);
  const [result, setResult] = useState(null);
  const [videoUrls, setVideoUrls] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingSubstatus, setProcessingSubstatus] = useState('');

  const saveToken = (data) => {
    try { localStorage.setItem('sc_token_v2', JSON.stringify(data)); } catch(e) {}
    setTokenData(data);
    setStage(S.DASHBOARD);
  };

  const consumeCredit = () => {
    const updated = { ...tokenData, usedCredits: (tokenData.usedCredits || 0) + 1 };
    try { localStorage.setItem('sc_token_v2', JSON.stringify(updated)); } catch(e) {}
    setTokenData(updated);
  };

  const logout = () => {
    try { localStorage.removeItem('sc_token_v2'); } catch(e) {}
    setTokenData(null);
    setStage(S.TOKEN);
  };

  const filledScenes = scenes.filter(Boolean);

  const handleAnalyze = async () => {
    setStage(S.PROCESSING);
    setProcessingStatus('Claude is studying your scenes…');
    setProcessingSubstatus(`Analyzing all ${filledScenes.length} images together`);

    try {
      const images = filledScenes.map((img, i) => ({
        index: i, base64: img.split(',')[1], media_type: 'image/jpeg',
      }));

      const res = await fetch(ENDPOINTS.analyze, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_token: tokenData.token, session_id: 'sess_' + Date.now(), scene_count: filledScenes.length, images }),
      });

      const rawText = await res.text();
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = JSON.parse(rawText);
      if (!data.success || !data.questions) throw new Error(data.error || 'No questions returned');

      setQuestions(data.questions);
      setStage(S.MCQ);
    } catch(e) {
      alert('Analysis failed: ' + e.message);
      setStage(S.UPLOAD);
    }
  };

  const [lastAnswers, setLastAnswers] = useState(null);
  const [lastFreeTexts, setLastFreeTexts] = useState(null);
  const [storyError, setStoryError] = useState(null);

  const handleMCQComplete = async (answers, freeTexts) => {
    setLastAnswers(answers);
    setLastFreeTexts(freeTexts);
    setStoryError(null);
    await generateStories(answers, freeTexts);
  };

  const generateStories = async (answers, freeTexts) => {
    setStage(S.PROCESSING);
    setProcessingStatus('Crafting your story directions…');
    setProcessingSubstatus('Claude is reading all your scenes + answers');

    const answerLabels = {};
    Object.entries(answers || {}).forEach(([qid, vals]) => {
      if (qid.endsWith('_freetext')) { answerLabels[qid] = vals; return; }
      const q = questions.find(q => q.id === qid);
      if (!q) return;
      const valArr = Array.isArray(vals) ? vals : [vals];
      const selected = q.options?.filter(o => valArr.includes(o.value)) || [];
      answerLabels[qid] = selected.map(o => o.label).join(', ');
    });
    Object.entries(freeTexts || {}).forEach(([qid, txt]) => {
      if (txt?.trim()) answerLabels[`freetext_${qid}`] = txt.trim();
    });

    const images = filledScenes.map((img, i) => ({
      index: i, base64: img.split(',')[1], media_type: 'image/jpeg',
    }));

    try {
      const res = await fetch(ENDPOINTS.buildPrompt, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_token: tokenData.token,
          session_id: 'sess_' + Date.now(),
          scene_count: filledScenes.length,
          images, answers, answer_labels: answerLabels, questions
        }),
      });

      const rawText = await res.text();
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      let data;
      try { data = JSON.parse(rawText); }
      catch(e) { throw new Error('Invalid response from server'); }

      if (!data.success || !data.stories) {
        const errMsg = data.error || 'Story generation failed — please try again';
        setStoryError(errMsg);
        setStage(S.MCQ);
        return;
      }

      let stories = data.stories;
      while (stories.length < 2) stories.push(stories[0]);
      stories = stories.slice(0, 2).map(s => ({
        ...s,
        prompts: s.prompts?.length >= filledScenes.length
          ? s.prompts.slice(0, filledScenes.length)
          : Array(filledScenes.length).fill(s.tagline || 'Cinematic shot'),
      }));

      consumeCredit();
      setStoryProposals(stories);
      setStage(S.STORIES);

    } catch(e) {
      setStoryError(e.message);
      setStage(S.MCQ);
    }
  };

  const [selectedStory, setSelectedStory] = useState(null);

  const handleStorySelect = async (story) => {
    setSelectedStory(story);
    setStage(S.PROCESSING);
    setProcessingStatus('Generating your video prompts…');
    setProcessingSubstatus(`Building ${filledScenes.length} cinematic prompts for "${story.title}"`);

    try {
      const images = filledScenes.map((img, i) => ({
        index: i, base64: img.split(',')[1], media_type: 'image/jpeg',
      }));

      const res = await fetch(ENDPOINTS.generatePrompts, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_token: tokenData.token,
          session_id: 'sess_' + Date.now(),
          scene_count: filledScenes.length,
          images,
          story: {
            title: story.title,
            tagline: story.tagline,
            script: story.script,
            vibes: story.vibes,
            musicVibe: story.musicVibe,
            journey: story.journey,
          },
        }),
      });

      const rawText = await res.text();
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      let data;
      try { data = JSON.parse(rawText); }
      catch(e) { throw new Error('Invalid response from server'); }

      if (!data.success || !data.prompts) {
        throw new Error(data.error || 'Prompt generation failed');
      }

      setResult({
        storyTitle: story.title,
        tagline: story.tagline,
        script: story.script,
        musicVibe: story.musicVibe,
        prompts: data.prompts,
        caption: data.caption,
        hashtags: data.hashtags,
      });
      setStage(S.PROMPTS);

    } catch(e) {
      alert('Prompt generation failed: ' + e.message);
      setStage(S.STORIES);
    }
  };

  const reset = () => {
    setStage(S.DASHBOARD);
    setScenes([null,null,null,null,null]);
    setQuestions([]);
    setStoryProposals([]);
    setResult(null);
    setVideoUrls([]);
  };

  if (stage === S.TOKEN) return <TokenEntry onActivate={saveToken} />;
  if (stage === S.DASHBOARD) return <Dashboard tokenData={tokenData} onStart={() => setStage(S.UPLOAD)} onLogout={logout} />;
  if (stage === S.PROCESSING) return <ProcessingStage status={processingStatus} sub={processingSubstatus} />;
  if (stage === S.UPLOAD) return <UploadStage scenes={scenes} onScenesChange={setScenes} onAnalyze={handleAnalyze} tokenData={tokenData} />;
  if (stage === S.MCQ) return <MCQStage questions={questions} sceneCount={filledScenes.length} onComplete={handleMCQComplete} error={storyError} onRetry={() => lastAnswers && generateStories(lastAnswers, lastFreeTexts)} />;
  if (stage === S.STORIES) return <StoriesStage stories={storyProposals} sceneCount={filledScenes.length} onSelect={handleStorySelect} onBack={() => setStage(S.MCQ)} />;
  if (stage === S.PROMPTS) return <PromptsStage result={result} scenes={scenes} onRender={(r) => { setResult(r); setStage(S.RENDER); }} onBack={() => setStage(S.STORIES)} />;
  if (stage === S.RENDER) return <RenderStage result={result} scenes={scenes} tokenData={tokenData} onComplete={(renderResult) => { setVideoUrls(renderResult); setStage(S.VIDEO_PREVIEW); }} onError={() => setStage(S.PROMPTS)} />;
  if (stage === S.VIDEO_PREVIEW) return <VideoPreviewStage result={result} scenes={scenes} videoUrls={videoUrls} onSchedule={() => setStage(S.SCHEDULE)} onRedo={reset} />;
  if (stage === S.SCHEDULE) return <ScheduleStage result={result} onBack={() => setStage(S.VIDEO_PREVIEW)} onScheduled={(dt) => { alert(`Scheduled for ${dt}!`); reset(); }} />;

  return null;
}
