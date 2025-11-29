import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import meditationIllustration from "@/assets/meditation-illustration.png";
import { auth } from "@/FirebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { Loader2, MessageSquare, BookOpen, TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Insights = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [moodData, setMoodData] = useState<Array<{ day: string; value: number | null }>>([]);
  const [emotionData, setEmotionData] = useState<Array<{ emotion: string; value: number; label: string }>>([]);
  const [insights, setInsights] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [chatMoodCorrelation, setChatMoodCorrelation] = useState<any>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchInsights(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchInsights = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/insights/${userId}`);
      const data = await response.json();

      // Set mood chart data
      if (data.moodChartData) {
        setMoodData(data.moodChartData);
      }

      // Convert emotion distribution to chart format
      if (data.emotionDistribution) {
        const emotionChartData = Object.entries(data.emotionDistribution).map(([emotion, count]) => ({
          emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
          value: count as number,
          label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        }));
        setEmotionData(emotionChartData);
      }

      setInsights(data);
      
      // Set timeline data
      if (data.timeline) {
        setTimeline(data.timeline);
      }
      
      // Set AI insights
      if (data.aiInsights) {
        setAiInsights(data.aiInsights);
      }
      
      // Set chat-mood correlation
      if (data.chatMoodCorrelation) {
        setChatMoodCorrelation(data.chatMoodCorrelation);
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      happy: "bg-yellow-100 text-yellow-800 border-yellow-200",
      calm: "bg-blue-100 text-blue-800 border-blue-200",
      neutral: "bg-gray-100 text-gray-800 border-gray-200",
      anxious: "bg-orange-100 text-orange-800 border-orange-200",
      sad: "bg-purple-100 text-purple-800 border-purple-200",
      stressed: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[mood] || colors.neutral;
  };

  const getMoodEmoji = (mood: string) => {
    const emojis: Record<string, string> = {
      happy: "😊",
      calm: "😌",
      neutral: "😐",
      anxious: "😰",
      sad: "😢",
      stressed: "😓",
    };
    return emojis[mood] || "😐";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Your Mental Wellness Journey</h1>
            <p className="text-muted-foreground">
              Please sign in to view your insights and progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getMoodSummary = () => {
    if (!insights || !insights.emotionDistribution) {
      return "Start tracking your mood to see insights!";
    }

    const emotions = Object.entries(insights.emotionDistribution);
    if (emotions.length === 0) {
      return "Start tracking your mood to see insights!";
    }

    const dominantEmotion = emotions.sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    const emotionEmojis: Record<string, string> = {
      happy: "😊",
      calm: "😌",
      neutral: "😐",
      anxious: "😰",
      sad: "😢",
      stressed: "😓",
    };

    return `This week you felt mostly ${dominantEmotion[0]} ${emotionEmojis[dominantEmotion[0]] || ""}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold md:text-4xl">Your Mental Wellness Journey</h1>
          {insights && (
            <p className="mt-2 text-muted-foreground">
              Weekly Average: {insights.weeklyAverage || 50}/100
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6 animate-fade-in">
          {/* Mood Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mood Trend</CardTitle>
              <CardDescription>Last 7 Days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    hide
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Emotion Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emotion Distribution</CardTitle>
              <CardDescription>This Week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={emotionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="label" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    hide
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        {insights && (
          <div className="grid gap-4 md:grid-cols-4 mb-6 animate-fade-in">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{insights.totalSessions || 0}</div>
                <div className="text-sm text-muted-foreground">Chat Sessions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{insights.totalJournalEntries || 0}</div>
                <div className="text-sm text-muted-foreground">Journal Entries</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{insights.activeGoals || 0}</div>
                <div className="text-sm text-muted-foreground">Active Goals</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{insights.weeklyAverage || 50}</div>
                <div className="text-sm text-muted-foreground">Weekly Mood Score</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI-Generated Insights */}
        {aiInsights && (
          <Card className="mb-6 animate-fade-in border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI Insights</CardTitle>
              </div>
              <CardDescription>
                Patterns connecting your chats and journal entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {aiInsights}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Chat & Journal Timeline */}
        {timeline.length > 0 && (
          <Card className="mb-6 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">Your Activity Timeline</CardTitle>
              <CardDescription>
                Chat sessions and journal entries from the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 pb-4 border-b border-border last:border-0"
                  >
                    <div className="flex-shrink-0">
                      {item.type === "chat" ? (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {item.type === "chat" ? "Chat Session" : "Journal Entry"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getMoodColor(item.mood)}`}
                        >
                          {getMoodEmoji(item.mood)} {item.mood}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.content}
                      </p>
                      {item.type === "chat" && item.messageCount && (
                        <span className="text-xs text-muted-foreground">
                          {item.messageCount} messages
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Topics & Mood Correlation */}
        {Object.keys(chatMoodCorrelation).length > 0 && (
          <Card className="mb-6 animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Chat Topics & Mood Patterns</CardTitle>
              </div>
              <CardDescription>
                What you discuss and how you feel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(chatMoodCorrelation).slice(0, 5).map(([topic, moods]: [string, any]) => {
                  const total = Object.values(moods).reduce((sum: number, count: any) => sum + count, 0);
                  const dominantMood = Object.entries(moods).sort((a: any, b: any) => b[1] - a[1])[0];
                  
                  return (
                    <div key={topic} className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{topic}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getMoodColor(dominantMood[0])}`}
                        >
                          {getMoodEmoji(dominantMood[0])} Mostly {dominantMood[0]}
                        </Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(moods).map(([mood, count]: [string, any]) => {
                          const countNum = typeof count === 'number' ? count : Number(count) || 0;
                          const totalNum = typeof total === 'number' ? total : Number(total) || 1;
                          return (
                            <span
                              key={mood}
                              className="text-xs text-muted-foreground"
                            >
                              {mood}: {Math.round((countNum / totalNum) * 100)}%
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">
                  {getMoodSummary()}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {insights && insights.totalSessions > 0
                    ? "Keep up the great work! Continue tracking your mood and practicing self-care. Remember that progress isn't always linear, and it's okay to have ups and downs."
                    : "Start your wellness journey by chatting with MindMate and tracking your daily mood. Every step forward is progress!"}
                </p>
                {insights && (insights.recentSessionsCount > 0 || insights.recentJournalCount > 0) && (
                  <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                    <span>💬 {insights.recentSessionsCount} recent chats</span>
                    <span>📔 {insights.recentJournalCount} journal entries</span>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <img
                  src={meditationIllustration}
                  alt="Person meditating"
                  className="w-64 h-64 object-contain"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
