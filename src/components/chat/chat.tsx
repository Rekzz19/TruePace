"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";

interface Message {
  role: "user" | "model";
  content: string;
}

interface ChatProps {
  user: User;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Chat({ user, onCollapseChange }: ChatProps) {
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

  // This Chat component is read-only and not connected to the AI agent input.

  return (
    <div
      ref={chatRef}
      className={`flex flex-col justify-center items-center mb-5 w-full max-w-4xl mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl transition-all duration-300 ${
        isCollapsed ? "h-[80px]" : "h-[400px]"
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
                  d="M19 9l-7 7-7-7"
                />
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
                    ? "bg-orange-700 text-white rounded-br-none"
                    : "bg-neutral-800 text-gray-200 rounded-bl-none border "
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      <div className="h-[80px] shrink-0 border-t border-gray-200 p-4 flex items-center gap-2 w-full">
        <div className="flex-1 text-sm text-muted-foreground">
          This chat view is read-only. Use the agent chat panel for AI
          interactions.
        </div>
        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden md:block bg-gray-700 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-600 transition"
            aria-label="Collapse chat"
          >
            <span className="flex items-center justify-center">
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
