export async function POST(req: Request) {
  const { text, texts, target } = await req.json();

  // Support both a single string (text) and a batch array (texts)
  const queries: string[] = texts ?? (text ? [text] : []);

  if (queries.length === 0) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: queries,   // Google accepts a single string or an array here
          target,
          format: "text",
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("Google Translate error:", err);
      return Response.json({ error: "Translation failed" }, { status: 500 });
    }

    const data = await res.json();
    const translatedTexts: string[] = data.data.translations.map(
      (t: { translatedText: string }) => t.translatedText
    );

    return Response.json({
      // Batch callers use translatedTexts; legacy single callers use translatedText
      translatedTexts,
      translatedText: translatedTexts[0],
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Translation failed" }, { status: 500 });
  }
}