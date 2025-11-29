import { useState, useEffect } from "react";
import { Send, AlertTriangle, Phone, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/FirebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  crisisDetected?: boolean;
}

const Chat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm MindMate, your compassionate AI mental health coach. How are you feeling today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [crisisResources, setCrisisResources] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Save session when messages change (debounced)
  useEffect(() => {
    if (!user || messages.length < 2) return; // Don't save initial greeting

    const saveSession = async () => {
      try {
        await fetch("http://localhost:5001/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            messages: messages.map((m) => ({
              role: m.sender === "user" ? "user" : "model",
              content: m.text,
            })),
          }),
        });
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    };

    // Debounce: save 2 seconds after last message
    const timer = setTimeout(saveSession, 2000);
    return () => clearTimeout(timer);
  }, [messages, user]);

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
          userId: user?.uid || "anonymous",
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
        crisisDetected: data.crisisDetected || false,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Handle crisis detection
      if (data.crisisDetected) {
        setShowCrisisAlert(true);
        setCrisisResources(data.resources);
      }

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

          {showCrisisAlert && crisisResources && (
            <Alert variant="destructive" className="mb-4 animate-fade-in">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Immediate Support Available</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-2">
                  <p>If you're in immediate danger, please call emergency services (911 in US).</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {crisisResources.hotline && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-50 hover:bg-red-100"
                        onClick={() => window.open(`tel:${crisisResources.hotline}`)}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call {crisisResources.hotline}
                      </Button>
                    )}
                    {crisisResources.textLine && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-50 hover:bg-red-100"
                        onClick={() => window.open(`sms:${crisisResources.textLine}`)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Text {crisisResources.textLine}
                      </Button>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

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
                          : message.crisisDetected
                          ? "bg-red-50 border-2 border-red-200 text-foreground"
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
