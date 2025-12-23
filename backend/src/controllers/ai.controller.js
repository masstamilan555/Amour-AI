// Import necessary modules
import fs from "fs/promises";
import axios from "axios";

const CHAT_SYSTEM_PROMPT = `
You are an expert dating coach and behavioral analyst.
Analyze the provided screenshot of chat log.
Return ONLY a raw JSON object with this structure:
{
  "redFlags": ["short", "phrases", "max 5 words each"],
  "greenFlags": ["short", "phrases", "max 5 words each"],
  "intent": "A 1-sentence summary of what the other person is really thinking/feeling.",
  "responses": [
    {"tone": "Safe", "text": "A short polite reply"},
    {"tone": "Bold", "text": "A short flirtatious/direct reply"},
    {"tone": "Witty", "text": "A short playful reply"}
  ]
}
IMPORTANT RULES:
- Each item in redFlags and greenFlags MUST be a short phrase of **no more than 5 words** (preferably 1–3 words).
- Do NOT use full sentences for flags. Use concise noun phrases like "clingy behavior", "playful banter".
- Return ONLY the JSON object. No explanations, no markdown, no code fences.
`;

const BIO_SYSTEM_PROMPT = `
You are a professional dating profile copywriter hired to create short, on-brand bios.
Return ONLY a raw JSON object with this exact structure:
{
  "bios": [
    {"tone": "Funny", "text": "A bio using humor and wit. Max 300 characters."},
    {"tone": "Mysterious", "text": "A bio that creates intrigue. Max 300 characters."},
    {"tone": "Direct", "text": "A confident, straight-to-the-point bio. Max 300 characters."}
  ]
}
STRICT RULES:
- Produce exactly three bio objects in the order: Funny, Mysterious, Direct.
- Each "text" MUST be between 30 and 300 characters inclusive.
- Do NOT include hashtags, emojis, or line breaks. Use complete sentences or short fragments only.
- Use the user's input (hobbies, vibe, job) to personalize each bio; do NOT invent additional personal facts.
- Keep language natural, current, and dating-app appropriate.
- Return ONLY the JSON object. No explanations, no markdown, no code fences, no extra fields.
`;

const VISION_SYSTEM_PROMPT = `
You are a professional photographer and dating profile consultant.
Analyze the provided profile photo and return EXACTLY one raw JSON object with this structure:
{
  "score": 7,                 // integer 1-10 (1 = very poor, 10 = excellent)
  "pros": ["short", "phrases"], // 3-6 concise strengths, each 1-5 words
  "cons": ["short", "phrases"], // 3-6 concise improvements, each 1-6 words
  "suggestions": ["short actionable tips"] // 1-3 practical tips (6-15 words each)
}
STRICT RULES:
- score MUST be an integer between 1 and 10.
- pros, cons: arrays of concise noun phrases (prefer 1–4 words per item). No sentences.
- suggestions: short actionable tips, each 6–15 words. No marketing copy.
- Do NOT mention clothing brands, or guess private attributes (age, health, income).
- Do NOT return image metadata, policy text, or any explanation—ONLY the JSON.
`;

/**
 * Helper that calls Groq with axios
 */
async function callGroq(prompt, userContent, apiKey) {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not configured on server.");

  try {
    const body = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
    };

    const resp = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      body,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = resp.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq API");

    let text = content.trim();
    if (text.startsWith("```json")) text = text.replace(/^```json\s*/, "");
    else if (text.startsWith("```")) text = text.replace(/^```\s*/, "");
    if (text.endsWith("```")) text = text.replace(/```\s*$/, "");

    return JSON.parse(text);
  } catch (err) {
    // normalize axios error to useful message
    if (err.response) {
      const { status, statusText, data } = err.response;
      throw new Error(
        `Groq API Error: ${status} ${statusText} - ${JSON.stringify(data)}`
      );
    }
    throw err;
  }
}

export const analyzeProfileImage = async (req, res, next) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey)
      return res.status(500).json({ ok: false, error: "server_misconfigured" });

    let dataUrl;

    // Option 1: JSON body with base64 data URL
    if (req.body?.base64Image && typeof req.body.base64Image === "string") {
      dataUrl = req.body.base64Image;
    }

    // Option 2: multipart form upload (multer)
    if (!dataUrl && req.file) {
      const buf = req.file.buffer || (await fs.readFile(req.file.path));
      const mime = req.file.mimetype || "image/jpeg";
      const b64 = buf.toString("base64");
      dataUrl = `data:${mime};base64,${b64}`;
    }

    if (!dataUrl)
      return res.status(400).json({ ok: false, error: "image_required" });

    // NOTE: many vision endpoints prefer a publicly-accessible URL (not huge base64 payloads).
    // This endpoint follows your original pattern: send image as an image_url item with the data URL.
    const body = {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this dating profile photo." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
    };

    const resp = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      body,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        maxBodyLength: Infinity, // important for large base64 payloads
      }
    );

    let content = resp.data?.choices?.[0]?.message?.content;
    if (!content)
      return res
        .status(500)
        .json({ ok: false, error: "empty_vision_response" });

    content = content.trim();
    if (content.startsWith("```json"))
      content = content.replace(/^```json\s*/, "");
    else if (content.startsWith("```"))
      content = content.replace(/^```\s*/, "");
    if (content.endsWith("```")) content = content.replace(/```\s*$/, "");

    const parsed = JSON.parse(content);
    return res.json({ ok: true, result: parsed });
  } catch (err) {
    next(err);
  }
};

export const generateBios = async (req, res, next) => {
  try {
    const { hobbies, vibe, job } = req.body;
    if (!hobbies || !vibe || !job) {
      return res
        .status(400)
        .json({ ok: false, error: "hobbies_vibe_job_required" });
    }
    const userContent = `Hobbies: ${hobbies}\nVibe/Personality: ${vibe}\nJob/Career: ${job}\n\nWrite 3 bios for this person.`;
    const result = await callGroq(BIO_SYSTEM_PROMPT, userContent);
    return res.json({ ok: true, result });
  } catch (err) {
    next(err);
  }
};

export const analyzeChat = async (req, res, next) => {
  try {
    const { chatText } = req.body;
    if (!chatText || typeof chatText !== "string") {
      return res.status(400).json({ ok: false, error: "chatText_required" });
    }
    const result = await callGroq(CHAT_SYSTEM_PROMPT, chatText);
    return res.json({ ok: true, result });
  } catch (err) {
    next(err);
  }
};

export const analyzeChatImage = async (req, res, next) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey)
      return res.status(500).json({ ok: false, error: "server_misconfigured" });

    let dataUrl;

    // Option 1: JSON body with base64 data URL
    if (req.body?.base64Image && typeof req.body.base64Image === "string") {
      dataUrl = req.body.base64Image;
    }

    // Option 2: multipart form upload (multer)
    if (!dataUrl && req.file) {
      const buf = req.file.buffer || (await fs.readFile(req.file.path));
      const mime = req.file.mimetype || "image/jpeg";
      const b64 = buf.toString("base64");
      dataUrl = `data:${mime};base64,${b64}`;
    }

    if (!dataUrl)
      return res.status(400).json({ ok: false, error: "image_required" });

    // Build request similar to analyzeProfileImage but use CHAT_SYSTEM_PROMPT
    const body = {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this chat screenshot and return the JSON schema.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
    };

    const resp = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      body,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        maxBodyLength: Infinity,
      }
    );

    let content = resp.data?.choices?.[0]?.message?.content;
    if (!content)
      return res
        .status(500)
        .json({ ok: false, error: "empty_vision_response" });

    content = content.trim();
    if (content.startsWith("```json"))
      content = content.replace(/^```json\s*/, "");
    else if (content.startsWith("```"))
      content = content.replace(/^```\s*/, "");
    if (content.endsWith("```")) content = content.replace(/```\s*$/, "");

    const parsed = JSON.parse(content);
    return res.json({ ok: true, result: parsed });
  } catch (err) {
    // normalize axios error like you already do in callGroq
    if (err.response) {
      const { status, statusText, data } = err.response;
      return next(
        new Error(
          `Groq API Error: ${status} ${statusText} - ${JSON.stringify(data)}`
        )
      );
    }
    next(err);
  }
};
