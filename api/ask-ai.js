/api/ask-ai.js
export default async function handler(req, res) {
  // 1. Abilita CORS (per permettere al frontend di chiamare questo script)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Gestione pre-flight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Controllo metodo
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
  }

  // 3. Recupera la chiave dall'ambiente sicuro (lato server)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Error: API Key mancante nella configurazione.' });
  }

  try {
    const { prompt } = req.body;

    // 4. Chiama Google Gemini (Server to Server)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    // 5. Restituisci il risultato al tuo sito
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Errore AI' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nessun testo generato.";
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}
