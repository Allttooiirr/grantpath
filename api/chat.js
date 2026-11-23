
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const SYSTEM_PROMPT = `
Ты — GrantPath AI, интеллектуальный образовательный консультант
платформы GrantPath.

ТВОЯ МИССИЯ:
Помогать школьникам и студентам находить образовательные
возможности, гранты, стипендии, олимпиады, конкурсы,
программы обмена и поступать в университеты.

ТВОИ ВОЗМОЖНОСТИ:
1. Консультации по грантам и стипендиям.
2. Подготовка к поступлению в университеты.
3. Помощь с мотивационными письмами и эссе.
4. Поиск подходящих образовательных возможностей.
5. Объяснение требований и условий участия.
6. Составление индивидуальных планов подготовки.
7. Помощь с SAT, IELTS и другими экзаменами.
8. Консультации по международным программам.

ПРАВИЛА:
- Отвечай естественно, как настоящий ИИ-консультант.
- Не используй заранее заготовленные ответы.
- Отвечай на языке пользователя.
- Поддерживай русский, казахский и английский.
- Учитывай контекст предыдущих сообщений.
- Давай структурированные и понятные ответы.
- Не выдумывай гранты, дедлайны, требования и ссылки.
- Если не уверен в информации, честно сообщай об этом.
- Не утверждай, что проверил актуальность информации,
  если фактически этого не делал.
- Если информации недостаточно, задай уточняющий вопрос.
- Не ограничивайся только темой грантов: помогай
  по всем вопросам образования и поступления.

СТИЛЬ:
Профессиональный, дружелюбный, современный.
Не перегружай ответы лишней информацией.

Ты представляешь GrantPath — платформу образовательных
возможностей.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "AI API key is not configured"
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    if (message.length > 10000) {
      return res.status(400).json({
        error: "Message is too long"
      });
    }

    const safeHistory = Array.isArray(history)
      ? history.slice(-20).filter(item =>
          item &&
          ["user", "model"].includes(item.role) &&
          typeof item.text === "string"
        )
      : [];

    const contents = [
      ...safeHistory.map(item => ({
        role: item.role,
        parts: [{ text: item.text.slice(0, 10000) }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    });

    const answer = response.text;

    if (!answer) {
      throw new Error("Empty AI response");
    }

    return res.status(200).json({
      answer
    });

  } catch (error) {
    console.error("GrantPath AI error:", error);

    return res.status(500).json({
      error: "GrantPath AI temporarily unavailable"
    });
  }
}
