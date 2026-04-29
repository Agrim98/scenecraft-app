import { useState, useRef } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const theme = {
  bg: "#0A0A08",
  surface: "#111110",
  surfaceAlt: "#181816",
  border: "#2A2A26",
  borderLight: "#3A3A35",
  gold: "#C9A84C",
  goldLight: "#E2C97E",
  goldDim: "#8A6E2F",
  cream: "#F5F0E8",
  creamDim: "#B8B0A0",
  muted: "#6B6860",
  white: "#FFFFFF",
  danger: "#C0392B",
};

const styles = {
  app: {
    minHeight: "100vh",
    background: theme.bg,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    color: theme.cream,
    position: "relative",
    overflow: "hidden",
  },
  grain: {
    position: "fixed",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 0,
    opacity: 0.6,
  },
  container: {
    maxWidth: 780,
    margin: "0 auto",
    padding: "0 24px 80px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    paddingTop: 64,
    paddingBottom: 48,
    borderBottom: `1px solid ${theme.border}`,
    marginBottom: 56,
  },
  logoMark: {
    width: 48,
    height: 48,
    margin: "0 auto 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: "0.35em",
    textTransform: "uppercase",
    color: theme.gold,
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 52,
    fontWeight: 300,
    letterSpacing: "0.04em",
    color: theme.cream,
    margin: 0,
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: 16,
    color: theme.muted,
    marginTop: 12,
    letterSpacing: "0.08em",
    fontStyle: "italic",
  },
  stageLabel: {
    fontSize: 11,
    letterSpacing: "0.4em",
    textTransform: "uppercase",
    color: theme.goldDim,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28,
    fontWeight: 300,
    color: theme.cream,
    margin: "0 0 6px",
    letterSpacing: "0.03em",
  },
  sectionSub: {
    fontSize: 14,
    color: theme.muted,
    marginBottom: 32,
    letterSpacing: "0.05em",
  },
  card: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 2,
    padding: 32,
    marginBottom: 16,
  },
  uploadZone: {
    border: `1px dashed ${theme.borderLight}`,
    borderRadius: 2,
    padding: "56px 40px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  uploadZoneHover: {
    border: `1px dashed ${theme.gold}`,
    background: "rgba(201,168,76,0.04)",
  },
  uploadIcon: {
    width: 48,
    height: 48,
    margin: "0 auto 16px",
    opacity: 0.4,
  },
  uploadText: {
    fontSize: 15,
    color: theme.creamDim,
    marginBottom: 6,
    letterSpacing: "0.05em",
  },
  uploadSub: {
    fontSize: 12,
    color: theme.muted,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  imagePreview: {
    width: "100%",
    maxHeight: 360,
    objectFit: "cover",
    borderRadius: 2,
    display: "block",
  },
  imageOverlay: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  imageFilename: {
    fontSize: 13,
    color: theme.muted,
    letterSpacing: "0.05em",
  },
  changeBtn: {
    fontSize: 12,
    color: theme.gold,
    background: "none",
    border: "none",
    cursor: "pointer",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    padding: 0,
    fontFamily: "inherit",
  },
  mcqQuestion: {
    marginBottom: 32,
  },
  questionNum: {
    fontSize: 11,
    letterSpacing: "0.3em",
    color: theme.goldDim,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 300,
    color: theme.cream,
    marginBottom: 16,
    letterSpacing: "0.02em",
    lineHeight: 1.4,
  },
  optionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  option: {
    padding: "12px 16px",
    border: `1px solid ${theme.border}`,
    borderRadius: 2,
    background: "transparent",
    color: theme.creamDim,
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    letterSpacing: "0.04em",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
    lineHeight: 1.3,
  },
  optionSelected: {
    border: `1px solid ${theme.gold}`,
    background: "rgba(201,168,76,0.08)",
    color: theme.goldLight,
  },
  divider: {
    height: 1,
    background: theme.border,
    margin: "32px 0",
  },
  voiceToggle: {
    display: "flex",
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    padding: "14px",
    border: `1px solid ${theme.border}`,
    borderRadius: 2,
    background: "transparent",
    color: theme.creamDim,
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
    textAlign: "center",
  },
  toggleBtnSelected: {
    border: `1px solid ${theme.gold}`,
    background: "rgba(201,168,76,0.08)",
    color: theme.goldLight,
  },
  primaryBtn: {
    width: "100%",
    padding: "18px",
    background: theme.gold,
    border: "none",
    borderRadius: 2,
    color: "#0A0A08",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
    marginTop: 8,
  },
  primaryBtnDisabled: {
    background: theme.border,
    color: theme.muted,
    cursor: "not-allowed",
  },
  secondaryBtn: {
    padding: "12px 24px",
    background: "transparent",
    border: `1px solid ${theme.border}`,
    borderRadius: 2,
    color: theme.creamDim,
    fontSize: 12,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
  },
  loadingWrap: {
    textAlign: "center",
    padding: "64px 0",
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 300,
    color: theme.cream,
    marginBottom: 10,
    letterSpacing: "0.05em",
  },
  loadingSubtitle: {
    fontSize: 13,
    color: theme.muted,
    letterSpacing: "0.1em",
  },
  sceneCard: {
    background: theme.surfaceAlt,
    border: `1px solid ${theme.border}`,
    borderRadius: 2,
    padding: 24,
    marginBottom: 16,
  },
  sceneHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sceneNum: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: `1px solid ${theme.gold}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    color: theme.gold,
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  sceneTitle: {
    fontSize: 11,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: theme.gold,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: theme.muted,
    marginBottom: 8,
    display: "block",
  },
  textarea: {
    width: "100%",
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 2,
    padding: "12px 14px",
    color: theme.cream,
    fontSize: 14,
    fontFamily: "inherit",
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    letterSpacing: "0.02em",
    transition: "border-color 0.2s ease",
  },
  captionCard: {
    background: theme.surfaceAlt,
    border: `1px solid ${theme.border}`,
    borderRadius: 2,
    padding: 24,
    marginBottom: 16,
  },
  hashtagsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  hashtag: {
    fontSize: 12,
    color: theme.gold,
    background: "rgba(201,168,76,0.08)",
    border: `1px solid rgba(201,168,76,0.2)`,
    borderRadius: 2,
    padding: "4px 10px",
    letterSpacing: "0.05em",
  },
  actionRow: {
    display: "flex",
    gap: 12,
    marginTop: 32,
  },
  driveInput: {
    width: "100%",
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 2,
    padding: "14px 16px",
    color: theme.cream,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    letterSpacing: "0.02em",
    marginTop: 12,
  },
  progressWrap: {
    padding: "48px 0",
  },
  progressItem: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  progressText: {
    fontSize: 14,
    color: theme.creamDim,
    letterSpacing: "0.05em",
  },
  successCard: {
    background: "rgba(201,168,76,0.06)",
    border: `1px solid rgba(201,168,76,0.3)`,
    borderRadius: 2,
    padding: 32,
    textAlign: "center",
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 300,
    color: theme.goldLight,
    marginBottom: 8,
    letterSpacing: "0.04em",
  },
  successSub: {
    fontSize: 14,
    color: theme.muted,
    letterSpacing: "0.08em",
    marginBottom: 24,
  },
  outputLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 2,
    marginBottom: 8,
    textDecoration: "none",
  },
  outputLinkText: {
    fontSize: 13,
    color: theme.cream,
    letterSpacing: "0.04em",
  },
  outputLinkType: {
    fontSize: 11,
    color: theme.muted,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },
  stepIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    marginBottom: 48,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: theme.border,
    transition: "all 0.3s ease",
  },
  stepDotActive: {
    background: theme.gold,
    width: 24,
    borderRadius: 4,
  },
  stepDotDone: {
    background: theme.goldDim,
  },
  stepLine: {
    width: 32,
    height: 1,
    background: theme.border,
  },
  errorBox: {
    background: "rgba(192,57,43,0.1)",
    border: `1px solid rgba(192,57,43,0.3)`,
    borderRadius: 2,
    padding: "14px 16px",
    fontSize: 13,
    color: "#E57368",
    letterSpacing: "0.03em",
    marginBottom: 16,
  },
};

// ─── MCQ DATA ─────────────────────────────────────────────────────────────────
const MCQ_QUESTIONS = [
  {
    id: "subject",
    label: "01 — The Subject",
    text: "What is the primary subject of this image?",
    options: [
      "Signature dish / plated food",
      "Chef in action / kitchen",
      "Venue, space & ambience",
      "Bar, cocktails & drinks",
      "Event setup / celebration",
    ],
  },
  {
    id: "story",
    label: "02 — The Story",
    text: "What story should this ad tell your audience?",
    options: [
      "Come celebrate your moments here",
      "Experience world-class cuisine",
      "Meet the craft behind the kitchen",
      "This is what luxury feels like",
      "A memory you will never forget",
    ],
  },
  {
    id: "light",
    label: "03 — The Light",
    text: "What time and light best captures your hotel's soul?",
    options: [
      "Golden hour — warm & glowing",
      "Candlelit evening — intimate & moody",
      "Bright airy daytime — fresh & inviting",
      "Dramatic night — dark & cinematic",
      "Sunrise — quiet & aspirational",
    ],
  },
  {
    id: "audience",
    label: "04 — The Audience",
    text: "Who are you speaking to with this ad?",
    options: [
      "Couples — romance & intimacy",
      "Corporate — prestige & events",
      "Food lovers — passion & discovery",
      "Families — warmth & occasion",
      "Luxury travellers — exclusivity",
    ],
  },
  {
    id: "detail",
    label: "05 — The Detail",
    text: "Which close-up detail deserves its own cinematic moment?",
    options: [
      "Texture & colour of the food",
      "Steam, flame & heat in motion",
      "The chef's hands at work",
      "The pour — sauce, wine or cocktail",
      "Plating, garnish & finishing",
    ],
  },
  {
    id: "voiceover",
    label: "06 — The Voice",
    text: "Would you like a professional voiceover for your scenes?",
    options: null,
  },
];

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="28" width="32" height="12" rx="1" stroke="#C9A84C" strokeWidth="1" fill="none" opacity="0.3"/>
    <path d="M24 8 L24 28 M16 16 L24 8 L32 16" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FilmIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="4" width="16" height="12" rx="1" stroke="#C9A84C" strokeWidth="1" fill="none"/>
    <path d="M2 7h16M2 13h16M6 4v3M10 4v3M14 4v3M6 13v3M10 13v3M14 13v3" stroke="#C9A84C" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7 L5.5 10.5 L12 3.5" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LogoMark = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="4" width="40" height="40" rx="2" stroke="#C9A84C" strokeWidth="0.75" fill="none"/>
    <rect x="10" y="10" width="28" height="28" rx="1" stroke="#C9A84C" strokeWidth="0.5" fill="none" opacity="0.4"/>
    <circle cx="24" cy="24" r="6" stroke="#C9A84C" strokeWidth="1" fill="none"/>
    <circle cx="24" cy="24" r="2" fill="#C9A84C"/>
    <path d="M4 16 h6 M38 16 h6 M4 32 h6 M38 32 h6" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
  </svg>
);

const Spinner = () => (
  <div style={{ display: "inline-block", width: 32, height: 32, margin: "0 auto 20px", display: "block" }}>
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: "spin 1.5s linear infinite" }}>
      <circle cx="16" cy="16" r="13" stroke={theme.border} strokeWidth="1.5"/>
      <path d="M16 3 A13 13 0 0 1 29 16" stroke={theme.gold} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  </div>
);

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────
const StepIndicator = ({ current }) => {
  const steps = [0, 1, 2, 3, 4];
  return (
    <div style={styles.stepIndicator}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            ...styles.stepDot,
            ...(current === s ? styles.stepDotActive : {}),
            ...(current > s ? styles.stepDotDone : {}),
          }}/>
          {i < steps.length - 1 && <div style={styles.stepLine}/>}
        </div>
      ))}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ScreenCrafter() {
  const [stage, setStage] = useState("upload"); // upload | mcq | generating | review | rendering | done
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [voiceover, setVoiceover] = useState(null);
  const [claudeOutput, setClaudeOutput] = useState(null);
  const [editedScenes, setEditedScenes] = useState([]);
  const [editedCaption, setEditedCaption] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");
  const [driveFolder, setDriveFolder] = useState("");
  const [error, setError] = useState(null);
  const [renderProgress, setRenderProgress] = useState([]);
  const [finalOutputs, setFinalOutputs] = useState(null);
  const fileRef = useRef();

  const stageIndex = { upload: 0, mcq: 1, generating: 2, review: 2, rendering: 3, done: 4 };

  // ── Image Upload ─────────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    const reader = new FileReader();
    reader.onload = (e) => setImageBase64(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── MCQ ──────────────────────────────────────────────────────────────────────
  const mcqComplete = () => {
    const answered = MCQ_QUESTIONS.filter(q => q.options !== null).every(q => mcqAnswers[q.id]);
    return answered && voiceover !== null;
  };

  // ── Claude API Call ───────────────────────────────────────────────────────────
  const generateWithClaude = async () => {
    setStage("generating");
    setError(null);

    const systemPrompt = `You are a world-class hospitality advertising creative director. You write cinematic ad scripts for luxury hotels in the style of JW Marriott, Four Seasons, and Ritz-Carlton campaigns.

Your output must be valid JSON only — no preamble, no markdown, no explanation.

You will receive: one hotel image (base64) and 5 creative direction answers.

Generate a 5-scene sequential cinematic ad that tells a COMPLETE STORY in this exact arc:
- Scene 1 — THE HOOK: Visually arresting opener. No context yet. Pure desire. Draw them in.
- Scene 2 — THE WORLD: Reveal the place. Atmosphere, light, the feeling of being there.
- Scene 3 — THE CRAFT: The detail that earns trust. Close-up. The care behind everything.
- Scene 4 — THE MOMENT: Human emotion. Celebration, connection, joy. Why people come.
- Scene 5 — THE CLOSER: Pull back. Beauty. End with hotel name + city location hook. "Why come anywhere else."

Each scene must specify:
- A unique focal length (wide, 35mm, 50mm, macro, etc.)
- A unique camera movement (slow push in, handheld drift, crane reveal, static locked, etc.)
- Shot on Arri Alexa Mini LF, soft 35mm film grain
- Cinematic color grade matching the light/mood chosen

For voiceover lines (if requested): short, spoken-word poetry. 10–15 words max per scene. Evocative, not descriptive. The kind of line that makes someone feel something.

Return ONLY this JSON structure:
{
  "scenes": [
    {
      "scene_number": 1,
      "act": "THE HOOK",
      "visual_prompt": "full cinematic Kling prompt here, very detailed, 60-100 words",
      "voiceover_line": "spoken line here or null if no voiceover"
    }
  ],
  "instagram_caption": "caption here, 2-3 sentences, aspirational tone",
  "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10",
  "music_style": "brief music direction, e.g. Cinematic orchestral swell with soft piano..."
}`;

    const userMessage = `Hotel image is attached. Here are the creative direction answers:

Subject: ${mcqAnswers.subject}
Story: ${mcqAnswers.story}
Light & Time: ${mcqAnswers.light}
Target Audience: ${mcqAnswers.audience}
Hero Detail: ${mcqAnswers.detail}
Voiceover requested: ${voiceover ? "YES — include voiceover lines" : "NO — set all voiceover_line to null"}

Write 5 cinematic scenes that flow as one complete story. Every scene must feel distinct visually while building toward the final location hook. Make it unforgettable.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: imageFile.type, data: imageBase64 }
              },
              { type: "text", text: userMessage }
            ]
          }]
        })
      });

      const data = await response.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setClaudeOutput(parsed);
      setEditedScenes(parsed.scenes.map(s => ({
        ...s,
        visual_prompt: s.visual_prompt,
        voiceover_line: s.voiceover_line || "",
      })));
      setEditedCaption(parsed.instagram_caption);
      setEditedHashtags(parsed.hashtags);
      setStage("review");
    } catch (err) {
      setError("Something went wrong generating your ad. Please try again.");
      setStage("mcq");
    }
  };

  // ── Scene Edit Handlers ───────────────────────────────────────────────────────
  const updateScene = (idx, field, val) => {
    setEditedScenes(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  // ── Simulate Render (replace with actual N8N webhook call) ────────────────────
  const startRendering = async () => {
    setStage("rendering");
    const steps = [
      "Sending to Kling — Scene 1",
      "Sending to Kling — Scene 2",
      "Sending to Kling — Scene 3",
      "Sending to Kling — Scene 4",
      "Sending to Kling — Scene 5",
      ...(voiceover ? ["Generating voiceover — ElevenLabs"] : []),
      driveFolder ? "Uploading to Google Drive" : null,
    ].filter(Boolean);

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 900));
      setRenderProgress(prev => [...prev, steps[i]]);
    }

    await new Promise(r => setTimeout(r, 600));

    // In production: replace with actual N8N webhook call that returns video URLs
    setFinalOutputs({
      videos: editedScenes.map((s, i) => ({
        label: `Scene ${i + 1} — ${s.act}`,
        url: `#scene-${i + 1}-video`,
        type: "video",
      })),
      audio: voiceover ? editedScenes.map((s, i) => ({
        label: `Voiceover ${i + 1}`,
        url: `#scene-${i + 1}-audio`,
        type: "audio",
      })) : [],
      driveUploaded: !!driveFolder,
    });
    setStage("done");
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        textarea:focus, input:focus { border-color: #C9A84C !important; }
        button:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3A3A35; border-radius: 2px; }
      `}</style>
      <div style={styles.grain}/>

      <div style={styles.container}>

        {/* ── HEADER ── */}
        <div style={styles.header}>
          <div style={styles.logoMark}><LogoMark/></div>
          <div style={styles.headline}>Hospitality · Creative Studio</div>
          <h1 style={styles.title}>Screen Crafter</h1>
          <p style={styles.subtitle}>Cinematic ads for the world's finest hotels</p>
        </div>

        <StepIndicator current={stageIndex[stage] || 0}/>

        {/* ══════════════════════════════════════════════════════════════════
            STAGE 1 — IMAGE UPLOAD
        ══════════════════════════════════════════════════════════════════ */}
        {stage === "upload" && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <div style={styles.stageLabel}>Stage 01</div>
            <h2 style={styles.sectionTitle}>Upload Your Image</h2>
            <p style={styles.sectionSub}>One image. Five cinematic scenes. Begin here.</p>

            <div style={styles.card}>
              {!imageUrl ? (
                <div
                  style={{ ...styles.uploadZone, ...(dragging ? styles.uploadZoneHover : {}) }}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current.click()}
                >
                  <UploadIcon/>
                  <p style={styles.uploadText}>Drop your image here or click to browse</p>
                  <p style={styles.uploadSub}>JPG · PNG · WEBP · up to 20MB</p>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => handleFile(e.target.files[0])}/>
                </div>
              ) : (
                <div>
                  <img src={imageUrl} alt="preview" style={styles.imagePreview}/>
                  <div style={styles.imageOverlay}>
                    <span style={styles.imageFilename}>{imageFile?.name}</span>
                    <button style={styles.changeBtn} onClick={() => { setImageUrl(null); setImageFile(null); setImageBase64(null); }}>
                      Change Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              style={{ ...styles.primaryBtn, ...(imageUrl ? {} : styles.primaryBtnDisabled) }}
              onClick={() => imageUrl && setStage("mcq")}
            >
              Continue to Creative Brief →
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STAGE 2 — MCQ
        ══════════════════════════════════════════════════════════════════ */}
        {stage === "mcq" && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <div style={styles.stageLabel}>Stage 02</div>
            <h2 style={styles.sectionTitle}>Creative Brief</h2>
            <p style={styles.sectionSub}>Six questions to craft five cinematic scenes.</p>

            <div style={styles.card}>
              {MCQ_QUESTIONS.filter(q => q.options !== null).map((q, qi) => (
                <div key={q.id}>
                  <div style={styles.mcqQuestion}>
                    <div style={styles.questionNum}>{q.label}</div>
                    <div style={styles.questionText}>{q.text}</div>
                    <div style={styles.optionGrid}>
                      {q.options.map(opt => (
                        <button
                          key={opt}
                          style={{
                            ...styles.option,
                            ...(mcqAnswers[q.id] === opt ? styles.optionSelected : {}),
                          }}
                          onClick={() => setMcqAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        >
                          {mcqAnswers[q.id] === opt && (
                            <span style={{ marginRight: 8 }}>✦ </span>
                          )}
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {qi < MCQ_QUESTIONS.filter(q => q.options !== null).length - 1 && (
                    <div style={styles.divider}/>
                  )}
                </div>
              ))}

              <div style={styles.divider}/>

              {/* Q6 — Voiceover Toggle */}
              <div style={styles.mcqQuestion}>
                <div style={styles.questionNum}>06 — The Voice</div>
                <div style={styles.questionText}>Would you like a professional voiceover for your scenes?</div>
                <p style={{ fontSize: 13, color: theme.muted, marginBottom: 16, letterSpacing: "0.04em" }}>
                  If yes, Claude will write a spoken-word line for each scene — reviewed and edited by you before generation.
                </p>
                <div style={styles.voiceToggle}>
                  <button
                    style={{ ...styles.toggleBtn, ...(voiceover === true ? styles.toggleBtnSelected : {}) }}
                    onClick={() => setVoiceover(true)}
                  >
                    ✦ Yes — Include Voiceover
                  </button>
                  <button
                    style={{ ...styles.toggleBtn, ...(voiceover === false ? styles.toggleBtnSelected : {}) }}
                    onClick={() => setVoiceover(false)}
                  >
                    No — Video Only
                  </button>
                </div>
              </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.actionRow}>
              <button style={styles.secondaryBtn} onClick={() => setStage("upload")}>← Back</button>
              <button
                style={{
                  ...styles.primaryBtn,
                  flex: 1,
                  marginTop: 0,
                  ...(mcqComplete() ? {} : styles.primaryBtnDisabled)
                }}
                onClick={() => mcqComplete() && generateWithClaude()}
              >
                Generate Creative →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STAGE 3 — GENERATING
        ══════════════════════════════════════════════════════════════════ */}
        {stage === "generating" && (
          <div style={{ ...styles.loadingWrap, animation: "fadeUp 0.5s ease both" }}>
            <Spinner/>
            <h2 style={styles.loadingTitle}>Crafting Your Cinematic Story</h2>
            <p style={styles.loadingSubtitle}>Claude is writing 5 scenes · Arri Alexa · 35mm grain</p>
            <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: "50%", background: theme.gold,
                  animation: `pulse 1.2s ease ${i * 0.3}s infinite`
                }}/>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STAGE 4 — REVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {stage === "review" && claudeOutput && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <div style={styles.stageLabel}>Stage 03</div>
            <h2 style={styles.sectionTitle}>Review & Edit</h2>
            <p style={styles.sectionSub}>Your cinematic story is ready. Edit any scene before rendering.</p>

            {/* Music Style */}
            <div style={{
              ...styles.card,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 24px",
              marginBottom: 24,
            }}>
              <FilmIcon/>
              <div>
                <span style={{ ...styles.fieldLabel, marginBottom: 2 }}>Music Direction</span>
                <span style={{ fontSize: 14, color: theme.creamDim, letterSpacing: "0.03em" }}>
                  {claudeOutput.music_style}
                </span>
              </div>
            </div>

            {/* 5 Scenes */}
            {editedScenes.map((scene, i) => (
              <div key={i} style={{ ...styles.sceneCard, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                <div style={styles.sceneHeader}>
                  <div style={styles.sceneNum}>{i + 1}</div>
                  <div>
                    <div style={styles.sceneTitle}>{scene.act}</div>
                  </div>
                </div>

                <label style={styles.fieldLabel}>Visual Prompt — Kling</label>
                <textarea
                  rows={4}
                  style={styles.textarea}
                  value={scene.visual_prompt}
                  onChange={e => updateScene(i, "visual_prompt", e.target.value)}
                />

                {voiceover && (
                  <div style={{ marginTop: 14 }}>
                    <label style={styles.fieldLabel}>Voiceover Line — ElevenLabs</label>
                    <textarea
                      rows={2}
                      style={styles.textarea}
                      value={scene.voiceover_line}
                      onChange={e => updateScene(i, "voiceover_line", e.target.value)}
                      placeholder="Voiceover line for this scene..."
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Caption & Hashtags */}
            <div style={styles.captionCard}>
              <label style={styles.fieldLabel}>Instagram Caption</label>
              <textarea
                rows={3}
                style={styles.textarea}
                value={editedCaption}
                onChange={e => setEditedCaption(e.target.value)}
              />
              <div style={{ marginTop: 16 }}>
                <label style={styles.fieldLabel}>Hashtags</label>
                <div style={styles.hashtagsWrap}>
                  {editedHashtags.split(" ").filter(h => h.startsWith("#")).map((tag, i) => (
                    <span key={i} style={styles.hashtag}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Google Drive */}
            <div style={styles.card}>
              <div style={styles.stageLabel}>Optional</div>
              <div style={{ fontSize: 16, color: theme.cream, marginBottom: 6, letterSpacing: "0.02em" }}>
                Auto-upload to Google Drive
              </div>
              <div style={{ fontSize: 13, color: theme.muted, letterSpacing: "0.04em", marginBottom: 4 }}>
                Paste your Google Drive folder ID below. All 5 videos{voiceover ? " + 5 audio files" : ""} will be uploaded automatically once rendered.
              </div>
              <input
                type="text"
                style={styles.driveInput}
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs"
                value={driveFolder}
                onChange={e => setDriveFolder(e.target.value)}
              />
            </div>

            <div style={styles.actionRow}>
              <button style={styles.secondaryBtn} onClick={() => setStage("mcq")}>← Re-brief</button>
              <button
                style={{ ...styles.primaryBtn, flex: 1, marginTop: 0 }}
                onClick={startRendering}
              >
                Start Rendering All 5 Scenes →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STAGE 5 — RENDERING
        ══════════════════════════════════════════════════════════════════ */}
        {stage === "rendering" && (
          <div style={{ ...styles.progressWrap, animation: "fadeUp 0.5s ease both" }}>
            <div style={styles.stageLabel}>Stage 04</div>
            <h2 style={{ ...styles.sectionTitle, marginBottom: 32 }}>Rendering Your Ad</h2>

            {renderProgress.map((step, i) => (
              <div key={i} style={{ ...styles.progressItem, animation: `fadeUp 0.3s ease both` }}>
                <div style={{ ...styles.progressDot, background: theme.gold }}/>
                <div style={{ ...styles.progressText, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckIcon/> {step}
                </div>
              </div>
            ))}

            {renderProgress.length < (voiceover ? (driveFolder ? 7 : 6) : (driveFolder ? 6 : 5)) && (
              <div style={styles.progressItem}>
                <div style={{
                  ...styles.progressDot,
                  background: theme.goldDim,
                  animation: "pulse 1s ease infinite"
                }}/>
                <div style={{ ...styles.progressText, color: theme.muted }}>Processing...</div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STAGE 6 — DONE
        ══════════════════════════════════════════════════════════════════ */}
        {stage === "done" && finalOutputs && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <div style={styles.stageLabel}>Complete</div>
            <div style={styles.successCard}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
              <h2 style={styles.successTitle}>Your Ad is Ready</h2>
              <p style={styles.successSub}>
                {finalOutputs.videos.length} cinematic scenes
                {voiceover ? ` · ${finalOutputs.audio.length} voiceover files` : ""}
                {finalOutputs.driveUploaded ? " · Uploaded to Google Drive" : ""}
              </p>
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={styles.fieldLabel}>Video Scenes</div>
              {finalOutputs.videos.map((v, i) => (
                <a key={i} href={v.url} style={styles.outputLink}>
                  <span style={styles.outputLinkText}>{v.label}</span>
                  <span style={styles.outputLinkType}>{v.type}</span>
                </a>
              ))}

              {voiceover && finalOutputs.audio.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={styles.fieldLabel}>Voiceover Audio</div>
                  {finalOutputs.audio.map((a, i) => (
                    <a key={i} href={a.url} style={styles.outputLink}>
                      <span style={styles.outputLinkText}>{a.label}</span>
                      <span style={styles.outputLinkType}>{a.type}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Instagram Copy */}
            <div style={{ ...styles.captionCard, marginTop: 24 }}>
              <label style={styles.fieldLabel}>Instagram Caption</label>
              <p style={{ fontSize: 15, color: theme.creamDim, lineHeight: 1.7, letterSpacing: "0.02em" }}>
                {editedCaption}
              </p>
              <div style={styles.hashtagsWrap}>
                {editedHashtags.split(" ").filter(h => h.startsWith("#")).map((tag, i) => (
                  <span key={i} style={styles.hashtag}>{tag}</span>
                ))}
              </div>
            </div>

            <button
              style={{ ...styles.primaryBtn, marginTop: 24 }}
              onClick={() => {
                setStage("upload");
                setImageFile(null); setImageUrl(null); setImageBase64(null);
                setMcqAnswers({}); setVoiceover(null); setClaudeOutput(null);
                setEditedScenes([]); setEditedCaption(""); setEditedHashtags("");
                setDriveFolder(""); setRenderProgress([]); setFinalOutputs(null);
              }}
            >
              Create Another Ad →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
