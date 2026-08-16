// Vercel serverless function: /api/analyze-visa
// Deploy this alongside index.html on Vercel. Add an environment variable
// ANTHROPIC_API_KEY in your Vercel project settings (get a key at
// https://console.anthropic.com/settings/keys). Keep the key secret —
// never put it directly in index.html or any browser-side code.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ valid: false, notes: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const similarKeys = Object.keys(process.env).filter((k) => k.toUpperCase().includes("ANTHROPIC"));
    const allKeysCount = Object.keys(process.env).length;
    return res.status(500).json({
      valid: false,
      notes:
        "На сервере не настроен ANTHROPIC_API_KEY. Добавьте переменную окружения в настройках хостинга. " +
        "[Диагностика: похожих переменных найдено — " + JSON.stringify(similarKeys) +
        "; всего переменных окружения на сервере — " + allKeysCount + "]",
    });
  }

  const { image, mediaType } = req.body || {};
  if (!image) {
    return res.status(400).json({ valid: false, notes: "Изображение не получено." });
  }

  const prompt = `Ты анализируешь фотографию визовой наклейки или штампа в паспорте.
Определи поля:
- valid: true/false — похоже ли изображение на визу
- start_date: дата начала действия в формате YYYY-MM-DD, либо null
- end_date: дата окончания действия в формате YYYY-MM-DD, либо null
- entry_type: одно из "single", "double", "multiple", "unknown"
- country: страна, выдавшая визу, на русском, либо null
- visa_type: категория визы, если видно (например "туристическая"), либо null
- notes: краткий комментарий на русском, если что-то распознано нечётко или не полностью

Ответь СТРОГО валидным JSON без markdown-разметки и без текста вне JSON.`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      return res.status(502).json({ valid: false, notes: data?.error?.message || "Ошибка Anthropic API." });
    }

    const text = (data.content || []).map((b) => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ valid: false, notes: "Не удалось обработать фото. Попробуйте ещё раз." });
  }
}
