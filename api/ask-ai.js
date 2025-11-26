// api/ask-ai.js
export default async function handler(req, res) {
  // 1. Permessi CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Manca API Key.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito.' });
  }

  try {
    const body = req.body;
    if (!body || !body.prompt) {
        return res.status(400).json({ error: 'Nessun prompt.' });
    }

    // --- MODIFICA IMPORTANTE QUI SOTTO ---
    // Abbiamo cambiato il modello in 'gemini-1.5-flash-latest' che è più stabile
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: body.prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Errore Google:", data);
      // Se anche questo fallisce, l'errore ci dirà quali modelli sono disponibili
      return res.status(response.status).json({ error: data.error?.message || 'Errore AI' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nessun risultato.";
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error("Crash Server:", error);
    return res.status(500).json({ error: error.message });
  }
}
