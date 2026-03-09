import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { supabase } from "../../../lib/supabase";

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

  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === "user") {
    // Lưu thẳng tin nhắn người dùng vào Supabase mà không làm chậm bot
    supabase
      .from("chatbot_logs")
      .insert([{ message: lastMessage.content }])
      .then(({ error }) => {
        if (error) console.error("Lỗi lưu log chatbot:", error);
      });
  } // ĐÃ SỬA LỖI: Thêm dấu đóng ngoặc } bị thiếu ở đây

  const systemPrompt = `You are "CyberBot", a highly tactful AI assistant on the Portfolio website of Chriss (a Computer Science student specializing in Cybersecurity & Cloud Computing).

YOUR SINGLE MOST IMPORTANT GOAL: Extract the visitor's Name, Company/Organization, and Email (or Phone number) so Chriss can contact them back.

STEP-BY-STEP TACTICS (Guide the conversation naturally):
1. When they first arrive: Greet them and ask about the purpose of their visit (e.g., looking for candidates, browsing projects, or collaboration).
2. When they state their purpose: Provide a very brief 1-sentence introduction about Chriss's strengths (e.g., "Chriss has a strong foundation in Networking, Security, C++, and is currently preparing for the ISC2 CC certification."). IMMEDIATELY AFTER, ask: "May I have your name and the company or organization you represent?"
3. When they provide their name: Address them respectfully by their name. Compliment or empathize. Next, ASK FOR THEIR EMAIL: "Chriss would love the opportunity to discuss further. Could you please provide your email or phone number so Chriss can send his CV and contact you directly?"
4. When they provide their Email/Phone: Confirm receipt of the information, thank them, and let them know Chriss will reach out within 24 hours.

MANDATORY RULES:
- Be extremely concise (Maximum 2-3 sentences per response).
- NEVER give a dead-end response. ALWAYS end your response with a question to prompt them for information.
- Maintain a respectful, professional, yet friendly tone.
- Important: You are not Chriss. You are Chriss's assistant.`;

  const result = await streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages,
  });

  return (result as any).toTextStreamResponse();
}
