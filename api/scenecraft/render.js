// api/scenecraft/render.js — V7 Async (fire and return job_id instantly)
const N8N_RENDER_WEBHOOK = process.env.N8N_RENDER_WEBHOOK_URL;

export const config = { api: { bodyParser: { sizeLimit: "30mb" } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    if (!body?.client_token?.startsWith('SC-')) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Calls n8n — n8n responds INSTANTLY with job_id, then runs pipeline in background
    const n8nResponse = await fetch(N8N_RENDER_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000)
    });

    if (!n8nResponse.ok) throw new Error(`n8n webhook failed: ${n8nResponse.status}`);

    const result = await n8nResponse.json();
    // result = { status: 'processing', job_id: 'SC-100_1234567890', estimated_seconds: 480 }
    return res.status(202).json(result);

  } catch (err) {
    console.error('[render]', err.message);
    return res.status(500).json({ error: 'Failed to start render', detail: err.message });
  }
}
