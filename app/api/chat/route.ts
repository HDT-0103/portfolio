import { streamText } from "ai";
import { google } from "@ai-sdk/google";

// Cho phép API chạy tối đa 30s
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const messages = Array.isArray(body?.messages)
    ? body.messages
        .map((m: any) => {
          const content = Array.isArray(m?.parts)
            ? m.parts
                .filter(
                  (p: any) => p?.type === "text" && typeof p?.text === "string",
                )
                .map((p: any) => p.text)
                .join("\n")
            : typeof m?.content === "string"
              ? m.content
              : "";

          if (
            !content ||
            (m?.role !== "user" &&
              m?.role !== "assistant" &&
              m?.role !== "system")
          ) {
            return null;
          }

          return {
            role: m.role,
            content,
          };
        })
        .filter(Boolean)
    : [];

  const systemPrompt = `You are "CyberBot", the virtual assistant on Chriss's portfolio website (a Computer Science student passionate about Cybersecurity and Cloud).

Your primary goal is to understand visitor intent and guide relevant visitors to contact Chriss.

Communication rules:
1) Friendly, professional, concise (max 3 sentences per response).
2) Always end with one open-ended question to gather context.
3) If asked about Chriss's skills: briefly mention Networking, Security, C++, Python, and ISC2 CC preparation, then ask about the visitor's needs.
4) Contact guidance: once you identify who they are (HR, partner, student), suggest direct contact naturally:
   "Chriss is very interested in opportunities in this area. You can leave your email for a follow-up, or contact Chriss directly at hodinhtri3010@gmail.com / 0901364158."

Important: You are not Chriss. You are Chriss's assistant.`;

  const result = await streamText({
    model: google("gemini-1.5-flash"), // Sử dụng model nhẹ, nhanh của Google
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
