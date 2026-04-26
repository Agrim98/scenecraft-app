import { useState, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
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
  if (!res.ok) throw new Error(data.error?.message || 'Claude API error');
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

// ── Stages ────────────────────────────────────────────────────────────────────
const S = {
  UPLOAD: 'upload',
  MCQ: 'mcq',
  STORIES: 'stories',
  PROCESSING: 'processing',
  READY: 'ready',
  PUBLISH: 'publish',
};

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#080808',
  surface: '#111',
  surface2: '#1a1a1a',
  border: '#222',
  accent: '#E8FF47',
  accentDim: 'rgba(232,255,71,0.1)',
  text: '#F0F0F0',
  muted: '#666',
  sub: '#999',
  green: '#4ADE80',
  red: '#FF6B6B',
  blue: '#60A5FA',
  orange: '#FB923C',
  ig: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; }
  button:active { opacity: 0.8; transform: scale(0.98); }
  input[type=file] { display: none; }
  textarea { font-family: 'DM Sans', sans-serif; }
`;

// ── Token Setup ───────────────────────────────────────────────────────────────
function TokenSetup({ onSave }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!token.trim().startsWith('SC-')) { setError('Invalid token — must start with SC-'); return; }
    const parts = token.trim().split('-');
    const credits = parseInt(parts[1]);
    if (isNaN(credits) || credits <= 0) { setError('Token has no credits'); return; }
    onSave({ token: token.trim(), credits, usedCredits: 0 });
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{css}</style>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎬</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.text, marginBottom:8 }}>SceneCraft</div>
          <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>AI-powered 30-second Instagram ad generator</div>
        </div>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:C.muted, textTransform:'uppercase', marginBottom:8 }}>Access Token</div>
        <input
          style={{ width:'100%', background:C.surface2, border:`1.5px solid ${C.border}`, borderRadius:12, padding:'14px 16px', fontSize:15, color:C.text, outline:'none', fontFamily:'monospace', letterSpacing:1, marginBottom: error ? 8 : 20 }}
          placeholder="SC-10-XXXXXXXX"
          value={token}
          onChange={e => { setToken(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && validate()}
        />
        {error && <div style={{ fontSize:13, color:C.red, marginBottom:16, padding:'10px 14px', background:'rgba(255,107,107,0.08)', borderRadius:8 }}>{error}</div>}
        <button onClick={validate} style={{ width:'100%', padding:'15px 0', background:C.accent, color:'#000', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',sans-serif" }}>
          Activate →
        </button>
        <div style={{ marginTop:16, fontSize:12, color:C.muted, textAlign:'center', lineHeight:1.7 }}>
          Format: <span style={{ color:C.text, fontFamily:'monospace' }}>SC-[credits]-[code]</span>
        </div>
      </div>
    </div>
  );
}

// ── Scene Upload ──────────────────────────────────────────────────────────────
function UploadStage({ scenes, onScenesChange, onAnalyze, credits }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef()];
  const filled = scenes.filter(Boolean).length;

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
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto' }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ padding:'20px 24px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:C.text, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.accent }} />
          SceneCraft
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:20, padding:'4px 12px', fontSize:12, color:C.muted }}>
          🎟️ <span style={{ fontWeight:700, color: credits > 5 ? C.accent : C.orange, marginLeft:4 }}>{credits}</span> credits
        </div>
      </div>

      <div style={{ padding:'28px 24px 100px' }}>
        {/* Title */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:C.text, marginBottom:6 }}>Build Your 30-sec Ad</div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>Upload up to 5 scenes. Claude will craft a linked story across all of them.</div>
        </div>

        {/* Scene grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:16 }}>
          {scenes.map((img, i) => (
            <div key={i} style={{ position:'relative' }}>
              <div
                onClick={() => !img && refs[i].current.click()}
                style={{
                  aspectRatio:'3/4', borderRadius:12,
                  background: img ? 'transparent' : C.surface,
                  border: img ? `1.5px solid ${C.border}` : `1.5px dashed ${C.border}`,
                  overflow:'hidden', cursor: img ? 'default' : 'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  transition:'border-color 0.2s',
                }}
              >
                {img ? (
                  <img src={img} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  <>
                    <div style={{ fontSize:20, color:C.muted, lineHeight:1 }}>+</div>
                    <div style={{ fontSize:9, color:C.muted, fontWeight:600, marginTop:4 }}>Scene {i+1}</div>
                  </>
                )}
              </div>
              {img && (
                <button
                  onClick={() => remove(i)}
                  style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:C.red, border:'none', color:'#fff', fontSize:10, cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}
                >×</button>
              )}
              <input ref={refs[i]} type="file" accept="image/*" onChange={e => handleFile(i, e.target.files[0])} />
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:28, fontSize:12 }}>
          <span style={{ color:C.muted }}>{filled} of 5 scenes added</span>
          <span style={{ color: filled === 5 ? C.green : C.accent, fontWeight:600 }}>
            {filled === 5 ? 'All scenes ready! 🎬' : `${5-filled} more to go`}
          </span>
        </div>

        {/* How it works */}
        <div style={{ background:C.surface, borderRadius:16, padding:20, marginBottom:24, border:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:C.text, marginBottom:14, letterSpacing:'0.05em' }}>HOW IT WORKS</div>
          {[
            { icon:'📸', title:'Upload 5 scenes', desc:'Photos become your 6-sec video clips' },
            { icon:'🧠', title:'Claude reads all images', desc:'Crafts one linked story across all scenes' },
            { icon:'🎬', title:'Pick your story', desc:'Choose from 3 AI-generated story directions' },
            { icon:'⚡', title:'Higgsfield renders', desc:'5 clips stitched into 30-sec 4K ad' },
            { icon:'📱', title:'Post to Instagram', desc:'Download or auto-publish with hashtags' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom: i < 4 ? 14 : 0, alignItems:'flex-start' }}>
              <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{item.title}</div>
                <div style={{ fontSize:12, color:C.muted }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {filled > 0 && (
          <button
            onClick={onAnalyze}
            disabled={credits < 1}
            style={{
              width:'100%', padding:'16px 0',
              background: credits < 1 ? C.muted : C.accent,
              color:'#000', border:'none', borderRadius:14,
              fontSize:15, fontWeight:700, cursor: credits < 1 ? 'not-allowed' : 'pointer',
              fontFamily:"'Syne',sans-serif", letterSpacing:'0.02em',
            }}
          >
            {filled === 1 ? '✦ Analyze 1 Scene & Build Story' : `✦ Analyze All ${filled} Scenes & Build Story`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Processing ────────────────────────────────────────────────────────────────
function ProcessingStage({ status, substatus }) {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`${css} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:56, height:56, borderRadius:'50%', border:`3px solid ${C.surface2}`, borderTop:`3px solid ${C.accent}`, animation:'spin 0.9s linear infinite', marginBottom:28 }} />
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:C.text, marginBottom:8, textAlign:'center' }}>{status}</div>
      {substatus && <div style={{ fontSize:13, color:C.accent, fontWeight:600, textAlign:'center' }}>{substatus}</div>}
      <div style={{ fontSize:12, color:C.muted, marginTop:8, textAlign:'center' }}>Claude is working across all your scenes</div>
    </div>
  );
}

// ── MCQ Stage ─────────────────────────────────────────────────────────────────
function MCQStage({ questions, sceneCount, onComplete }) {
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
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto' }}>
      <style>{css}</style>
      <div style={{ padding:'20px 24px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:C.text }}>• SceneCraft</div>
        <div style={{ fontSize:12, color:C.muted }}>{sceneCount} scenes loaded</div>
      </div>

      <div style={{ padding:'24px 24px 100px' }}>
        {/* Progress */}
        <div style={{ height:2, background:C.surface2, borderRadius:4, marginBottom:24, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:C.accent, borderRadius:4, transition:'width 0.4s ease' }} />
        </div>

        {/* Story context banner */}
        <div style={{ background:C.accentDim, border:`1px solid rgba(232,255,71,0.2)`, borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:12, color:C.sub, lineHeight:1.6, borderLeft:`3px solid ${C.accent}` }}>
          <span style={{ fontWeight:600, color:C.text }}>Claude studied all {sceneCount} scenes </span>
          — these questions are specific to what it saw in your images
        </div>

        {/* Question */}
        <div style={{ background:C.surface, borderRadius:18, padding:22, marginBottom:12, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:C.accent, textTransform:'uppercase', marginBottom:6 }}>{q.step}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:C.text, lineHeight:1.45, marginBottom: q.why_asking ? 8 : 18 }}>{q.question}</div>
          {q.why_asking && <div style={{ fontSize:11, color:C.muted, fontStyle:'italic', marginBottom:16, lineHeight:1.5 }}>💡 {q.why_asking}</div>}
          {q.type === 'multi' && <div style={{ fontSize:11, color:C.muted, textAlign:'right', marginBottom:10 }}>Pick up to 2</div>}
          {q.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              style={{
                width:'100%', padding:'13px 14px', marginBottom:8,
                background: isSelected(opt.value) ? 'rgba(232,255,71,0.08)' : C.surface2,
                border: `1.5px solid ${isSelected(opt.value) ? C.accent : C.border}`,
                borderRadius:11, color: isSelected(opt.value) ? C.accent : C.text,
                fontSize:13, fontWeight:500, cursor:'pointer',
                textAlign:'left', display:'flex', alignItems:'flex-start', gap:11, lineHeight:1.4,
                transition:'all 0.15s',
              }}
            >
              <span style={{ fontSize:18, flexShrink:0 }}>{opt.emoji}</span>
              <div>
                <div>{opt.label}</div>
                {opt.sublabel && <div style={{ fontSize:11, color: isSelected(opt.value) ? 'rgba(232,255,71,0.6)' : C.muted, marginTop:2 }}>{opt.sublabel}</div>}
              </div>
            </button>
          ))}
        </div>

        <button
          disabled={!canNext}
          onClick={() => {
            if (current < questions.length - 1) setCurrent(current + 1);
            else onComplete(answers);
          }}
          style={{
            width:'100%', padding:'15px 0',
            background: canNext ? C.accent : C.surface2,
            color: canNext ? '#000' : C.muted,
            border:'none', borderRadius:13,
            fontSize:15, fontWeight:700, cursor: canNext ? 'pointer' : 'not-allowed',
            fontFamily:"'Syne',sans-serif",
          }}
        >
          {current < questions.length - 1 ? 'Next →' : 'Generate My Story Options ✦'}
        </button>
      </div>
    </div>
  );
}

// ── Story Proposals ───────────────────────────────────────────────────────────
function StoriesStage({ stories, scenes, onSelect }) {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto' }}>
      <style>{css}</style>
      <div style={{ padding:'20px 24px 16px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:C.text, marginBottom:4 }}>• SceneCraft</div>
        <div style={{ fontSize:12, color:C.muted }}>Choose your story direction</div>
      </div>

      <div style={{ padding:'24px 24px 120px' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:C.text, marginBottom:6 }}>3 Story Directions</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:24, lineHeight:1.6 }}>
          Claude crafted these based on all {scenes} scenes. Pick the one that fits your brand.
        </div>

        {stories.map((story, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            style={{
              width:'100%', textAlign:'left', cursor:'pointer',
              background: selected === i ? 'rgba(232,255,71,0.06)' : C.surface,
              border: `2px solid ${selected === i ? C.accent : C.border}`,
              borderRadius:18, padding:20, marginBottom:14,
              transition:'all 0.2s',
            }}
          >
            {/* Story header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color: selected === i ? C.accent : C.muted, textTransform:'uppercase', marginBottom:4 }}>
                  Story {String.fromCharCode(65+i)}
                </div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800, color:C.text }}>{story.title}</div>
              </div>
              <div style={{
                width:24, height:24, borderRadius:'50%',
                border: `2px solid ${selected === i ? C.accent : C.border}`,
                background: selected === i ? C.accent : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                {selected === i && <div style={{ width:8, height:8, borderRadius:'50%', background:'#000' }} />}
              </div>
            </div>

            {/* Tagline */}
            <div style={{ fontSize:13, color:C.sub, fontStyle:'italic', marginBottom:14, lineHeight:1.5 }}>
              "{story.tagline}"
            </div>

            {/* Scene arc */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:8 }}>Scene Arc</div>
              <div style={{ display:'flex', gap:4 }}>
                {story.arc.map((beat, j) => (
                  <div key={j} style={{ flex:1, background:C.surface2, borderRadius:6, padding:'6px 4px', textAlign:'center' }}>
                    <div style={{ fontSize:14, marginBottom:2 }}>{beat.emoji}</div>
                    <div style={{ fontSize:9, color:C.muted, fontWeight:600 }}>{beat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vibe tags */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {story.vibes.map(v => (
                <span key={v} style={{ fontSize:11, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:20, padding:'3px 10px', color:C.muted }}>
                  {v}
                </span>
              ))}
            </div>
          </button>
        ))}

        <button
          disabled={selected === null}
          onClick={() => onSelect(stories[selected])}
          style={{
            width:'100%', padding:'16px 0', marginTop:8,
            background: selected !== null ? C.accent : C.surface2,
            color: selected !== null ? '#000' : C.muted,
            border:'none', borderRadius:14,
            fontSize:15, fontWeight:700,
            cursor: selected !== null ? 'pointer' : 'not-allowed',
            fontFamily:"'Syne',sans-serif",
          }}
        >
          {selected !== null ? `Use Story ${String.fromCharCode(65+selected)} → Generate Prompts` : 'Select a story direction'}
        </button>
      </div>
    </div>
  );
}

// ── Ready Stage ───────────────────────────────────────────────────────────────
function ReadyStage({ result, scenes, onPublish, onRedo }) {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto' }}>
      <style>{css}</style>
      <div style={{ padding:'20px 24px 16px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:C.text }}>• SceneCraft</div>
      </div>

      <div style={{ padding:'24px 24px 100px' }}>
        {/* Success header */}
        <div style={{ textAlign:'center', marginBottom:28, animation:'slideUp 0.5s ease' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✦</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:C.text, marginBottom:6 }}>Prompts Ready!</div>
          <div style={{ fontSize:13, color:C.muted }}>Ready to send to Higgsfield for video rendering</div>
        </div>

        {/* Scene thumbnails */}
        <div style={{ display:'flex', gap:6, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
          {scenes.filter(Boolean).map((img, i) => (
            <img key={i} src={img} style={{ width:64, height:80, objectFit:'cover', borderRadius:10, flexShrink:0, border:`1px solid ${C.border}` }} />
          ))}
        </div>

        {/* Story title */}
        <div style={{ background:C.surface, borderRadius:16, padding:18, marginBottom:14, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:C.accent, textTransform:'uppercase', marginBottom:6 }}>Story Direction</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:C.text, marginBottom:4 }}>{result.storyTitle}</div>
          <div style={{ fontSize:12, color:C.muted, fontStyle:'italic' }}>"{result.tagline}"</div>
        </div>

        {/* Scene prompts */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:10 }}>Higgsfield Prompts</div>
          {result.prompts.map((p, i) => (
            <div key={i} style={{ background:C.surface, borderRadius:12, padding:'12px 14px', marginBottom:8, border:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.accent, background:C.accentDim, padding:'2px 8px', borderRadius:20, flexShrink:0, marginTop:2 }}>
                  Clip {i+1}
                </div>
                <div style={{ fontSize:12, color:C.sub, lineHeight:1.6 }}>{p}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Caption & hashtags */}
        <div style={{ background:C.surface, borderRadius:16, padding:18, marginBottom:14, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:C.accent, textTransform:'uppercase', marginBottom:8 }}>Caption</div>
          <div style={{ fontSize:13, color:C.text, lineHeight:1.7, marginBottom:12 }}>{result.caption}</div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:C.muted, textTransform:'uppercase', marginBottom:6 }}>Hashtags</div>
          <div style={{ fontSize:12, color:C.blue, lineHeight:1.8 }}>{result.hashtags}</div>
        </div>

        {/* Music suggestion */}
        {result.musicVibe && (
          <div style={{ background:'rgba(96,165,250,0.06)', border:`1px solid rgba(96,165,250,0.15)`, borderRadius:12, padding:'12px 14px', marginBottom:20 }}>
            <span style={{ fontSize:12, color:C.blue }}>🎵 Music vibe: <span style={{ fontWeight:600 }}>{result.musicVibe}</span></span>
          </div>
        )}

        {/* Action buttons */}
        <button
          onClick={onPublish}
          style={{ width:'100%', padding:'16px 0', background:C.ig, color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',sans-serif", marginBottom:10 }}
        >
          📸 Publish to Instagram
        </button>
        <button
          style={{ width:'100%', padding:'14px 0', background:'transparent', color:C.text, border:`1.5px solid ${C.border}`, borderRadius:14, fontSize:14, fontWeight:500, cursor:'pointer', marginBottom:10 }}
        >
          ⬇️ Download Prompts
        </button>
        <button
          onClick={onRedo}
          style={{ width:'100%', padding:'14px 0', background:'transparent', color:C.muted, border:`1.5px solid ${C.border}`, borderRadius:14, fontSize:14, fontWeight:500, cursor:'pointer' }}
        >
          ← Start Over
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tokenData, setTokenData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sc_token') || 'null'); } catch(e) { return null; }
  });
  const [stage, setStage] = useState(S.UPLOAD);
  const [scenes, setScenes] = useState([null, null, null, null, null]);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingSubstatus, setProcessingSubstatus] = useState('');
  const [questions, setQuestions] = useState([]);
  const [storyProposals, setStoryProposals] = useState([]);
  const [result, setResult] = useState(null);

  const saveToken = (data) => {
    try { localStorage.setItem('sc_token', JSON.stringify(data)); } catch(e) {}
    setTokenData(data);
  };

  const consumeCredit = () => {
    const updated = { ...tokenData, usedCredits: tokenData.usedCredits + 1 };
    try { localStorage.setItem('sc_token', JSON.stringify(updated)); } catch(e) {}
    setTokenData(updated);
  };

  const creditsLeft = tokenData ? tokenData.credits - tokenData.usedCredits : 0;
  const filledScenes = scenes.filter(Boolean);

  // ── Step 1: Send ALL scenes to n8n → Claude generates image-specific MCQs ──
  const handleAnalyze = async () => {
    if (filledScenes.length === 0) return;
    setStage(S.PROCESSING);
    setProcessingStatus('Reading all your scenes…');
    setProcessingSubstatus('Claude is studying every detail');

    try {
      setProcessingSubstatus('Sending all scenes to server…');

      // Send ALL images as base64 array to n8n
      const images = filledScenes.map((img, i) => ({
        index: i,
        base64: img.split(',')[1],
        media_type: 'image/jpeg',
      }));

      let res;
      try {
        res = await fetch(ENDPOINTS.analyze, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_token: tokenData.token,
            session_id: 'sess_' + Date.now(),
            scene_count: filledScenes.length,
            images, // array of all images
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

      if (!data.success || !data.questions) throw new Error(data.error || 'No questions returned');

      setQuestions(data.questions);
      setStage(S.MCQ);
    } catch(e) {
      alert('Analysis failed: ' + e.message);
      setStage(S.UPLOAD);
    }
  };

  // ── Step 2: Send answers + all scenes to n8n → 3 story proposals ──
  const handleMCQComplete = async (answers) => {
    setStage(S.PROCESSING);
    setProcessingStatus('Crafting your story directions…');
    setProcessingSubstatus('Claude is building 3 unique narratives');

    try {
      // Map answers to human-readable labels
      const answerLabels = {};
      Object.entries(answers).forEach(([qid, val]) => {
        const q = questions.find(q => q.id === qid);
        if (!q) return;
        const valArr = Array.isArray(val) ? val : [val];
        const selected = q.options.filter(o => valArr.includes(o.value));
        answerLabels[qid] = selected.map(o => o.label).join(', ');
      });

      const images = filledScenes.map((img, i) => ({
        index: i,
        base64: img.split(',')[1],
        media_type: 'image/jpeg',
      }));

      let res;
      try {
        res = await fetch(ENDPOINTS.buildPrompt, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_token: tokenData.token,
            session_id: 'sess_' + Date.now(),
            scene_count: filledScenes.length,
            images,
            answers,
            answer_labels: answerLabels,
            questions,
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

      if (!data.success || !data.stories) throw new Error(data.error || 'No stories returned');

      let stories = data.stories;
      // Ensure exactly 3
      while (stories.length < 3) stories.push(stories[0]);
      stories = stories.slice(0, 3);
      // Ensure prompts array matches scene count
      stories = stories.map(s => ({
        ...s,
        prompts: s.prompts?.length >= filledScenes.length
          ? s.prompts.slice(0, filledScenes.length)
          : Array(filledScenes.length).fill(s.tagline || 'Cinematic shot')
      }));

      consumeCredit();
      setStoryProposals(stories);
      setStage(S.STORIES);
    } catch(e) {
      alert('Story generation failed: ' + e.message);
      setStage(S.MCQ);
    }
  };

  // ── Step 3: User picks story → generate final result ──
  const handleStorySelect = (story) => {
    setResult({
      storyTitle: story.title,
      tagline: story.tagline,
      prompts: story.prompts,
      caption: story.caption,
      hashtags: story.hashtags,
      musicVibe: story.musicVibe,
    });
    setStage(S.READY);
  };

  const reset = () => {
    setStage(S.UPLOAD);
    setScenes([null, null, null, null, null]);
    setQuestions([]);
    setStoryProposals([]);
    setResult(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!tokenData) return <TokenSetup onSave={saveToken} />;

  if (stage === S.PROCESSING) return <ProcessingStage status={processingStatus} substatus={processingSubstatus} />;

  if (stage === S.MCQ) return (
    <MCQStage
      questions={questions}
      sceneCount={filledScenes.length}
      onComplete={handleMCQComplete}
    />
  );

  if (stage === S.STORIES) return (
    <StoriesStage
      stories={storyProposals}
      scenes={filledScenes.length}
      onSelect={handleStorySelect}
    />
  );

  if (stage === S.READY) return (
    <ReadyStage
      result={result}
      scenes={scenes}
      onPublish={() => alert('Instagram API coming in Phase 3!')}
      onRedo={reset}
    />
  );

  return (
    <UploadStage
      scenes={scenes}
      onScenesChange={setScenes}
      onAnalyze={handleAnalyze}
      credits={creditsLeft}
    />
  );
}
