import axios from "axios";

// // ---------------------------------------------------------
// // Interfaces
// // ---------------------------------------------------------

// export interface ChatAnalysisResult {
//   redFlags: string[];
//   greenFlags: string[];
//   intent: string;
//   responses: {
//     tone: "Safe" | "Bold" | "Witty";
//     text: string;
//   }[];
// }

// export interface BioResult {
//   bios: {
//     tone: string;
//     text: string;
//   }[];
// }

// export interface DpAnalysisResult {
//   score: number;
//   pros: string[];
//   cons: string[];
// }

// ---------------------------------------------------------
// System Prompts
// ---------------------------------------------------------




// ---------------------------------------------------------
// Chat Analysis
// ---------------------------------------------------------

// services/ai.ts

/** Send a base64 data URL (string) to your /analyze-image endpoint. */
export async function analyzeDp(base64Image: string) {
  if (!base64Image || typeof base64Image !== "string") {
    throw new Error("image_required");
  }

  // quick size check (rough bytes estimate): base64 length * 3/4 ~ bytes
  const approxBytes = Math.floor((base64Image.length * 3) / 4);
  const MB = 1024 * 1024;
  if (approxBytes > 2.5 * MB) {
    // Not fatal — backend supports large payloads, but warn caller to consider multipart for reliability.
    console.warn(
      `analyzeDp: base64 payload is ~${(approxBytes / MB).toFixed(2)}MB. Consider using multipart upload (analyzeDpFile) to avoid hitting body size limits.`
    );
  }

  try {
    const resp = await axios.post("api/ai/analyze-image", { base64Image }, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = resp.data;

    if (!resp.status || resp.status < 200 || resp.status >= 300) {
      throw new Error(json?.error || `analyzeDp: ${resp.status} ${resp.statusText}`);
    }

    if (!json?.ok) {
      throw new Error(json?.error || "analyzeDp: unknown error");
    }

    return json.result;
  } catch (e) {
    if (e.response && e.response.data) {
      throw new Error(e.response.data.error || `analyzeDp: ${e.response.status} ${e.response.statusText}`);
    }
    throw new Error(`analyzeDp: ${e.message}`);
  }
}

/** Alternative: send a File as multipart/form-data to /analyze-image (preferred for bigger files). */


// ---------------------------------------------------------
// Bio Generator
// ---------------------------------------------------------

// services/ai.ts
type BiosPayload = { hobbies: string; vibe: string; job?: string };


export async function generateBios(payload: BiosPayload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("payload_required");
  }
  const { hobbies, vibe, job } = payload;
  if (!hobbies || !vibe) {
    throw new Error("hobbies_vibe_required");
  }

  try {
    const resp = await axios.post("/api/ai/generate-bios", { hobbies, vibe, job }, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = resp.data;

    if (resp.status == 401){
      return { unauthorized: true };
    }
    if (!resp.status || resp.status < 200 || resp.status >= 300) {
      throw new Error(json?.error || `generateBios: ${resp.status} ${resp.statusText}`);
    }

    if (!json?.ok) {
      throw new Error(json?.error || "generateBios: unknown error");
    }

    return json.result;
  } catch (e) {
    if (e.response && e.response.data) {
      throw new Error(e.response.data.error || `generateBios: ${e.response.status} ${e.response.statusText}`);
    }
    throw new Error(`generateBios: ${e.message}`);
  }
}


// ---------------------------------------------------------
// DP Image Analyzer (Vision)
// ---------------------------------------------------------
// services/ai.ts
export async function analyzeChatText(chatText: string) {
  if (!chatText || typeof chatText !== "string") {
    throw new Error("chatText_required");
  }

  try {
    const resp = await axios.post("api/ai/analyze-chat", { chatText });
    const json = resp.data;

    if (!json?.ok) {
      throw new Error(json?.error || "analyzeChatText: unknown error");
    }

    return json.result;
  } catch (e) {
    if (e.response && e.response.data) {
      throw new Error(e.response.data.error || `analyzeChatText: ${e.response.status} ${e.response.statusText}`);
    }
    throw new Error(`analyzeChatText: ${e.message}`);
  }
}

export async function analyzeChatImage(file: File) {
  if (!file) throw new Error("image_required");

  const fd = new FormData();
  fd.append("image", file);

  try {
    const resp = await axios.post("api/ai/analyze-chat-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const json = resp.data;

    if (!json?.ok) {
      throw new Error(json?.error || "analyzeChatImage: unknown error");
    }

    return json.result;
  } catch (e) {
    if (e.response && e.response.data) {
      throw new Error(e.response.data.error || `analyzeChatImage: ${e.response.status} ${e.response.statusText}`);
    }
    throw new Error(`analyzeChatImage: ${e.message}`);
  }
}
