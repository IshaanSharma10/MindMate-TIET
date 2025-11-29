import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Star,
  Lightbulb,
  Target,
  TrendingUp,
  BookOpen,
  Activity,
  Moon,
  Sun
} from "lucide-react";
import { auth } from "@/FirebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { toast } from "@/components/ui/use-toast";

const selfCareActivities = [
  { id: 1, title: "Take a 10-minute walk", category: "physical", mood: ["stressed", "anxious"], icon: "🚶" },
  { id: 2, title: "Practice 5-minute meditation", category: "mindfulness", mood: ["anxious", "stressed"], icon: "🧘" },
  { id: 3, title: "Write 3 things you're grateful for", category: "gratitude", mood: ["sad", "neutral"], icon: "🙏" },
  { id: 4, title: "Listen to calming music", category: "relaxation", mood: ["stressed", "anxious"], icon: "🎵" },
  { id: 5, title: "Call a friend or family member", category: "social", mood: ["sad", "lonely"], icon: "📞" },
  { id: 6, title: "Do a hobby you enjoy", category: "enjoyment", mood: ["neutral", "sad"], icon: "🎨" },
  { id: 7, title: "Take a warm bath or shower", category: "self-care", mood: ["stressed", "tired"], icon: "🛁" },
  { id: 8, title: "Read a book for 15 minutes", category: "mental", mood: ["anxious", "stressed"], icon: "📚" },
  { id: 9, title: "Do some stretching", category: "physical", mood: ["stressed", "tired"], icon: "🤸" },
  { id: 10, title: "Spend time in nature", category: "outdoor", mood: ["sad", "anxious"], icon: "🌳" },
];

const Wellness = () => {
  const [user, setUser] = useState<User | null>(null);
  const [gratitudeEntries, setGratitudeEntries] = useState<string[]>([]);
  const [gratitudeInput, setGratitudeInput] = useState("");
  const [completedActivities, setCompletedActivities] = useState<number[]>([]);
  const [wellnessStreak, setWellnessStreak] = useState(0);
  const [todayCheckIn, setTodayCheckIn] = useState(false);
  const [currentMood, setCurrentMood] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadWellnessData(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadWellnessData = async (userId: string) => {
    try {
      // Load today's check-in status
      const checkInResponse = await fetch(`http://localhost:5001/api/wellness/checkin/${userId}`);
      if (checkInResponse.ok) {
        const checkInData = await checkInResponse.json();
        setTodayCheckIn(checkInData.checkedIn || false);
        setCurrentMood(checkInData.mood || "");
      }

      // Load gratitude entries
      const gratitudeResponse = await fetch(`http://localhost:5001/api/wellness/gratitude/${userId}`);
      if (gratitudeResponse.ok) {
        const gratitudeData = await gratitudeResponse.json();
        setGratitudeEntries(gratitudeData.entries || []);
      }

      // Load completed activities
      const activitiesResponse = await fetch(`http://localhost:5001/api/wellness/activities/${userId}`);
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setCompletedActivities(activitiesData.completed || []);
      }

      // Load streak
      const streakResponse = await fetch(`http://localhost:5001/api/wellness/streak/${userId}`);
      if (streakResponse.ok) {
        const streakData = await streakResponse.json();
        setWellnessStreak(streakData.streak || 0);
      }
    } catch (error) {
      console.error("Failed to load wellness data:", error);
    }
  };

  const handleDailyCheckIn = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to check in.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/wellness/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTodayCheckIn(true);
        toast({
          title: "Check-in Complete! ✅",
          description: "Great job taking care of yourself today!",
        });
        await loadWellnessData(user.uid);
      } else {
        throw new Error("Check-in failed");
      }
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete check-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addGratitude = async () => {
    if (!gratitudeInput.trim()) {
      toast({
        title: "Please enter something",
        description: "Write what you're grateful for.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add gratitude entries.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/wellness/gratitude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          entry: gratitudeInput.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const newEntry = gratitudeInput.trim();
        setGratitudeEntries([...gratitudeEntries, newEntry]);
        setGratitudeInput("");
        toast({
          title: "Gratitude Added! 🙏",
          description: "Focusing on gratitude helps improve your mood.",
        });
      } else {
        throw new Error("Failed to save gratitude");
      }
    } catch (error: any) {
      console.error("Failed to add gratitude:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add gratitude. Please try again.",
        variant: "destructive",
      });
    }
  };

  const completeActivity = async (activityId: number) => {
    if (!user) return;

    if (completedActivities.includes(activityId)) {
      // Uncomplete
      setCompletedActivities(completedActivities.filter(id => id !== activityId));
    } else {
      // Complete
      setCompletedActivities([...completedActivities, activityId]);
      toast({
        title: "Activity Completed! 🎉",
        description: "Great job taking care of yourself!",
      });
    }

    try {
      await fetch("http://localhost:5001/api/wellness/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          activityId,
          completed: !completedActivities.includes(activityId),
        }),
      });
    } catch (error) {
      console.error("Failed to update activity:", error);
    }
  };

  const getRecommendedActivities = () => {
    if (!currentMood) return selfCareActivities.slice(0, 6);
    return selfCareActivities.filter(activity => 
      activity.mood.includes(currentMood)
    ).slice(0, 6);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold md:text-4xl">Wellness Hub</h1>
            </div>
            <p className="text-muted-foreground">
              Your daily wellness companion for self-care, gratitude, and personal growth
            </p>
          </div>

          {/* Daily Check-in & Stats */}
          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            <Card className="lg:col-span-2 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-primary" />
                  Daily Wellness Check-in
                </CardTitle>
                <CardDescription>
                  Start your day with intention and self-awareness
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todayCheckIn ? (
                  <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="text-xl font-bold mb-2">You're All Set! ✅</h3>
                    <p className="text-muted-foreground">
                      You've completed your wellness check-in for today. Keep up the great work!
                    </p>
                    <div className="mt-4">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {wellnessStreak} day streak 🔥
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Take a moment to check in with yourself. This helps build awareness and track your wellness journey.
                    </p>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDailyCheckIn();
                      }}
                      className="w-full bg-cta-blue hover:bg-cta-blue/90"
                      size="lg"
                      type="button"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Complete Daily Check-in
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wellness Stats */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg">Your Wellness Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-1">{wellnessStreak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Today's Progress</span>
                    <span>{completedActivities.length}/6 activities</span>
                  </div>
                  <Progress 
                    value={(completedActivities.length / 6) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="text-center pt-2">
                  <div className="text-2xl font-bold">{gratitudeEntries.length}</div>
                  <div className="text-sm text-muted-foreground">Gratitude Entries</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Self-Care Activities */}
          <Card className="mb-6 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Self-Care Activities
              </CardTitle>
              <CardDescription>
                {currentMood 
                  ? `Recommended activities for when you're feeling ${currentMood}`
                  : "Choose activities that resonate with you today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {getRecommendedActivities().map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      completedActivities.includes(activity.id)
                        ? "bg-primary/5 border-primary/30"
                        : "bg-card border-border hover:border-primary/50"
                    }`}
                    onClick={() => completeActivity(activity.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-2xl">{activity.icon}</div>
                      {completedActivities.includes(activity.id) && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <h4 className="font-medium mb-1">{activity.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {activity.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gratitude Practice */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Gratitude Practice
                </CardTitle>
                <CardDescription>
                  Write down things you're grateful for today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="What are you grateful for today? (e.g., 'I'm grateful for my supportive friends')"
                    value={gratitudeInput}
                    onChange={(e) => setGratitudeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && gratitudeInput.trim()) {
                        e.preventDefault();
                        addGratitude();
                      }
                    }}
                    rows={3}
                    className="resize-none"
                  />
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      addGratitude();
                    }}
                    className="w-full bg-cta-blue hover:bg-cta-blue/90"
                    disabled={!gratitudeInput.trim()}
                    type="button"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Add Gratitude
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Gratitude Entries */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Your Gratitude Journal
                </CardTitle>
                <CardDescription>
                  {gratitudeEntries.length > 0 
                    ? `${gratitudeEntries.length} things you're grateful for`
                    : "Start your gratitude practice"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gratitudeEntries.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {gratitudeEntries.slice().reverse().map((entry, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-primary/5 border border-primary/10"
                      >
                        <div className="flex items-start gap-2">
                          <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{entry}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No gratitude entries yet</p>
                    <p className="text-xs mt-1">Start by adding something you're grateful for</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Wellness Tips */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Wellness Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-2xl mb-2">🌅</div>
                  <h4 className="font-medium mb-1">Morning Routine</h4>
                  <p className="text-sm text-muted-foreground">
                    Start your day with 5 minutes of mindfulness or journaling
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-2xl mb-2">💧</div>
                  <h4 className="font-medium mb-1">Stay Hydrated</h4>
                  <p className="text-sm text-muted-foreground">
                    Drinking enough water improves mood and energy levels
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-2xl mb-2">😴</div>
                  <h4 className="font-medium mb-1">Quality Sleep</h4>
                  <p className="text-sm text-muted-foreground">
                    Aim for 7-9 hours of sleep for optimal mental health
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-2xl mb-2">🤝</div>
                  <h4 className="font-medium mb-1">Social Connection</h4>
                  <p className="text-sm text-muted-foreground">
                    Regular social interaction boosts happiness and reduces stress
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-medium mb-1">Set Small Goals</h4>
                  <p className="text-sm text-muted-foreground">
                    Break big tasks into smaller, achievable steps
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-2xl mb-2">🌿</div>
                  <h4 className="font-medium mb-1">Nature Time</h4>
                  <p className="text-sm text-muted-foreground">
                    Spending time outdoors reduces anxiety and improves mood
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Wellness;

