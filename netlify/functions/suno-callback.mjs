// SunoAPI requires a callBackUrl on most endpoints. The app polls for results,
// so this endpoint only needs to acknowledge the callback with a 200.
export default async () =>
  new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
