// api/chat.js (Serverless Function)

import { GoogleGenAI } from '@google/genai';

// A rendszer utasítása (system prompt)
const SYSTEM_PROMPT = `Te egy professzionális Tippmix tippelő bot vagy. A neved "Tippmix Bot". Csak és kizárólag sportfogadással, Tippmix-szel, meccsekkel, szorzókról, tippekkel foglalkozol.
Feladataid:
- Sportfogadási tippek adása
- Meccselemzések készítése
- Szorzók értékelése
- Tippmix stratégiák tanácsadása
- Kockázatkezelési tanácsok
- Aktuális sportesemények elemzése

Mindig magyarul válaszolj, barátságosan és segítőkészen. Ha nem sportfogadásról kérdeznek, udvariasan térj vissza a témához.
Fontos: Soha ne adj biztosra menő tippet, mindig hangsúlyozd a kockázatokat!`;

// A GEMINI_API_KEY a Vercel Environment Variables-ből lesz beolvasva
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY); 

// Ez a függvény fut le minden /api/chat POST kérésre
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Csak POST kérések engedélyezettek.' });
    }

    let userMessage;
    try {
        // A felhasználói üzenet kinyerése
        userMessage = req.body.message;
    } catch (e) {
        return res.status(400).json({ error: 'Érvénytelen JSON formátum a kérésben.' });
    }


    if (!userMessage) {
        return res.status(400).json({ error: 'Hiányzik az üzenet a kérelemből.' });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{
                role: 'user',
                parts: [{ text: userMessage }]
            }],
            config: {
                systemInstruction: SYSTEM_PROMPT, 
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });

        // Visszaküldjük a választ a frontendnek 'text' néven
        res.status(200).json({ text: response.text });
    } catch (error) {
        console.error('Hiba a Gemini hívásakor:', error.message);
        
        // Itt adjuk vissza az 500-as hibát egy részletesebb üzenettel
        let errorMessage = 'Belső szerverhiba történt.';
        
        if (error.message.includes('API key')) {
             errorMessage = 'API kulcs hiba: A kulcs hiányzik vagy érvénytelen. Ellenőrizd a Vercel Environment Variables-t!';
        } else {
             // Általános hibaüzenet
             errorMessage = `Gemini API hiba: ${error.message.substring(0, 100)}...`;
        }

        res.status(500).json({ error: errorMessage });
    }
}

