export async function POST(req: Request) {
  const { text, target } = await req.json();

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          target: target,
          format: "text",
        }),
      }
    );

    const data = await res.json();

    return Response.json({
      translated: data.data.translations[0].translatedText,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Translation failed" }, { status: 500 });
  }
}