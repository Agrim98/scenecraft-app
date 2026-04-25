export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const n8nRes = await fetch("https://crafterlabs.app.n8n.cloud/webhook/scenecraft/build-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await n8nRes.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { error: text }; }

    return res.status(n8nRes.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Proxy error: " + e.message });
  }
}
