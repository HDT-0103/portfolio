"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import type { UIMessage } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const initialMessages: UIMessage[] = [
    {
      id: "welcome-msg",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "Hi! I'm Tri's AI assistant. Are you visiting the website to search for candidates, or just browsing projects?",
        },
      ],
    },
  ];

  const { messages, status, sendMessage } = useChat({
    transport: new TextStreamChatTransport({ api: "/api/chat" }),
    messages: initialMessages,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || status === "submitted" || status === "streaming") return;

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: content }],
    });

    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-opacity ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-125 max-h-[80vh] bg-slate-950/95 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white font-semibold text-sm">
                  Tri's AI Bot Assistant
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-800">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-cyan-500 text-slate-950 rounded-br-none"
                        : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700"
                    }`}
                  >
                    {(m as any).content ||
                      m.parts
                        ?.filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("\n")}
                  </div>
                </div>
              ))}
              {status === "submitted" || status === "streaming" ? (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-400 px-4 py-2.5 rounded-2xl rounded-bl-none text-xs flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-950 border border-slate-800 text-sm text-slate-200 rounded-full px-4 py-2.5 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="submit"
                disabled={
                  !input.trim() ||
                  status === "submitted" ||
                  status === "streaming"
                }
                className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center hover:brightness-110 disabled:opacity-50 transition-all"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
