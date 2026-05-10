import { useState, useRef, useEffect } from "react";

// =============================================================================
// CONFIG
// =============================================================================
const N8N_BASE = "/api";
const CLIENT_TOKEN = "SC-100";

// =============================================================================
// POLLING HOOK
// =============================================================================
const MAX_POLL_ATTEMPTS = 90;

const usePollJob = (job_id, onComplete, onFail) => {
  const intervalRef = useRef(null);
  const attemptsRef = useRef(0);
  useEffect(() => {
    if (!job_id) return;
    attemptsRef.current = 0;
    intervalRef.current = setInterval(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        clearInterval(intervalRef.current);
        onFail("Generation timed out — please try again.");
        return;
      }
      try {
        const r = await fetch(`${N8N_BASE}/scenecraft/status?job_id=${encodeURIComponent(job_id)}`);
        const data = await r.json();
        if (data.status === "complete" && data.download_url) {
          clearInterval(intervalRef.current);
          onComplete(data);
        } else if (data.status === "failed") {
          clearInterval(intervalRef.current);
          onFail("Generation failed. Please try again.");
        }
      } catch (e) {
        console.warn("Poll error:", e.message);
      }
    }, 8000);
    return () => clearInterval(intervalRef.current);
  }, [job_id]);
};

// =============================================================================
// THEME
// =============================================================================
const theme = {
  bg: "#0A0A08", surface: "#111110", surfaceAlt: "#181816",
  border: "#2A2A26", borderLight: "#3A3A35",
  gold: "#C9A84C", goldLight: "#E2C97E", goldDim: "#8A6E2F",
  cream: "#F5F0E8", creamDim: "#B8B0A0", muted: "#6B6860",
  white: "#FFFFFF", danger: "#C0392B",
};

const styles = {
  app: { minHeight: "100vh", background: theme.bg, fontFamily: "'Cormorant Garamond', Georgia, serif", color: theme.cream, position: "relative", overflow: "hidden" },
  container: { maxWidth: 820, margin: "0 auto", padding: "0 24px 80px", position: "relative", zIndex: 1 },
  header: { textAlign: "center", paddingTop: 64, paddingBottom: 48, borderBottom: `1px solid ${theme.border}`, marginBottom: 56 },
  logoMark: { width: 48, height: 48, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" },
  headline: { fontSize: 13, letterSpacing: "0.35em", textTransform: "uppercase", color: theme.gold, marginBottom: 16 },
  title: { fontSize: 52, fontWeight: 300, letterSpacing: "0.04em", color: theme.cream, margin: 0, lineHeight: 1.1 },
  subtitle: { fontSize: 16, color: theme.muted, marginTop: 12, letterSpacing: "0.08em", fontStyle: "italic" },
  stageLabel: { fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: theme.goldDim, marginBottom: 8 },
  sectionTitle: { fontSize: 28, fontWeight: 300, color: theme.cream, margin: "0 0 6px", letterSpacing: "0.03em" },
  sectionSub: { fontSize: 14, color: theme.muted, marginBottom: 32, letterSpacing: "0.05em" },
  card: { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 2, padding: 32, marginBottom: 16 },
  uploadZone: { border: `1px dashed ${theme.borderLight}`, borderRadius: 2, padding: "40px", textAlign: "center", cursor: "pointer", transition: "all 0.3s ease", background: "transparent" },
  uploadZoneHover: { border: `1px dashed ${theme.gold}`, background: "rgba(201,168,76,0.04)" },
  uploadText: { fontSize: 15, color: theme.creamDim, marginBottom: 6, letterSpacing: "0.05em" },
  uploadSub: { fontSize: 12, color: theme.muted, letterSpacing: "0.08em", textTransform: "uppercase" },
  thumbsGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 16 },
  thumb: { position: "relative", aspectRatio: "9/16", border: `1px solid ${theme.border}`, borderRadius: 2, overflow: "hidden", background: theme.surfaceAlt },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  thumbBadge: { position: "absolute", top: 4, left: 4, background: theme.gold, color: "#0A0A08", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 2 },
  thumbRemove: { position: "absolute", top: 4, right: 4, background: "rgba(10,10,8,0.85)", color: theme.cream, border: "none", width: 20, height: 20, borderRadius: "50%", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" },
  mcqQuestion: { marginBottom: 32 },
  questionNum: { fontSize: 11, letterSpacing: "0.3em", color: theme.goldDim, textTransform: "uppercase", marginBottom: 8 },
  questionText: { fontSize: 18, fontWeight: 300, color: theme.cream, marginBottom: 6, letterSpacing: "0.02em", lineHeight: 1.4 },
  questionHint: { fontSize: 12, color: theme.muted, marginBottom: 16, letterSpacing: "0.04em", fontStyle: "italic" },
  optionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  option: { padding: "12px 16px", border: `1px solid ${theme.border}`, borderRadius: 2, background: "transparent", color: theme.creamDim, fontSize: 13, cursor: "pointer", textAlign: "left", letterSpacing: "0.04em", fontFamily: "inherit", transition: "all 0.2s ease", lineHeight: 1.3 },
  optionSelected: { border: `1px solid ${theme.gold}`, background: "rgba(201,168,76,0.08)", color: theme.goldLight },
  divider: { height: 1, background: theme.border, margin: "32px 0" },
  voiceToggle: { display: "flex", gap: 12 },
  toggleBtn: { flex: 1, padding: "14px", border: `1px solid ${theme.border}`, borderRadius: 2, background: "transparent", color: theme.creamDim, fontSize: 13, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "inherit", textAlign: "center" },
  toggleBtnSelected: { border: `1px solid ${theme.gold}`, background: "rgba(201,168,76,0.08)", color: theme.goldLight },
  primaryBtn: { width: "100%", padding: "18px", background: theme.gold, border: "none", borderRadius: 2, color: "#0A0A08", fontSize: 13, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", marginTop: 8 },
  primaryBtnDisabled: { background: theme.border, color: theme.muted, cursor: "not-allowed" },
  secondaryBtn: { padding: "12px 24px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 2, color: theme.creamDim, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" },
  loadingWrap: { textAlign: "center", padding: "64px 0" },
  loadingTitle: { fontSize: 22, fontWeight: 300, color: theme.cream, marginBottom: 10, letterSpacing: "0.05em" },
  loadingSubtitle: { fontSize: 13, color: theme.muted, letterSpacing: "0.1em" },
  storyCard: { background: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: 2, padding: 28, marginBottom: 16, cursor: "pointer", transition: "all 0.2s ease" },
  storyCardSelected: { border: `1px solid ${theme.gold}`, background: "rgba(201,168,76,0.05)" },
  storyTitle: { fontSize: 22, fontWeight: 400, color: theme.cream, marginBottom: 4, letterSpacing: "0.02em" },
  storyTagline: { fontSize: 13, color: theme.gold, fontStyle: "italic", marginBottom: 12, letterSpacing: "0.05em" },
  storyDesc: { fontSize: 14, color: theme.creamDim, lineHeight: 1.6, marginBottom: 16 },
  storyMeta: { display: "flex", gap: 16, fontSize: 11, color: theme.muted, letterSpacing: "0.15em", textTransform: "uppercase" },
  sceneCard: { background: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: 2, padding: 24, marginBottom: 16 },
  sceneHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  sceneNum: { width: 28, height: 28, borderRadius: "50%", border: `1px solid ${theme.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: theme.gold, flexShrink: 0 },
  sceneTitle: { fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: theme.gold },
  sceneTech: { fontSize: 11, color: theme.muted, marginTop: 2, letterSpacing: "0.1em" },
  fieldLabel: { fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: theme.muted, marginBottom: 8, display: "block" },
  textarea: { width: "100%", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 2, padding: "12px 14px", color: theme.cream, fontSize: 14, fontFamily: "inherit", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" },
  refImgRow: { display: "flex", gap: 8, marginBottom: 12 },
  refImgChip: { width: 40, height: 56, border: `1px solid ${theme.border}`, borderRadius: 2, overflow: "hidden", cursor: "pointer", opacity: 0.4, transition: "all 0.2s" },
  refImgChipActive: { border: `1px solid ${theme.gold}`, opacity: 1 },
  refImgChipImg: { width: "100%", height: "100%", objectFit: "cover" },
  hashtagsWrap: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 },
  hashtag: { fontSize: 12, color: theme.gold, background: "rgba(201,168,76,0.08)", border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 2, padding: "4px 10px", letterSpacing: "0.05em" },
  actionRow: { display: "flex", gap: 12, marginTop: 32 },
  errorBox: { background: "rgba(192,57,43,0.1)", border: `1px solid rgba(192,57,43,0.3)`, borderRadius: 2, padding: "14px 16px", fontSize: 13, color: "#E57368", letterSpacing: "0.03em", marginBottom: 16 },
  successCard: { background: "rgba(201,168,76,0.06)", border: `1px solid rgba(201,168,76,0.3)`, borderRadius: 2, padding: 32, textAlign: "center" },
  successTitle: { fontSize: 32, fontWeight: 300, color: theme.goldLight, marginBottom: 8, letterSpacing: "0.04em" },
  successSub: { fontSize: 14, color: theme.muted, letterSpacing: "0.08em", marginBottom: 24 },
  videoFrame: { width: "100%", maxWidth: 360, aspectRatio: "9/16", margin: "0 auto", border: `1px solid ${theme.border}`, borderRadius: 2, background: "#000", display: "block" },
  stepIndicator: { display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 48 },
  stepDot: { width: 8, height: 8, borderRadius: "50%", background: theme.border, transition: "all 0.3s ease" },
  stepDotActive: { background: theme.gold, width: 24, borderRadius: 4 },
  stepDotDone: { background: theme.goldDim },
  stepLine: { width: 32, height: 1, background: theme.border },
  badge: { fontSize: 10, letterSpacing: "0.2em", color: theme.gold, background: "rgba(201,168,76,0.1)", border: `1px solid rgba(201,168,76,0.3)`, padding: "3px 8px", borderRadius: 2, textTransform: "uppercase", marginLeft: 8 },

  // ── NEW: Voiceover role card styles ──────────────────────────────────────
  voiceRoleGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 4 },
  voiceRoleCard: {
    padding: "16px 20px", border: `1px solid ${theme.border}`, borderRadius: 2,
    background: "transparent", color: theme.creamDim, fontSize: 14,
    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
    transition: "all 0.2s ease", lineHeight: 1.4,
  },
  voiceRoleCardSelected: {
    border: `1px solid ${theme.gold}`, background: "rgba(201,168,76,0.06)", color: theme.cream,
  },
  voiceRoleLabel: { fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.gold, marginBottom: 3 },
  voiceRoleDesc: { fontSize: 13, color: theme.creamDim, letterSpacing: "0.02em" },
  voiceRoleTiming: { fontSize: 11, color: theme.muted, marginTop: 4, letterSpacing: "0.05em", fontStyle: "italic" },
  // ─────────────────────────────────────────────────────────────────────────
};

// =============================================================================
// VOICEOVER ROLE OPTIONS
// =============================================================================
const VOICEOVER_ROLES = [
  {
    value: "hook",
    label: "Open with a Hook",
    desc: "A cinematic spoken line plays over the first 10 seconds — grabs attention instantly",
    timing: "Voiceover: 0s – 10s · Music continues beneath for the full video",
  },
  {
    value: "cta",
    label: "Close with a CTA",
    desc: "Music plays through the film, then a call-to-action voice drops in the final 10 seconds",
    timing: "Voiceover: last 10s · Pure cinematic music for the first 30s",
  },
  {
    value: "narrate",
    label: "Narrate the Full Story",
    desc: "A continuous voiceover guides the viewer through all 5 scenes from open to close",
    timing: "Voiceover: full 40s · Music plays softly beneath throughout",
  },
];

// =============================================================================
// MCQ
// =============================================================================
const MCQ_QUESTIONS = [
  {
    id: "purpose", label: "01 — The Purpose",
    text: "What is this video for?",
    hint: "Pick one or more — multiple purposes create a richer multi-angle story",
    options: ["General promotion", "Food showcase", "Event promotion", "Bar / cocktails", "Chef spotlight"],
  },
  {
    id: "occasion", label: "02 — The Occasion",
    text: "Is there a specific occasion?",
    hint: "Pick one or more — multiple occasions build richer context",
    options: ["Regular service", "Birthday / celebration", "Live music night", "Special menu", "Grand opening"],
  },
  {
    id: "subject", label: "03 — The Subject",
    text: "What are the primary subjects of this story?",
    hint: "Pick one or more — multiple subjects build a richer narrative",
    options: ["Signature dish / plated food", "Chef in action / kitchen", "Venue, space & ambience", "Bar, cocktails & drinks", "Event setup / celebration", "Suite / room interior", "Pool / spa / wellness", "Exterior / location"],
  },
  {
    id: "story", label: "04 — The Story",
    text: "What story should this ad tell?",
    hint: "Combine angles for a layered Hollywood-style script",
    options: ["Come celebrate your moments here", "Experience world-class cuisine", "Meet the craft behind the kitchen", "This is what luxury feels like", "A memory you will never forget", "Escape the ordinary", "Discover hidden craftsmanship"],
  },
  {
    id: "light", label: "05 — The Light",
    text: "Which light & time captures the soul?",
    hint: "Mixing times creates dynamic story arcs",
    options: ["Golden hour — warm & glowing", "Candlelit evening — intimate & moody", "Bright airy daytime — fresh & inviting", "Dramatic night — dark & cinematic", "Sunrise — quiet & aspirational", "Blue hour — magical twilight"],
  },
  {
    id: "audience", label: "06 — The Audience",
    text: "Who are you speaking to?",
    hint: "Multi-audience selection broadens emotional appeal",
    options: ["Couples — romance & intimacy", "Corporate — prestige & events", "Food lovers — passion & discovery", "Families — warmth & occasion", "Luxury travellers — exclusivity", "Wellness seekers — calm & restoration"],
  },
  {
    id: "detail", label: "07 — The Detail",
    text: "Which close-up details deserve cinematic moments?",
    hint: "Pick multiple hero details — each gets its own scene",
    options: ["Texture & colour of the food", "Steam, flame & heat in motion", "The chef's hands at work", "The pour — sauce, wine, cocktail", "Plating, garnish & finishing", "Architectural detail / material", "Light through glass / water ripple"],
  },
];

// =============================================================================
// ICONS
// =============================================================================
const UploadIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="28" width="32" height="12" rx="1" stroke="#C9A84C" strokeWidth="1" fill="none"/>
    <path d="M24 8 L24 28 M16 16 L24 8 L32 16" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const LogoMark = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="4" width="40" height="40" rx="2" stroke="#C9A84C" strokeWidth="0.75" fill="none"/>
    <rect x="10" y="10" width="28" height="28" rx="1" stroke="#C9A84C" strokeWidth="0.5" fill="none"/>
    <circle cx="24" cy="24" r="6" stroke="#C9A84C" strokeWidth="1" fill="none"/>
    <circle cx="24" cy="24" r="2" fill="#C9A84C"/>
  </svg>
);
const Spinner = () => (
  <div style={{ display: "inline-block", width: 32, height: 32, marginBottom: 20 }}>
    <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation: "spin 1.5s linear infinite" }}>
      <circle cx="16" cy="16" r="13" stroke={theme.border} strokeWidth="1.5" fill="none"/>
      <path d="M16 3 A13 13 0 0 1 29 16" stroke={theme.gold} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  </div>
);

// =============================================================================
// STEP INDICATOR
// =============================================================================
const StepIndicator = ({ current }) => (
  <div style={styles.stepIndicator}>
    {[0, 1, 2, 3, 4, 5].map((s, i) => (
      <div key={s} style={{ display: "flex", alignItems: "center" }}>
        <div style={{
          ...styles.stepDot,
          ...(current === s ? styles.stepDotActive : {}),
          ...(current > s ? styles.stepDotDone : {}),
        }}/>
        {i < 5 && <div style={styles.stepLine}/>}
      </div>
    ))}
  </div>
);

// =============================================================================
// HELPERS
// =============================================================================
const fileToBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = (e) => res({
    base64: e.target.result.split(",")[1],
    media_type: file.type,
    name: file.name,
    previewUrl: URL.createObjectURL(file),
  });
  r.onerror = rej;
  r.readAsDataURL(file);
});

const postJSON = async (path, body) => {
  const r = await fetch(`${N8N_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

// =============================================================================
// MAIN APP
// =============================================================================
export default function SceneCraftApp() {
  const [stage, setStage] = useState("upload");
  const [images, setImages] = useState([]);
  const [dragging, setDragging] = useState(false);

  const [mcqAnswers, setMcqAnswers] = useState({
    purpose: [], occasion: [], subject: [], story: [], light: [], audience: [], detail: [],
  });

  // ── UPDATED: voiceover is now an object { enabled, role } ──────────────────
  // role: "hook" | "cta" | "narrate" | null (when voiceover disabled)
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(null); // null = not chosen yet
  const [voiceoverRole, setVoiceoverRole] = useState(null);
  // ─────────────────────────────────────────────────────────────────────────

  const [stories, setStories] = useState(null);
  const [chosenStory, setChosenStory] = useState(null);
  const [promptsOutput, setPromptsOutput] = useState(null);
  const [editedScenes, setEditedScenes] = useState([]);
  const [editedCaption, setEditedCaption] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");
  const [error, setError] = useState(null);
  const [finalVideo, setFinalVideo] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [renderProgress, setRenderProgress] = useState(0);

  const fileRef = useRef();
  const stageIdx = { upload: 0, mcq: 1, loadingStories: 2, stories: 2, loadingPrompts: 3, review: 3, rendering: 4, done: 5 };

  usePollJob(
    jobId,
    (data) => {
      setFinalVideo({
        videoUrl: data.download_url,
        downloadUrl: data.download_url,
        sceneCount: 5,
        format: "9:16 Vertical",
        audioSource: voiceoverEnabled
          ? voiceoverRole === "hook" ? "Hook VO + Music"
          : voiceoverRole === "cta" ? "Music + CTA VO"
          : "Narration + Music"
          : "Music Only",
      });
      setStage("done");
      setJobId(null);
    },
    (errMsg) => {
      setError(errMsg);
      setStage("review");
      setJobId(null);
    }
  );

  useEffect(() => {
    if (stage !== "rendering") return;
    const stages = [
      { pct: 10, delay: 5000 },
      { pct: 20, delay: 15000 },
      { pct: 50, delay: 90000 },
      { pct: 75, delay: 180000 },
      { pct: 88, delay: 300000 },
      { pct: 95, delay: 420000 },
    ];
    const timers = stages.map(({ pct, delay }) => setTimeout(() => setRenderProgress(pct), delay));
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  // ---------------------------------------------------------------------------
  // IMAGE HANDLING
  // ---------------------------------------------------------------------------
  const handleFiles = async (fileList) => {
    const incoming = Array.from(fileList).filter(f => f.type.startsWith("image/"));
    const room = 5 - images.length;
    const accepted = incoming.slice(0, room);
    const processed = await Promise.all(accepted.map(fileToBase64));
    setImages(prev => [...prev, ...processed]);
  };
  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  // ---------------------------------------------------------------------------
  // MCQ
  // ---------------------------------------------------------------------------
  const toggleOption = (qid, opt) => {
    setMcqAnswers(prev => {
      const cur = prev[qid] || [];
      return { ...prev, [qid]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] };
    });
  };

  // ── UPDATED: mcqComplete checks voiceoverEnabled + role if enabled ─────────
  const mcqComplete = () => {
    const allAnswered = MCQ_QUESTIONS.every(q => (mcqAnswers[q.id] || []).length >= 1);
    if (!allAnswered) return false;
    if (voiceoverEnabled === null) return false;
    if (voiceoverEnabled === true && voiceoverRole === null) return false;
    return true;
  };
  // ─────────────────────────────────────────────────────────────────────────

  const buildMcqPayload = () => ({
    purpose: (mcqAnswers.purpose || []).join(' + ') || 'General promotion',
    occasion: (mcqAnswers.occasion || []).join(' + ') || 'Regular service',
    subject: mcqAnswers.subject.join(" + "),
    story: mcqAnswers.story.join(" + "),
    light: mcqAnswers.light.join(" + "),
    audience: mcqAnswers.audience.join(" + "),
    detail: mcqAnswers.detail.join(" + "),
  });

  // ---------------------------------------------------------------------------
  // API CALLS
  // ---------------------------------------------------------------------------
  const fetchStories = async () => {
    setStage("loadingStories");
    setError(null);
    try {
      const data = await postJSON("/scenecraft/stories", {
        client_token: CLIENT_TOKEN,
        images: images.map(i => ({ base64: i.base64, media_type: i.media_type })),
        mcq: buildMcqPayload(),
        purpose: (mcqAnswers.purpose || []).join(' + ') || 'General promotion',
        occasion: (mcqAnswers.occasion || []).join(' + ') || 'Regular service',
        voiceover: voiceoverEnabled,
        voiceover_role: voiceoverEnabled ? voiceoverRole : null,
      });
      if (!data.stories?.length) throw new Error("No stories returned");
      setStories(data.stories);
      setStage("stories");
    } catch (e) {
      setError(e.message || "Failed to generate stories");
      setStage("mcq");
    }
  };

  const fetchPrompts = async (story) => {
    setChosenStory(story);
    setStage("loadingPrompts");
    setError(null);
    try {
      const data = await postJSON("/scenecraft/prompts", {
        client_token: CLIENT_TOKEN,
        images: images.map(i => ({ base64: i.base64, media_type: i.media_type })),
        mcq: buildMcqPayload(),
        story,
        purpose: (mcqAnswers.purpose || []).join(' + ') || 'General promotion',
        occasion: (mcqAnswers.occasion || []).join(' + ') || 'Regular service',
        voiceover: voiceoverEnabled,
        voiceover_role: voiceoverEnabled ? voiceoverRole : null,
      });
      if (!data.prompts?.length) throw new Error("No prompts returned");
      setPromptsOutput(data);
      setEditedScenes(data.prompts.map(p => ({
        ...p,
        visual_prompt: p.visual_prompt,
        voiceover_line: p.voiceover_line || "",
        reference_image_index: p.reference_image_index ?? 0,
      })));
      setEditedCaption(data.instagram_caption || "");
      setEditedHashtags(data.hashtags || "");
      setStage("review");
    } catch (e) {
      setError(e.message || "Failed to generate prompts");
      setStage("stories");
    }
  };

  // ── UPDATED: render passes voiceover_role to n8n ──────────────────────────
  const startRender = async () => {
    setStage("rendering");
    setRenderProgress(0);
    setError(null);
    try {
      const data = await postJSON("/scenecraft/render", {
        client_token: CLIENT_TOKEN,
        images: images.map(i => ({ base64: i.base64, media_type: i.media_type })),
        scenes: editedScenes,
        voiceover: voiceoverEnabled,
        voiceover_role: voiceoverEnabled ? voiceoverRole : null,
        purpose: (mcqAnswers.purpose || []).join(' + ') || 'General promotion',
        occasion: (mcqAnswers.occasion || []).join(' + ') || 'Regular service',
        music_style: promptsOutput.music_style,
        story_title: chosenStory.title,
        sound_script: promptsOutput.sound_script || null,
      });
      if (!data.job_id) throw new Error("No job ID returned from render");
      setJobId(data.job_id);
    } catch (e) {
      setError(e.message || "Render failed");
      setStage("review");
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const updateScene = (idx, field, val) =>
    setEditedScenes(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));

  const reset = () => {
    setStage("upload");
    setImages([]);
    setMcqAnswers({ purpose: [], occasion: [], subject: [], story: [], light: [], audience: [], detail: [] });
    setVoiceoverEnabled(null);
    setVoiceoverRole(null);
    setStories(null);
    setChosenStory(null);
    setPromptsOutput(null);
    setEditedScenes([]);
    setEditedCaption("");
    setEditedHashtags("");
    setFinalVideo(null);
    setError(null);
    setJobId(null);
    setRenderProgress(0);
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        textarea:focus, input:focus { border-color: #C9A84C !important; }
        button:hover { opacity: 0.85; }
      `}</style>

      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logoMark}><LogoMark/></div>
          <div style={styles.headline}>Hospitality · Cinematic Reels</div>
          <h1 style={styles.title}>SceneCraft</h1>
          <p style={styles.subtitle}>9:16 Hollywood-grade hotel ads · 5 scenes · drone-cinematic</p>
        </div>

        <StepIndicator current={stageIdx[stage] || 0}/>

        {/* STAGE 1 — UPLOAD */}
        {stage === "upload" && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <div style={styles.stageLabel}>Stage 01</div>
            <h2 style={styles.sectionTitle}>Upload Reference Images</h2>
            <p style={styles.sectionSub}>1 to 5 images of your property · they'll be synthesized into one visual universe</p>
            <div style={styles.card}>
              {images.length < 5 && (
                <div
                  style={{ ...styles.uploadZone, ...(dragging ? styles.uploadZoneHover : {}) }}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current.click()}
                >
                  <UploadIcon/>
                  <p style={styles.uploadText}>Drop images here or click to browse</p>
                  <p style={styles.uploadSub}>{images.length}/5 selected · JPG · PNG · WEBP</p>
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                    onChange={e => handleFiles(e.target.files)}/>
                </div>
              )}
              {images.length > 0 && (
                <div style={styles.thumbsGrid}>
                  {images.map((img, i) => (
                    <div key={i} style={styles.thumb}>
                      <img src={img.previewUrl} alt={img.name} style={styles.thumbImg}/>
                      <span style={styles.thumbBadge}>{i + 1}</span>
                      <button style={styles.thumbRemove} onClick={() => removeImage(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              style={{ ...styles.primaryBtn, ...(images.length > 0 ? {} : styles.primaryBtnDisabled) }}
              onClick={() => images.length > 0 && setStage("mcq")}
            >
              Continue to Creative Brief →
            </button>
          </div>
        )}

        {/* STAGE 2 — MCQ */}
        {stage === "mcq" && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <div style={styles.stageLabel}>Stage 02</div>
            <h2 style={styles.sectionTitle}>Creative Brief <span style={styles.badge}>Multi-select</span></h2>
            <p style={styles.sectionSub}>Pick multiple options per question for richer Hollywood-style story plots</p>

            <div style={styles.card}>
              {MCQ_QUESTIONS.map((q, qi) => (
                <div key={q.id}>
                  <div style={styles.mcqQuestion}>
                    <div style={styles.questionNum}>
                      {q.label}
                      {(mcqAnswers[q.id] || []).length > 0 && (
                        <span style={{ marginLeft: 12, color: theme.gold }}>
                          · {mcqAnswers[q.id].length} selected
                        </span>
                      )}
                    </div>
                    <div style={styles.questionText}>{q.text}</div>
                    <div style={styles.questionHint}>{q.hint}</div>
                    <div style={styles.optionGrid}>
                      {q.options.map(opt => {
                        const selected = (mcqAnswers[q.id] || []).includes(opt);
                        return (
                          <button
                            key={opt}
                            style={{ ...styles.option, ...(selected ? styles.optionSelected : {}) }}
                            onClick={() => toggleOption(q.id, opt)}
                          >
                            {selected && <span style={{ marginRight: 8 }}>✓</span>}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {qi < MCQ_QUESTIONS.length - 1 && <div style={styles.divider}/>}
                </div>
              ))}

              <div style={styles.divider}/>

              {/* ── UPDATED: Question 06 — The Voice ───────────────────────── */}
              <div style={styles.mcqQuestion}>
                <div style={styles.questionNum}>06 — The Voice</div>
                <div style={styles.questionText}>Include professional voiceover?</div>
                <div style={styles.questionHint}>Voiced by ElevenLabs · you'll review and edit all spoken lines before rendering</div>

                <div style={styles.voiceToggle}>
                  <button
                    style={{ ...styles.toggleBtn, ...(voiceoverEnabled === true ? styles.toggleBtnSelected : {}) }}
                    onClick={() => { setVoiceoverEnabled(true); setVoiceoverRole(null); }}
                  >
                    Yes — Include Voiceover
                  </button>
                  <button
                    style={{ ...styles.toggleBtn, ...(voiceoverEnabled === false ? styles.toggleBtnSelected : {}) }}
                    onClick={() => { setVoiceoverEnabled(false); setVoiceoverRole(null); }}
                  >
                    No — Music Only
                  </button>
                </div>

                {/* ── Role selector — only shown when voiceover is enabled ── */}
                {voiceoverEnabled === true && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 12, color: theme.muted, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>
                      What should the voiceover do?
                    </div>
                    <div style={styles.voiceRoleGrid}>
                      {VOICEOVER_ROLES.map(role => {
                        const selected = voiceoverRole === role.value;
                        return (
                          <button
                            key={role.value}
                            style={{ ...styles.voiceRoleCard, ...(selected ? styles.voiceRoleCardSelected : {}) }}
                            onClick={() => setVoiceoverRole(role.value)}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                              <div style={{
                                width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                                border: `1px solid ${selected ? theme.gold : theme.borderLight}`,
                                background: selected ? theme.gold : "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0A0A08" }}/>}
                              </div>
                              <div>
                                <div style={styles.voiceRoleLabel}>{role.label}</div>
                                <div style={styles.voiceRoleDesc}>{role.desc}</div>
                                <div style={styles.voiceRoleTiming}>{role.timing}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* ──────────────────────────────────────────────────────── */}
              </div>
              {/* ────────────────────────────────────────────────────────── */}
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.actionRow}>
              <button style={styles.secondaryBtn} onClick={() => setStage("upload")}>← Back</button>
              <button
                style={{ ...styles.primaryBtn, flex: 1, marginTop: 0, ...(mcqComplete() ? {} : styles.primaryBtnDisabled) }}
                onClick={() => mcqComplete() && fetchStories()}
              >
                Generate 2 Story Concepts →
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2.5 — LOADING STORIES */}
        {stage === "loadingStories" && (
          <div style={{ ...styles.loadingWrap, animation: "fadeUp 0.5s ease both" }}>
            <Spinner/>
            <h2 style={styles.loadingTitle}>Crafting Two Story Concepts</h2>
            <p style={styles.loadingSubtitle}>Claude is analyzing your {images.length} reference images...</p>
          </div>
        )}

        {/* STAGE 3 — STORY PICKER */}
        {stage === "stories" && stories && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <div style={styles.stageLabel}>Stage 03</div>
            <h2 style={styles.sectionTitle}>Choose Your Story</h2>
            <p style={styles.sectionSub}>Two distinct cinematic concepts — pick the one that resonates</p>

            {stories.map((s) => (
              <div
                key={s.id}
                style={{ ...styles.storyCard, ...(chosenStory?.id === s.id ? styles.storyCardSelected : {}) }}
                onClick={() => setChosenStory(s)}
              >
                <div style={styles.storyTitle}>{s.title}</div>
                <div style={styles.storyTagline}>"{s.tagline}"</div>
                <div style={styles.storyDesc}>{s.description}</div>
                <div style={styles.storyMeta}>
                  <span>Mood · {s.mood}</span>
                  <span>Music · {s.music_style?.slice(0, 40)}...</span>
                </div>
              </div>
            ))}

            <div style={styles.actionRow}>
              <button style={styles.secondaryBtn} onClick={() => setStage("mcq")}>← Re-brief</button>
              <button
                style={{ ...styles.primaryBtn, flex: 1, marginTop: 0, ...(chosenStory ? {} : styles.primaryBtnDisabled) }}
                onClick={() => chosenStory && fetchPrompts(chosenStory)}
              >
                Build 5 Cinematic Scenes →
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3.5 — LOADING PROMPTS */}
        {stage === "loadingPrompts" && (
          <div style={{ ...styles.loadingWrap, animation: "fadeUp 0.5s ease both" }}>
            <Spinner/>
            <h2 style={styles.loadingTitle}>Writing Hollywood-Grade Scenes</h2>
            <p style={styles.loadingSubtitle}>Roger Deakins-level cinematography · 9:16 vertical · drone shots</p>
          </div>
        )}

        {/* STAGE 4 — REVIEW */}
        {stage === "review" && promptsOutput && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <div style={styles.stageLabel}>Stage 04</div>
            <h2 style={styles.sectionTitle}>Review & Edit</h2>
            <p style={styles.sectionSub}>
              {chosenStory.title} · 5 scenes · 9:16 vertical
              {voiceoverEnabled && voiceoverRole && ` · ${VOICEOVER_ROLES.find(r => r.value === voiceoverRole)?.label}`}
            </p>

            <div style={{ ...styles.card, padding: "16px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <span style={styles.fieldLabel}>Music Direction</span>
                <span style={{ fontSize: 14, color: theme.creamDim }}>{promptsOutput.music_style}</span>
              </div>
            </div>

            {editedScenes.map((scene, i) => {
              // ── Show voiceover field based on role ──────────────────────
              const showVO = voiceoverEnabled && (() => {
                if (voiceoverRole === "hook") return i < 2;      // scenes 1-2
                if (voiceoverRole === "cta") return i >= 3;       // scenes 4-5
                if (voiceoverRole === "narrate") return true;     // all scenes
                return false;
              })();
              // ────────────────────────────────────────────────────────────

              return (
                <div key={i} style={styles.sceneCard}>
                  <div style={styles.sceneHeader}>
                    <div style={styles.sceneNum}>{i + 1}</div>
                    <div>
                      <div style={styles.sceneTitle}>{scene.act} · {scene.role}</div>
                      <div style={styles.sceneTech}>{scene.focal_length} · {scene.camera_move}</div>
                    </div>
                    {/* ── Role badge on relevant scenes ── */}
                    {voiceoverEnabled && showVO && (
                      <div style={{
                        marginLeft: "auto", fontSize: 10, letterSpacing: "0.15em",
                        color: theme.gold, background: "rgba(201,168,76,0.1)",
                        border: `1px solid rgba(201,168,76,0.3)`,
                        padding: "3px 8px", borderRadius: 2, textTransform: "uppercase",
                      }}>
                        🎙 {voiceoverRole === "hook" ? "Hook" : voiceoverRole === "cta" ? "CTA" : "VO"}
                      </div>
                    )}
                  </div>

                  <label style={styles.fieldLabel}>Reference Image</label>
                  <div style={styles.refImgRow}>
                    {images.map((img, ii) => (
                      <div
                        key={ii}
                        style={{ ...styles.refImgChip, ...(scene.reference_image_index === ii ? styles.refImgChipActive : {}) }}
                        onClick={() => updateScene(i, "reference_image_index", ii)}
                      >
                        <img src={img.previewUrl} alt="" style={styles.refImgChipImg}/>
                      </div>
                    ))}
                  </div>

                  <label style={styles.fieldLabel}>Visual Prompt — Veo3.1 (9:16)</label>
                  <textarea rows={5} style={styles.textarea}
                    value={scene.visual_prompt}
                    onChange={e => updateScene(i, "visual_prompt", e.target.value)}/>

                  {showVO && (
                    <div style={{ marginTop: 14 }}>
                      <label style={styles.fieldLabel}>
                        🎙️ Voiceover Line — ElevenLabs{" "}
                        <span style={{ color: theme.muted, letterSpacing: "0.05em", textTransform: "none" }}>
                          (read & edit before render)
                        </span>
                      </label>
                      <textarea rows={2} style={styles.textarea}
                        value={scene.voiceover_line}
                        onChange={e => updateScene(i, "voiceover_line", e.target.value)}
                        placeholder={
                          voiceoverRole === "hook" ? "Gripping opening line — 10–15 words..." :
                          voiceoverRole === "cta" ? "Compelling call to action — 10–15 words..." :
                          "Evocative narration line — 10–15 words..."
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}

            <div style={styles.sceneCard}>
              <label style={styles.fieldLabel}>Instagram Caption</label>
              <textarea rows={3} style={styles.textarea}
                value={editedCaption} onChange={e => setEditedCaption(e.target.value)}/>
              <div style={{ marginTop: 16 }}>
                <label style={styles.fieldLabel}>Hashtags</label>
                <div style={styles.hashtagsWrap}>
                  {editedHashtags.split(" ").filter(h => h.startsWith("#")).map((tag, i) => (
                    <span key={i} style={styles.hashtag}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.actionRow}>
              <button style={styles.secondaryBtn} onClick={() => setStage("stories")}>← Pick Different Story</button>
              <button style={{ ...styles.primaryBtn, flex: 1, marginTop: 0 }} onClick={startRender}>
                Render Final Video →
              </button>
            </div>
          </div>
        )}

        {/* STAGE 5 — RENDERING */}
        {stage === "rendering" && (
          <div style={{ ...styles.loadingWrap, animation: "fadeUp 0.5s ease both" }}>
            <Spinner/>
            <h2 style={styles.loadingTitle}>Rendering Your Cinematic Reel</h2>
            <p style={styles.loadingSubtitle}>
              Gemini enhance · Veo3.1 × 5 · {voiceoverEnabled ? `ElevenLabs ${VOICEOVER_ROLES.find(r => r.value === voiceoverRole)?.label} · ` : ""}Suno music · fal.ai stitch
            </p>
            <p style={{ ...styles.loadingSubtitle, marginTop: 8, fontSize: 11 }}>
              Approx. 8 minutes · You can minimize this tab safely
            </p>

            <div style={{ width: "100%", maxWidth: 360, margin: "32px auto 0", background: theme.border, borderRadius: 4, height: 4 }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.goldDim}, ${theme.gold})`,
                width: `${renderProgress}%`,
                transition: "width 8s linear",
              }}/>
            </div>
            <p style={{ fontSize: 11, color: theme.muted, marginTop: 8 }}>{renderProgress}%</p>

            <div style={{ marginTop: 28, textAlign: "left", display: "inline-block" }}>
              {[
                { label: "✨ Gemini image enhancement", pct: 10 },
                { label: "🎬 Veo3.1 scene generation", pct: 20 },
                { label: "🔗 Scene stitching", pct: 75 },
                { label: "🎵 Audio merge", pct: 88 },
                { label: "☁️ Final upload", pct: 96 },
              ].map((s, i) => (
                <p key={i} style={{
                  fontSize: 13, letterSpacing: "0.05em", marginBottom: 8,
                  color: renderProgress >= s.pct ? theme.gold : theme.muted,
                }}>
                  {renderProgress >= s.pct ? "✅" : "⬜"} {s.label}
                </p>
              ))}
            </div>

            {jobId && (
              <p style={{ fontSize: 10, color: theme.border, marginTop: 20, fontFamily: "monospace" }}>{jobId}</p>
            )}

            <div style={{ marginTop: 32 }}>
              <button
                style={{ ...styles.secondaryBtn, fontSize: 11, color: theme.muted, borderColor: theme.border }}
                onClick={() => {
                  setJobId(null);
                  setError("Render cancelled — your prompts are saved. Hit Render again when ready.");
                  setStage("review");
                }}
              >
                ← Something wrong? Go back
              </button>
            </div>
          </div>
        )}

        {/* STAGE 6 — DONE */}
        {stage === "done" && finalVideo && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <div style={styles.stageLabel}>Complete</div>
            <div style={styles.successCard}>
              <h2 style={styles.successTitle}>Your Reel is Ready</h2>
              <p style={styles.successSub}>
                {finalVideo.sceneCount} scenes · {finalVideo.format} · {finalVideo.audioSource}
              </p>
            </div>

            <div style={{ marginTop: 24 }}>
              <video src={finalVideo.videoUrl} controls style={styles.videoFrame} playsInline/>
            </div>

            <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 4, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: theme.gold, marginBottom: 4, letterSpacing: "0.05em" }}>⚡ Download your video now</p>
              <p style={{ fontSize: 11, color: theme.muted, letterSpacing: "0.04em" }}>This link expires in 7 days — save your reel immediately</p>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <a
                href={finalVideo.downloadUrl} target="_blank" rel="noopener noreferrer" download="scenecraft_reel.mp4"
                style={{ ...styles.primaryBtn, flex: 1, marginTop: 0, textDecoration: "none", textAlign: "center", display: "block", lineHeight: "1.4", paddingTop: 14, paddingBottom: 14 }}
              >
                ⬇ Download Reel
              </a>
              <button style={styles.secondaryBtn} onClick={reset}>New Project</button>
            </div>

            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button style={{ ...styles.secondaryBtn, fontSize: 11, color: theme.muted }} onClick={() => setStage("review")}>
                Not happy? Go back and re-render →
              </button>
            </div>

            <div style={{ ...styles.sceneCard, marginTop: 24 }}>
              <label style={styles.fieldLabel}>Instagram Caption</label>
              <p style={{ fontSize: 15, color: theme.creamDim, lineHeight: 1.7 }}>{editedCaption}</p>
              <div style={{ marginTop: 16 }}>
                <label style={styles.fieldLabel}>Hashtags</label>
                <div style={styles.hashtagsWrap}>
                  {editedHashtags.split(" ").filter(h => h.startsWith("#")).map((tag, i) => (
                    <span key={i} style={styles.hashtag}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
