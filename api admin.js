export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = 'https://fpnlzpfkygsyvkettjuj.supabase.co';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SERVICE_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: missing service key' });
  }

  // ── GET: list all users ──────────────────────────────
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: create a new user ──────────────────────────
  if (req.method === 'POST') {
    const { email, password, hotel } = req.body;

    if (!email || !password || !hotel) {
      return res.status(400).json({ error: 'Missing email, password, or hotel' });
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { hotel }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(400).json({ error: data.message || data.msg || 'Failed to create user' });
      }

      return res.status(200).json({ success: true, user: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
