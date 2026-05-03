// Replace this line:
const N8N_STATUS_WEBHOOK = process.env.N8N_STATUS_WEBHOOK_URL;

// With this:
const N8N_BASE_URL = process.env.N8N_BASE_URL;

// And replace the fetch URL:
const n8nResponse = await fetch(
  `${N8N_BASE_URL}/scenecraft/status?job_id=${encodeURIComponent(job_id)}`,
  {
    method: "GET",
    headers: {
      "x-internal-secret": process.env.N8N_SHARED_SECRET,
    },
    signal: AbortSignal.timeout(5000),
  }
);
