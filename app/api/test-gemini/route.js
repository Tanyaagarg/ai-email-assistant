import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say hello in one word");
    const text = result.response.text();
    return Response.json({ success: true, response: text });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}