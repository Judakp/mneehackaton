// netlify/functions/gemini-proxy.ts
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // On récupère la clé depuis les variables d'environnement de Netlify (pas du client !)
  const API_KEY = process.env.GEMINI_API_KEY;

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // On fait l'appel à l'API Google depuis ici (le serveur)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch Gemini" }) };
  }
};