// Import necessary modules
import fs from "fs/promises";
import axios from "axios";
import User from "../models/user.model.js";
import mongoose from "mongoose";

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

const VISION_SYSTEM_PROMPT = `You are a professional photographer, visual critic, and UX-minded dating-profile consultant specialized in short, actionable photo feedback.

Return ONLY a JSON object that exactly matches the schema below. Do NOT include extra fields or any explanatory text outside the JSON.

JSON schema:
{
  "score": 1,                            // integer 1-10 overall score (rounded)
  "subscores": {                        // each integer 1-10
    "lighting": 1,
    "composition": 1,
    "expression": 1,
    "background": 1,
    "technical": 1
  },
  "score_breakdown": "string",          // show the weighted math used to compute overall score, e.g. "0.35*lighting(8)+0.25*composition(7)+... = 7"
  "confidence": 0.00,                   // float 0.0-1.0 confidence in this analysis
  "priority_issues": [                  // top 3 concrete issues, 3-8 words each, most impactful first
    "awkward horizon tilt",
    "overexposed face",
    "busy background"
  ],
  "pros": [                             // 3-6 concise strengths, 1-6 words each
    "natural smile",
    "good eye contact",
    "nice color palette"
  ],
  "cons": [                             // 3-6 concise weaknesses, 1-6 words each
    "harsh shadow on cheek",
    "cluttered background"
  ],
  "suggestions": [                      // 3-6 prioritized, each 8-20 words, actionable & concrete (no marketing copy)
    "Move subject toward north-facing window and shoot during golden hour for softer light.",
    "Step back one meter and use 35–50mm equivalent framing for natural perspective."
  ],
  "quick_tips": [                       // 2-4 one-line practical tips (6-12 words each)
    "Relax shoulders, drop chin slightly",
    "Use a plain wall 1m behind subject"
  ],
  "tags": ["outdoor", "portrait", "natural-light"], // short keywords
  "explainers": [                       // optional: 1-2 short sentences justifying major deductions, each 8-25 words
    "Harsh side shadow indicates single small light source; soften with diffuser.",
    "Busy background draws eye away from face; increase subject-background separation."
  ]
}

STRICT RULES:
- Score MUST be computed from subscores using this weighting: lighting 30%, composition 25%, expression 20%, background 15%, technical 10%. Include the math string in score_breakdown and round the final score to nearest integer.
- Subscores must be integers 1–10.
- confidence must be a decimal 0.00–1.00 (estimate model confidence).
- suggestions must be specific and actionable (mention distance, direction, equipment, or simple steps); avoid vague verbs like "improve" without instructions.
- Do NOT invent personal attributes (age, income, health) or reference image metadata.
- Avoid repetitively returning the same checklist for every image. If a suggestion is generic, include why it applies to *this* photo in explainers.
- Return only the JSON object, no markdown, no text, no code fences.
`;

/**
 * Helper that calls Groq with axios
 */
// services/credits.js

/**
 * Atomically deduct credits if:
 *  - user has >= amount credits
 *  - creditedOrders does NOT already contain orderId (idempotency)
 *
 * Uses findOneAndUpdate with condition + $inc + $addToSet so it's atomic.
 *
 * Returns:
 *  { success: true, updatedUser } on success
 *  { success: false, reason } on failure:
 *     reason = 'not_found' | 'already_processed' | 'insufficient_credits'
 */
// utils.js

export async function deductCredits(userId, amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TypeError("amount must be a positive integer (credits)");
  }

  const id = new mongoose.Types.ObjectId(userId); // normalize; optional
  const updatedUser = await User.findOneAndUpdate(
    { _id: id, credits: { $gte: amount } },
    { $inc: { credits: -amount } },
    { new: true, runValidators: true }
  ).exec();

  if (updatedUser) return updatedUser;

  // secondary checks
  const user = await User.findById(id).lean();
  if (!user) throw new Error("not_found");
  if ((user.credits ?? 0) < amount) throw new Error("insufficient_credits");
  throw new Error("unknown");
}

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
    if (req.user.credits < 4) {
      return res.status(402).json({ ok: false, error: "insufficient_credits" });
    }
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
    try {
      const updatedUser = await deductCredits(req.user._id, 4);
      // continue, updatedUser has credits
    } catch (err) {
      if (err.message === "insufficient_credits")
        return res
          .status(402)
          .json({ ok: false, error: "insufficient_credits" });
      if (err.message === "not_found")
        return res.status(404).json({ ok: false, error: "user_not_found" });
      return next(err);
    }

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
    if (req.user.credits < 1) {
      return res.status(402).json({ ok: false, error: "insufficient_credits" });
    }
    const userContent = `Hobbies: ${hobbies}\nVibe/Personality: ${vibe}\nJob/Career: ${job}\n\nWrite 3 bios for this person.`;
    const result = await callGroq(BIO_SYSTEM_PROMPT, userContent);
    try {
      const updatedUser = await deductCredits(req.user._id, 1);
      // continue, updatedUser has credits
    } catch (err) {
      if (err.message === "insufficient_credits")
        return res
          .status(402)
          .json({ ok: false, error: "insufficient_credits" });
      if (err.message === "not_found")
        return res.status(404).json({ ok: false, error: "user_not_found" });
      return next(err);
    }
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
    if (req.user.credits < 1) {
      return res.status(402).json({ ok: false, error: "insufficient_credits" });
    }
    const result = await callGroq(CHAT_SYSTEM_PROMPT, chatText);
    try {
      const updatedUser = await deductCredits(req.user._id, 1);
      // continue, updatedUser has credits
    } catch (err) {
      if (err.message === "insufficient_credits")
        return res
          .status(402)
          .json({ ok: false, error: "insufficient_credits" });
      if (err.message === "not_found")
        return res.status(404).json({ ok: false, error: "user_not_found" });
      return next(err);
    }
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

    if (req.user.credits < 4) {
      return res.status(402).json({ ok: false, error: "insufficient_credits" });
    }

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

    try {
      const updatedUser = await deductCredits(req.user._id, 4);
      // continue, updatedUser has credits
    } catch (err) {
      if (err.message === "insufficient_credits")
        return res
          .status(402)
          .json({ ok: false, error: "insufficient_credits" });
      if (err.message === "not_found")
        return res.status(404).json({ ok: false, error: "user_not_found" });
      return next(err);
    }
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
