"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

interface AgentChatProps {
  user: User;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function AgentChat({ user, onCollapseChange }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "model",
      content: "Hey! I'm your AI running coach. How can I help you crush your goals today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);

  // Notify parent of collapse state changes
  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when chat is expanded
    if (!isCollapsed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCollapsed]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (startY.current === null || currentY.current === null) return;
    
    const deltaY = currentY.current - startY.current;
    
    // Swipe down (positive deltaY) to collapse
    if (deltaY > 50 && !isCollapsed) {
      setIsCollapsed(true);
      inputRef.current?.blur();
    }
    
    // Reset values
    startY.current = null;
    currentY.current = null;
  };

  const handleInputFocus = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      // Scroll to bottom after expanding
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  };

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (!newCollapsedState) {
      inputRef.current?.blur();
    } else {
      // Scroll to bottom when expanding
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

    const userMessage: Message = { 
      id: Date.now().toString(),
      role: "user", 
      content: inputValue,
      timestamp: new Date()
    };
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
          id: Date.now().toString(),
          role: "model",
          content: data.response,
          timestamp: new Date()
        };

        // Add tool execution info if available
        let finalMessage = assistantMessage;
        if (data.toolCalls && data.toolCalls.length > 0) {
          const toolInfo = data.toolCalls
            .map((call: any) => `🔧 Used tool: ${call.toolName}`)
            .join("\n");
          finalMessage = {
            id: Date.now().toString(),
            role: "model" as const,
            content: `${assistantMessage.content}\n\n${toolInfo}`,
            timestamp: new Date()
          };
        }

        setMessages([...newMessages, finalMessage]);
      } else {
        console.error("Agent chat error:", data.error);
        setMessages([
          ...newMessages,
          {
            id: Date.now().toString(),
            role: "model",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date()
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages([
        ...newMessages,
        {
          id: Date.now().toString(),
          role: "model",
          content:
            "Connection error. Please check your internet and try again.",
          timestamp: new Date()
        },
      ]);
    } finally {
      setIsLoading(false);
      // Refocus input after AI response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div 
      ref={chatRef}
      className={`flex flex-col justify-center items-center mb-5 w-full max-w-4xl mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl transition-all duration-300 ${
        isCollapsed ? 'h-[80px]' : 'h-[350px]'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile collapse button - always visible when expanded */}
      {!isCollapsed && (
        <div className="flex justify-end md:hidden w-full px-4 py-2">
          <button
            onClick={toggleCollapse}
            className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-600 transition"
            aria-label="Collapse chat"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        </div>
      )}

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 w-full max-h-[420px]">
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
          <div ref={messagesEndRef} />
        </div>
      )}
      <div className="h-[80px] shrink-0 border-t border-neutral-800 p-4 flex items-center gap-2 w-full">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask me to reschedule workouts, adjust training, or handle injuries..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          onFocus={handleInputFocus}
          disabled={isLoading}
          className="flex-1 bg-gray-100 text-black rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
          className="bg-gray-100 text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "..." : <span className="flex items-center justify-center">↑</span>}
        </button>
        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden md:block bg-gray-700 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-600 transition"
            aria-label="Collapse chat"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
