// api/ask-ai.js
export default async function handler(req, res) {
  // 1. Configurazione CORS (Standard per Vercel)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Gestione pre-flight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Verifica API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Errore Server: Manca API Key.' });
  }

  // 3. Verifica Metodo
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito.' });
  }

  try {
    const body = req.body;
    if (!body || !body.prompt) {
        return res.status(400).json({ error: 'Prompt mancante.' });
    }

    // --- PUNTO CRITICO RISOLTO ---
    // Usiamo "gemini-pro". È il modello standard, stabile e disponibile per tutti.
    // Se questo fallisce, il problema è la Chiave API stessa (non abilitata).
    const model = 'gemini-pro';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
      // Questo log ci aiuterà a capire se c'è un altro problema
      return res.status(response.status).json({ error: data.error?.message || 'Errore AI Generico' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nessun risultato generato.";
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error("Errore Server:", error);
    return res.status(500).json({ error: error.message });
  }
}
