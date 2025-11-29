import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, BookOpen, Heart } from "lucide-react";
import { auth } from "@/FirebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { toast } from "@/components/ui/use-toast";

const moods = [
  { value: "happy", label: "😊 Happy", color: "bg-yellow-100 text-yellow-800" },
  { value: "calm", label: "😌 Calm", color: "bg-blue-100 text-blue-800" },
  { value: "neutral", label: "😐 Neutral", color: "bg-gray-100 text-gray-800" },
  { value: "anxious", label: "😰 Anxious", color: "bg-orange-100 text-orange-800" },
  { value: "sad", label: "😢 Sad", color: "bg-purple-100 text-purple-800" },
  { value: "stressed", label: "😓 Stressed", color: "bg-red-100 text-red-800" },
];

interface JournalEntry {
  date: string;
  mood: string;
  note: string;
  timestamp: string;
}

const Journal = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadEntries(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadEntries = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/journal/${userId}`);
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error("Failed to load entries:", error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save journal entries.",
      });
      return;
    }

    if (!selectedMood) {
      toast({
        title: "Select a mood",
        description: "Please select how you're feeling.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Save mood
      await fetch("http://localhost:5001/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          mood: selectedMood,
          note: note,
        }),
      });

      // Save journal entry
      await fetch("http://localhost:5001/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          entry: note,
        }),
      });

      toast({
        title: "Entry saved!",
        description: "Your mood and journal entry have been saved.",
      });

      setSelectedMood("");
      setNote("");
      loadEntries(user.uid);
    } catch (error) {
      console.error("Failed to save:", error);
      toast({
        title: "Error",
        description: "Failed to save your entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold md:text-4xl">Mood Journal</h1>
            </div>
            <p className="text-muted-foreground">
              Track your daily mood and reflect on your feelings
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{today}</span>
            </div>
          </div>

          <Card className="mb-6 animate-fade-in">
            <CardHeader>
              <CardTitle>How are you feeling today?</CardTitle>
              <CardDescription>
                Take a moment to check in with yourself
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mood</Label>
                <Select value={selectedMood} onValueChange={setSelectedMood}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {moods.map((mood) => (
                      <SelectItem key={mood.value} value={mood.value}>
                        {mood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Journal Entry (Optional)</Label>
                <Textarea
                  placeholder="What's on your mind? How are you feeling? What happened today?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={loading || !selectedMood}
                className="w-full bg-cta-blue hover:bg-cta-blue/90"
              >
                <Heart className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Entry"}
              </Button>
            </CardContent>
          </Card>

          {entries.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-2xl font-bold">Recent Entries</h2>
              {entries
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5)
                .map((entry, index) => {
                  const mood = moods.find((m) => m.value === entry.mood);
                  const entryDate = new Date(entry.timestamp);
                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {mood && (
                              <span className={`px-2 py-1 rounded text-sm ${mood.color}`}>
                                {mood.label}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {entryDate.toLocaleDateString()}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                            {entry.note}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Journal;

