// api/ask-ai.js
// Sintassi corretta per Vercel ESM (ECMAScript Modules)

export default async function handler(req, res) {
  // 1. Impostiamo i permessi (CORS) per far parlare il sito col server
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Se il browser chiede solo "posso connettermi?" (OPTIONS), diciamo sì e chiudiamo.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Controllo API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configurazione Server Errata: Manca GEMINI_API_KEY.' });
  }

  // 3. Controllo Metodo (Accettiamo solo POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
  }

  try {
    // 4. Leggiamo il prompt inviato dal sito
    const body = req.body;
    // Sicurezza: se il body è vuoto o non ha il prompt
    if (!body || !body.prompt) {
        return res.status(400).json({ error: 'Nessun prompt ricevuto.' });
    }

    const userPrompt = body.prompt;

    // 5. Chiamata a Google Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }]
        })
      }
    );

    const data = await response.json();

    // Se Google ci risponde con un errore
    if (!response.ok) {
      console.error("Errore Google:", data);
      return res.status(response.status).json({ error: data.error?.message || 'Errore AI Generico' });
    }

    // 6. Inviamo il risultato al tuo sito
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nessun risultato.";
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error("Errore Server Interno:", error);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}
