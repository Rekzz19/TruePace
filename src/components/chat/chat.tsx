"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";

interface Message {
  role: "user" | "model";
  content: string;
}

interface ChatProps {
  user: User;
}

export default function Chat({ user }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Good morning! Ready for your 5km today?" },
    { role: "user", content: "Actually, my legs feel a bit heavy." },
    {
      role: "model",
      content: "Noted. I can switch today to a Recovery Run if you prefer?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          message: inputValue,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages([...newMessages, { role: "model", content: data.response }]);
      } else {
        console.error("Chat error:", data.error);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center mb-5 w-full max-w-4xl mx-auto h-90 pt-5 mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl">
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 w-full">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-orange-700 text-white rounded-br-none"
                  : "bg-neutral-800 text-gray-200 rounded-bl-none border "
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="h-[80px] shrink-0 border-t border-gray-200 p-4 flex items-center gap-2 w-full">
        <input
          type="text"
          placeholder="Talk to Truth..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          disabled={isLoading}
          className="flex-1 bg-gray-100 text-black rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
          className="bg-gray-100 text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "..." : "↑"}
        </button>
      </div>
    </div>
  );
}
