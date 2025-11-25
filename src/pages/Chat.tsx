import { useState } from "react";
import { Send } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm MindMate, your calm AI companion. How are you feeling today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Send message to backend and update UI
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent form reload
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: Date.now(),
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue(""); // clear input immediately
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            content: m.text,
          })),
        }),
      });

      const data = await response.json();

      const aiMessage: Message = {
        id: Date.now() + 1,
        text:
          data.reply ||
          "I'm here with you — could you tell me a bit more about that?",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (data.mood) {
        localStorage.setItem(
          "lastMood",
          JSON.stringify({ mood: data.mood, date: new Date().toISOString() })
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      const fallbackMessage: Message = {
        id: Date.now() + 2,
        text:
          "I'm having a little trouble connecting right now. Could you try again?",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 animate-fade-in">
            <h1 className="text-3xl font-bold md:text-4xl">Chat with MindMate</h1>
            <p className="mt-2 text-muted-foreground">
              Share your thoughts — MindMate will listen and respond with care.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card shadow-sm animate-fade-in">
            <ScrollArea className="h-[calc(100vh-20rem)] p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === "user"
                          ? "bg-cta-blue text-white"
                          : "bg-primary/10 text-foreground"
                      }`}
                    >
                      <p className="text-sm md:text-base whitespace-pre-wrap">
                        {message.text}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <p className="text-sm text-muted-foreground italic">
                    MindMate is thinking...
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* ✅ Wrapping input + button in a form for Enter key submission */}
            <form
              onSubmit={handleSend}
              className="border-t border-border p-4 flex gap-2 items-center"
            >
              <Input
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                className="bg-cta-blue hover:bg-cta-blue/90"
                disabled={loading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
