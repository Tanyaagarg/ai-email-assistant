import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.1-8b-instant";

export async function analyzeFullEmail(subject, from, snippet) {
  try {
    const prompt = `Analyze this email and respond in exactly this JSON format:
{"summary": "one short sentence", "priority": "High", "deadline": "none", "category": "Updates", "actionItems": ["task 1", "task 2"]}

- summary: one short sentence (max 15 words) describing the email
- priority: must be one of: High, Medium, Low
  (High = urgent/action needed/deadlines, Medium = needs response, Low = newsletters/promotions)
- deadline: any deadline mentioned (e.g. "by Friday") or "none"
- category: must be one of: Work, Personal, Promotions, Social, Updates
  (Work = jobs/meetings/projects, Personal = friends/family, Promotions = sales/marketing, Social = LinkedIn/Instagram/social networks, Updates = receipts/notifications/newsletters)
- actionItems: a list of short to-do tasks the reader must do (e.g. "Submit documents by Friday", "Confirm attendance"). If there is nothing to do, return an empty list [].

Email:
From: ${from}
Subject: ${subject}
Preview: ${snippet}

Respond with only the JSON, nothing else.`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const json = JSON.parse(completion.choices[0].message.content);
    return {
      summary: json.summary || "Summary unavailable",
      priority: json.priority || "Medium",
      deadline: json.deadline || "none",
      category: json.category || "Updates",
      actionItems: Array.isArray(json.actionItems) ? json.actionItems : [],
    };
  } catch (error) {
    console.log("Groq error:", error.message);
    return { summary: "Summary unavailable", priority: "Medium", deadline: "none", category: "Updates", actionItems: [] };
  }
}

export async function generateReply(subject, from, snippet) {
  try {
    const prompt = `Write a short, professional reply to this email in 2-3 sentences. Be polite and natural.

From: ${from}
Subject: ${subject}
Preview: ${snippet}

Write only the reply text, no subject line, no "Dear" or sign-off needed.`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    return "Thank you for your email. I will get back to you shortly.";
  }
}