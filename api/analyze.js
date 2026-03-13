export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyText = Buffer.concat(chunks).toString();
    const { imageBase64, imageType, timeframe, pair } = JSON.parse(bodyText);

    const prompt = `あなたはSMC（Smart Money Concepts）とCRT（Candle Range Theory）の専門家トレーダーです。
このチャート画像（時間足: ${timeframe}${pair ? `、通貨ペア: ${pair}` : ""}）を詳しく分析してください。

以下の項目について、必ずJSON形式のみで回答してください（前置き・説明・マークダウンのコードブロック不要、純粋なJSONのみ）:

{
  "direction": "BUY" or "SELL" or "NEUTRAL",
  "confidence": 0から100の数値,
  "patterns": {
    "chochBos": { "found": true or false, "detail": "日本語で説明" },
    "ob": { "found": true or false, "detail": "日本語で説明" },
    "liquiditySweep": { "found": true or false, "detail": "日本語で説明" },
    "eqhEql": { "found": true or false, "detail": "日本語で説明" },
    "qm": { "found": true or false, "detail": "日本語で説明" },
    "sbrRbs": { "found": true or false, "detail": "日本語で説明" },
    "mss": { "found": true or false, "detail": "日本語で説明" },
    "turtleSoup": { "found": true or false, "detail": "日本語で説明" }
  },
  "entryPoint": {
    "direction": "LONG" or "SHORT",
    "zone": "エントリーゾーンの日本語説明",
    "stopLoss": "損切りの目安の日本語説明",
    "takeProfit": "利確の目安の日本語説明",
    "reasoning": "エントリー根拠の日本語説明"
  },
  "summary": "市場全体の状況を日本語で2〜3文で説明"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/v1/models/gemini-pro-vision:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: imageType || 'image/png',
                  data: imageBase64,
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1500,
          }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ error: data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();

    return res.status(200).json({ text: clean });
  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
}
