const axios = require('axios');

const SYSTEM_PROMPT = `You are CineBot, an expert movie recommendation assistant for the CineMatch platform.
You have deep knowledge of films across all genres, eras, and countries.
Be conversational, enthusiastic, and specific. When recommending movies:
- Always mention 2-4 specific titles with their release year
- Briefly explain WHY each movie fits the request
- Keep responses concise (2-4 sentences max)
- Use a friendly, movie-lover tone
- If you mention a movie, format it as [Movie Title](tmdbId) when you know the TMDB ID
- Do NOT use markdown headers or bullet lists — write in natural prose
Do not discuss anything unrelated to movies or entertainment.`;

/**
 * POST /api/chatbot/chat
 * Body: { messages: [{role, content}] }
 *
 * Uses an AI API to generate movie recommendations.
 * Falls back gracefully if no API key is configured.
 */
exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // ── Option A: Use Anthropic Claude API ────────────────────────────────────
    if (process.env.ANTHROPIC_API_KEY) {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const reply = response.data.content[0]?.text || 'Sorry, I had trouble thinking of a response!';
      return res.json({ reply });
    }

    // ── Option B: Use OpenAI API ──────────────────────────────────────────────
    if (process.env.OPENAI_API_KEY) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          max_tokens: 300,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          timeout: 10000,
        }
      );

      const reply = response.data.choices[0]?.message?.content || 'I had trouble responding!';
      return res.json({ reply });
    }

    // ── No AI key: structured rule-based fallback ─────────────────────────────
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const reply = getRuleBasedReply(lastMsg);
    return res.json({ reply, source: 'rule-based' });

  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.status(500).json({ error: 'CineBot is having a moment. Try again!' });
  }
};

function getRuleBasedReply(text) {
  if (text.includes('thriller'))
    return "For thrillers, I'd recommend Gone Girl (2014), Prisoners (2013), and Parasite (2019). Each delivers relentless tension in completely different ways!";
  if (text.includes('comedy') || text.includes('funny'))
    return "Need laughs? The Grand Budapest Hotel (2014) is pure wit, while Game Night (2018) is non-stop fun. What We Do in the Shadows is brilliantly absurd!";
  if (text.includes('sci-fi') || text.includes('space'))
    return "Sci-fi gold: Arrival (2016) will haunt you, Blade Runner 2049 (2017) is visually stunning, and Annihilation (2018) is genuinely unsettling. All masterpieces!";
  if (text.includes('horror'))
    return "For horror: Hereditary (2018) is the scariest family drama ever made, Get Out (2017) is brilliantly sharp, and The Witch (2015) is atmospheric dread at its best.";
  if (text.includes('romance') || text.includes('love'))
    return "Romance picks: Past Lives (2023) is heartbreakingly beautiful, Before Sunrise (1995) is endlessly charming, and Eternal Sunshine of the Spotless Mind is unforgettable.";
  if (text.includes('action'))
    return "Action must-sees: Mad Max: Fury Road (2015) is relentless, John Wick (2014) redefined action choreography, and Everything Everywhere All at Once (2022) is wildly inventive!";
  return "I'd love to help! Tell me a genre you enjoy, a movie you loved recently, or how you're feeling — I'll find your perfect watch. 🎬";
}
