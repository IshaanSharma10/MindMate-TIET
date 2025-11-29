import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  TrendingUp, 
  Calendar, 
  Lightbulb, 
  Activity, 
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Brain
} from "lucide-react";
import { auth } from "@/FirebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { toast } from "@/components/ui/use-toast";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const moods = [
  { value: "happy", label: "😊 Happy", color: "bg-yellow-100 text-yellow-800 border-yellow-200", score: 90 },
  { value: "calm", label: "😌 Calm", color: "bg-blue-100 text-blue-800 border-blue-200", score: 75 },
  { value: "neutral", label: "😐 Neutral", color: "bg-gray-100 text-gray-800 border-gray-200", score: 50 },
  { value: "anxious", label: "😰 Anxious", color: "bg-orange-100 text-orange-800 border-orange-200", score: 30 },
  { value: "sad", label: "😢 Sad", color: "bg-purple-100 text-purple-800 border-purple-200", score: 20 },
  { value: "stressed", label: "😓 Stressed", color: "bg-red-100 text-red-800 border-red-200", score: 25 },
];

const MoodTracker = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [moodNote, setMoodNote] = useState("");
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [moodPatterns, setMoodPatterns] = useState<any>(null);
  const [aiMoodDetection, setAiMoodDetection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadMoodHistory(currentUser.uid);
        loadMoodPatterns(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadMoodHistory = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/moods/${userId}`);
      const data = await response.json();
      setMoodHistory(data.moods || []);
    } catch (error) {
      console.error("Failed to load mood history:", error);
    }
  };

  const loadMoodPatterns = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/mood-patterns/${userId}`);
      const data = await response.json();
      setMoodPatterns(data);
    } catch (error) {
      console.error("Failed to load mood patterns:", error);
    }
  };

  const detectMoodFromText = async (text: string) => {
    if (!text.trim()) {
      toast({
        title: "Please enter some text",
        description: "Describe how you're feeling to detect your mood.",
        variant: "destructive",
      });
      return;
    }
    
    setAnalyzing(true);
    try {
      const response = await fetch("http://localhost:5001/api/detect-mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.detectedMood) {
        setAiMoodDetection(data.detectedMood);
        setSelectedMood(data.detectedMood);
        
        toast({
          title: "Mood Detected! 🎯",
          description: `Based on your text, you seem to be feeling ${data.detectedMood}. You can adjust this if needed.`,
        });
      } else {
        throw new Error("No mood detected in response");
      }
    } catch (error: any) {
      console.error("Mood detection failed:", error);
      toast({
        title: "Detection Failed",
        description: error.message || "Could not detect mood. Please select manually.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMood = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save your mood.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Choose how you're feeling to track your mood.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          mood: selectedMood,
          note: moodNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Mood Saved! ✅",
          description: "Your mood has been recorded. Keep tracking to see patterns!",
        });
        setSelectedMood("");
        setMoodNote("");
        setAiMoodDetection(null);
        await loadMoodHistory(user.uid);
        await loadMoodPatterns(user.uid);
      } else {
        throw new Error("Failed to save mood");
      }
    } catch (error: any) {
      console.error("Failed to save mood:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your mood. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = moodHistory
    .slice(-14)
    .map((entry) => {
      const mood = moods.find((m) => m.value === entry.mood);
      return {
        date: new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        mood: entry.mood,
        score: mood?.score || 50,
      };
    });

  const getMoodRecommendations = (mood: string) => {
    const recommendations: Record<string, { title: string; description: string; action: string }[]> = {
      anxious: [
        { title: "Try Box Breathing", description: "4-4-4-4 breathing pattern helps calm anxiety", action: "/breathing" },
        { title: "Practice Grounding", description: "5-4-3-2-1 technique: Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste", action: "" },
        { title: "Take a Walk", description: "Physical movement helps reduce anxiety", action: "" },
      ],
      stressed: [
        { title: "4-7-8 Breathing", description: "Deep breathing technique for stress relief", action: "/breathing" },
        { title: "Break Tasks Down", description: "Divide overwhelming tasks into smaller steps", action: "" },
        { title: "Take a Break", description: "Step away for 10 minutes to reset", action: "" },
      ],
      sad: [
        { title: "Connect with Nature", description: "Spend time outside, even for 5 minutes", action: "" },
        { title: "Practice Gratitude", description: "Write down 3 things you're grateful for", action: "/journal" },
        { title: "Talk to MindMate", description: "Share your feelings in a safe space", action: "/chat" },
      ],
      happy: [
        { title: "Maintain the Momentum", description: "Continue activities that bring you joy", action: "" },
        { title: "Share Your Joy", description: "Connect with others and spread positivity", action: "" },
        { title: "Set New Goals", description: "Channel positive energy into new challenges", action: "" },
      ],
      calm: [
        { title: "Maintain Mindfulness", description: "Continue your current practices", action: "/breathing" },
        { title: "Reflect on What Works", description: "Journal about what helps you stay calm", action: "/journal" },
      ],
      neutral: [
        { title: "Explore Activities", description: "Try new things to discover what brings you joy", action: "" },
        { title: "Check In Regularly", description: "Track your mood to identify patterns", action: "" },
      ],
    };
    return recommendations[mood] || [];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold md:text-4xl">Mood Tracker</h1>
            </div>
            <p className="text-muted-foreground">
              Track your emotions, discover patterns, and get personalized support
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            {/* Quick Mood Check-in */}
            <Card className="lg:col-span-2 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  How are you feeling right now?
                </CardTitle>
                <CardDescription>
                  Check in with yourself and track your mood
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Mood Detection from Text */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Or describe how you feel (AI will detect your mood)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., 'I feel overwhelmed and tired today'"
                      value={moodNote}
                      onChange={(e) => {
                        setMoodNote(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && moodNote.trim() && !analyzing) {
                          e.preventDefault();
                          detectMoodFromText(moodNote);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        detectMoodFromText(moodNote);
                      }}
                      disabled={!moodNote.trim() || analyzing}
                      variant="outline"
                      type="button"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      {analyzing ? "Analyzing..." : "Detect"}
                    </Button>
                  </div>
                  {aiMoodDetection && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span>Detected mood: <strong>{moods.find(m => m.value === aiMoodDetection)?.label}</strong></span>
                    </div>
                  )}
                </div>

                {/* Mood Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select your mood</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {moods.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => setSelectedMood(mood.value)}
                        className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                          selectedMood === mood.value
                            ? `${mood.color} ring-2 ring-primary`
                            : `${mood.color} opacity-70 hover:opacity-100`
                        }`}
                      >
                        <div className="text-2xl mb-1">{mood.label.split(" ")[0]}</div>
                        <div className="text-sm font-medium">{mood.label.split(" ")[1]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    saveMood();
                  }}
                  disabled={loading || !selectedMood}
                  className="w-full bg-cta-blue hover:bg-cta-blue/90"
                  type="button"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Mood"}
                </Button>
              </CardContent>
            </Card>

            {/* Mood Stats */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg">Your Mood Stats</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {moodHistory.length > 0 ? (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Average Mood</span>
                        <span className="font-medium">
                          {Math.round(
                            moodHistory
                              .slice(-7)
                              .reduce((sum, entry) => {
                                const mood = moods.find((m) => m.value === entry.mood);
                                return sum + (mood?.score || 50);
                              }, 0) / Math.min(7, moodHistory.length)
                          )}
                          /100
                        </span>
                      </div>
                      <Progress
                        value={
                          (moodHistory
                            .slice(-7)
                            .reduce((sum, entry) => {
                              const mood = moods.find((m) => m.value === entry.mood);
                              return sum + (mood?.score || 50);
                            }, 0) /
                            Math.min(7, moodHistory.length))
                        }
                        className="h-2"
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{moodHistory.length}</div>
                      <div className="text-sm text-muted-foreground">Total Check-ins</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Start tracking your mood to see stats</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mood Patterns & Insights */}
          {moodPatterns && (
            <div className="grid gap-6 lg:grid-cols-2 mb-6">
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Mood Patterns
                  </CardTitle>
                  <CardDescription>Insights from your mood data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {moodPatterns.peakTime && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">Peak Mood Time</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You tend to feel best around {moodPatterns.peakTime}
                      </p>
                    </div>
                  )}
                  {moodPatterns.commonMood && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="font-medium">Most Common Mood</span>
                      </div>
                      <Badge className={moods.find(m => m.value === moodPatterns.commonMood)?.color || ""}>
                        {moods.find(m => m.value === moodPatterns.commonMood)?.label}
                      </Badge>
                    </div>
                  )}
                  {moodPatterns.trend && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        {moodPatterns.trend === "improving" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        )}
                        <span className="font-medium">Trend</span>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        Your mood is {moodPatterns.trend} this week
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Personalized Recommendations */}
              {selectedMood && (
                <Card className="animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Recommendations for You
                    </CardTitle>
                    <CardDescription>
                      Personalized suggestions based on your current mood
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getMoodRecommendations(selectedMood).map((rec, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="font-medium text-sm mb-1">{rec.title}</div>
                          <div className="text-xs text-muted-foreground">{rec.description}</div>
                          {rec.action && (
                            <Button
                              size="sm"
                              variant="link"
                              className="mt-2 p-0 h-auto text-xs"
                              onClick={() => window.location.href = rec.action}
                            >
                              Try it →
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Mood History Chart */}
          {chartData.length > 0 && (
            <Card className="mb-6 animate-fade-in">
              <CardHeader>
                <CardTitle>Mood History</CardTitle>
                <CardDescription>Your mood over the last 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorMood)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;

