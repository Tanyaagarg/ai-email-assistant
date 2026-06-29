import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function summarizeEmail(subject, from, snippet) {
  try {
    const prompt = `Summarize this email in one short sentence (max 15 words):\nFrom: ${from}\nSubject: ${subject}\nPreview: ${snippet}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    return "Summary unavailable";
  }
}

export async function analyzeEmail(subject, from, snippet) {
  try {
    const prompt = `Analyze this email and respond in exactly this JSON format:
{"priority": "High", "deadline": "none"}

Priority must be one of: High, Medium, Low
- High: urgent, action required, deadlines, important alerts
- Medium: needs response but not urgent
- Low: newsletters, promotions, notifications

Deadline: extract any deadline mentioned (e.g. "by Friday", "due June 30") or write "none"

Email:
From: ${from}
Subject: ${subject}
Preview: ${snippet}

Respond with only the JSON, nothing else.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const json = JSON.parse(text);
    return { priority: json.priority || "Medium", deadline: json.deadline || "none" };
  } catch (error) {
    return { priority: "Medium", deadline: "none" };
  }
}

export async function generateReply(subject, from, snippet) {
  try {
    const prompt = `Write a short, professional reply to this email in 2-3 sentences. Be polite and natural.

From: ${from}
Subject: ${subject}
Preview: ${snippet}

Write only the reply text, no subject line, no "Dear" or sign-off needed.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    return "Thank you for your email. I will get back to you shortly.";
  }
}