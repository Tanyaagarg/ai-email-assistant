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