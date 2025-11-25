// api/ask-ai.js
// Usiamo la sintassi standard CommonJS per massima compatibilità con Vercel

module.exports = async (req, res) => {
    // 1. Configurazione CORS (Permette al tuo sito di parlare con questo server)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Gestione della richiesta "pre-flight" (il browser controlla se può connettersi)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Recuperiamo la chiave segreta dalle impostazioni di Vercel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("ERRORE CRITICO: API Key non trovata nelle variabili d'ambiente.");
        return res.status(500).json({ error: 'Configurazione server incompleta (Manca API Key).' });
    }

    // 3. Controllo che sia una richiesta POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
    }

    try {
        // Leggiamo il messaggio inviato dal sito
        const { prompt } = req.body || {};
        
        if (!prompt) {
             return res.status(400).json({ error: 'Prompt mancante.' });
        }

        // 4. Chiamata a Google Gemini
        // Nota: Node.js 18+ su Vercel supporta 'fetch' nativamente.
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

        if (!response.ok) {
            console.error("Errore da Google:", data);
            return res.status(response.status).json({ error: data.error?.message || 'Errore AI Google' });
        }

        // Estraiamo il testo pulito
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nessuna risposta generata.";
        
        // 5. Rispondiamo al sito
        return res.status(200).json({ result: text });

    } catch (error) {
        console.error("ERRORE SERVER:", error);
        return res.status(500).json({ error: 'Errore interno del server: ' + error.message });
    }
};
