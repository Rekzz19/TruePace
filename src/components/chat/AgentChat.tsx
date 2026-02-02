"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";

interface Message {
  role: "user" | "model";
  content: string;
}

interface AgentChatProps {
  user: User;
}

export default function AgentChat({ user }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content:
        "Hi! I'm your TruePace AI coach. I can help you reschedule workouts, adjust your training plan, and handle injury concerns. What would you like to work on?",
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
      const response = await fetch("/api/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          messages: newMessages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          role: "model",
          content: data.response,
        };

        // Add tool execution info if available
        let finalMessage = assistantMessage;
        if (data.toolCalls && data.toolCalls.length > 0) {
          const toolInfo = data.toolCalls
            .map((call: any) => `🔧 Used tool: ${call.toolName}`)
            .join("\n");
          finalMessage = {
            role: "model" as const,
            content: `${assistantMessage.content}\n\n${toolInfo}`,
          };
        }

        setMessages([...newMessages, finalMessage]);
      } else {
        console.error("Agent chat error:", data.error);
        setMessages([
          ...newMessages,
          {
            role: "model",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages([
        ...newMessages,
        {
          role: "model",
          content:
            "Connection error. Please check your internet and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center mb-5 w-full max-w-4xl mx-auto h-90 pt-5 mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl">
      <div className="flex items-center justify-between w-full px-4 py-2 border-b border-neutral-800">
        <h3 className="text-white font-medium">AI Coach Agent</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Active</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 w-full">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-neutral-800 text-gray-200 rounded-bl-none border border-neutral-700"
              }`}
            >
              {msg.content.split("\n").map((line, j) => (
                <div key={j}>{line}</div>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 text-gray-200 rounded-2xl rounded-bl-none border border-neutral-700 px-4 py-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-20 shrink-0 border-t border-neutral-800 p-4 flex items-center gap-2 w-full">
        <input
          type="text"
          placeholder="Ask me to reschedule workouts, adjust training, or handle injuries..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
          className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
