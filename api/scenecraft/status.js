// api/scenecraft/status.js — V7 Job Status Polling
const N8N_STATUS_WEBHOOK = process.env.N8N_STATUS_WEBHOOK_URL;

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { job_id } = req.query;
  if (!job_id) return res.status(400).json({ error: 'job_id required' });

  try {
    const n8nResponse = await fetch(
      `${N8N_STATUS_WEBHOOK}?job_id=${encodeURIComponent(job_id)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const result = await n8nResponse.json();
    return res.status(200).json(result);

  } catch (err) {
    console.error('[status]', err.message);
    return res.status(500).json({ error: 'Status check failed', detail: err.message });
  }
}
