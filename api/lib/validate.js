const MAX_BODY_BYTES = 28 * 1024 * 1024;
const MAX_IMAGES = 5;
const MAX_IMAGE_BASE64 = 8 * 1024 * 1024;
const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp"];
const MAX_PROMPT_CHARS = 2000;
const MAX_VO_CHARS = 400;
const MAX_MCQ_CHARS = 600;

const stripCtrl = (s) => String(s ?? "").replace(/[\u0000-\u001F\u007F]/g, "").trim();

export function httpError(status, message) {
  const e = new Error(message); e.status = status; return e;
}

export function validateAndSanitize(body, route) {
  const raw = JSON.stringify(body || {});
  if (raw.length > MAX_BODY_BYTES) throw httpError(413, "Payload too large");

  if (Array.isArray(body.images)) {
    if (body.images.length > MAX_IMAGES) throw httpError(400, "Max 5 images");
    body.images = body.images.map((img, i) => {
      if (!img?.base64 || typeof img.base64 !== "string") throw httpError(400, `Image ${i}: missing base64`);
      if (img.base64.length > MAX_IMAGE_BASE64) throw httpError(413, `Image ${i}: too large`);
      if (!ALLOWED_MEDIA.includes(img.media_type)) throw httpError(400, `Image ${i}: unsupported type`);
      if (!/^[A-Za-z0-9+/=]+$/.test(img.base64)) throw httpError(400, `Image ${i}: invalid base64`);
      return { base64: img.base64, media_type: img.media_type };
    });
  }

  if (body.mcq && typeof body.mcq === "object") {
    for (const k of ["subject", "story", "light", "audience", "detail"]) {
      if (body.mcq[k] != null) body.mcq[k] = stripCtrl(body.mcq[k]).slice(0, MAX_MCQ_CHARS);
    }
  }

  if (body.voiceover !== undefined) body.voiceover = !!body.voiceover;

  if (route === "prompts" && body.story) {
    body.story.title = stripCtrl(body.story.title).slice(0, 200);
    body.story.tagline = stripCtrl(body.story.tagline).slice(0, 200);
    body.story.description = stripCtrl(body.story.description).slice(0, 1000);
    body.story.mood = stripCtrl(body.story.mood).slice(0, 200);
    body.story.music_style = stripCtrl(body.story.music_style).slice(0, 500);
  }

  if (route === "render") {
    if (!Array.isArray(body.scenes) || body.scenes.length === 0) throw httpError(400, "scenes required");
    if (body.scenes.length > 5) throw httpError(400, "Max 5 scenes");
    body.scenes = body.scenes.map((s, i) => ({
      scene_number: parseInt(s.scene_number) || (i + 1),
      act: stripCtrl(s.act).slice(0, 100),
      role: stripCtrl(s.role).slice(0, 50),
      focal_length: stripCtrl(s.focal_length).slice(0, 50),
      camera_move: stripCtrl(s.camera_move).slice(0, 100),
      visual_prompt: stripCtrl(s.visual_prompt).slice(0, MAX_PROMPT_CHARS),
      voiceover_line: s.voiceover_line ? stripCtrl(s.voiceover_line).slice(0, MAX_VO_CHARS) : "",
      reference_image_index: Math.max(0, Math.min(parseInt(s.reference_image_index) || 0, MAX_IMAGES - 1)),
    }));
    body.music_style = stripCtrl(body.music_style).slice(0, 500);
    body.story_title = stripCtrl(body.story_title).slice(0, 200);
  }

  // Server-assigned token — client cannot influence it
  body.client_token = `SC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return body;
}
