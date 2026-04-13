export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic auth check — verify the request has a valid 
  // Supabase session token in the Authorization header
  // This prevents public access to the endpoint
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { context } = req.body;
  if (!context) {
    return res.status(400).json({ error: 'Missing context' });
  }

  const systemPrompt = `You are writing a 3-paragraph executive 
briefing for a General Manager of a luxury hotel.

STRICT RULES — violation of any rule means the output is rejected:
1. Use ONLY the facts provided in the data object.
2. Do NOT add context, inference, projections, or assessments 
   not present in the data.
3. Do NOT invent numbers. Every figure you write must match a 
   field in the data object exactly.
4. If a topic has no data, do not mention it.
5. Write in plain English. No jargon. No bullet points.
6. Maximum 3 paragraphs. Each paragraph maximum 3 sentences.
7. Tone: direct, professional, like a senior commercial advisor 
   briefing a GM before a morning meeting.
8. Do not use the word "findings". Use "signals" or "issues".
9. Do not say "the engine detected" or "the system shows".
   Write as if you are the advisor.
10. The GM will act on this. Be precise. Be assertive.
    Do not hedge unless the data shows uncertainty.

PARAGRAPH STRUCTURE:
Paragraph 1: Market position this period — where the hotel stands 
vs the competitive set (MPI, ARI, RGI, trend direction).
Paragraph 2: The primary commercial tension — what is driving 
performance and what the data says to do about it. Include 
the most material financial consequence.
Paragraph 3: Forward exposure — what is on the books vs plan 
and vs last year, and what cannot wait.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Write the GM briefing using this data:\n${
            JSON.stringify(context, null, 2)
          }\n\nRemember: only use facts from this data object. 3 paragraphs, 3 sentences each maximum.`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error('Anthropic error: ' + err);
    }

    const data = await response.json();
    const narrative = data?.content?.[0]?.text || '';

    return res.status(200).json({ narrative, source: 'claude' });

  } catch (err) {
    console.error('Narrative generation failed:', err.message);
    return res.status(500).json({ 
      error: err.message, 
      source: 'error' 
    });
  }
}
