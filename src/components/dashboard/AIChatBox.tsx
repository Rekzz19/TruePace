"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export function AIChatBox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey! I'm Truth, your AI running coach. How can I help you today? You can ask me about rescheduling runs, training advice, or how you're feeling!",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText),
        sender: "ai",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // TODO: Replace with actual Gemini Flash integration
    if (input.includes("reschedule") || input.includes("change") || input.includes("move")) {
      return "I can help you reschedule your runs! Let me check your current schedule and find the best options. What specific run would you like to move, and what's the reason for the change?";
    }
    
    if (input.includes("tired") || input.includes("fatigue") || input.includes("exhausted")) {
      return "I hear you're feeling tired. Recovery is just as important as training! Let me adjust your schedule to include more rest days and reduce intensity for the next few days. How are you feeling overall?";
    }
    
    if (input.includes("pain") || input.includes("injury") || input.includes("hurt")) {
      return "I'm sorry to hear you're experiencing pain. Your health comes first! Let's immediately adjust your training plan. Can you tell me more about what's hurting and when it started?";
    }
    
    if (input.includes("progress") || input.includes("improving") || input.includes("better")) {
      return "Great question! Looking at your recent runs, you're making solid progress. Your consistency has improved by 15% this month. Would you like me to suggest some new challenges to keep pushing forward?";
    }
    
    if (input.includes("motivation") || input.includes("stuck") || input.includes("bored")) {
      return "I totally get it! Training ruts happen to everyone. Let's spice things up with some varied workouts and maybe a new goal. What sounds exciting to you - trying a new route, adding some intervals, or training for a specific event?";
    }
    
    return "That's interesting! I'm here to support your running journey. I can help with scheduling adjustments, training advice, or just chat about how your runs are going. What's on your mind?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="bg-[#111111] border-gray-800 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#FF6600] flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat with Truth
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "ai" && (
                <div className="w-8 h-8 bg-[#FF6600] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-black" />
                </div>
              )}
              
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-[#FF6600] text-black"
                    : "bg-[#1a1a1a] text-white border border-gray-700"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === "user" ? "text-black/70" : "text-gray-500"
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              {message.sender === "user" && (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-[#FF6600] rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-black" />
              </div>
              <div className="bg-[#1a1a1a] text-white border border-gray-700 p-3 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Truth about rescheduling, training advice, or how you're feeling..."
              className="flex-1 bg-black border-gray-700 text-white placeholder-gray-500"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="bg-[#FF6600] hover:bg-[#e65c00] text-black"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputText("Can you reschedule my run for tomorrow?")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
            >
              Reschedule Run
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputText("I'm feeling tired this week")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
            >
              Feeling Tired
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputText("How's my progress looking?")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
            >
              Check Progress
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
