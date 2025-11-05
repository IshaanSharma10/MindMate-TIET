import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Heart, Activity, Smile } from "lucide-react";

const Insights = () => {
  const insights = [
    {
      title: "Mood Trends",
      description: "Your emotional patterns over the past week",
      value: "Improving",
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      title: "Self-Care Score",
      description: "How well you're taking care of yourself",
      value: "85%",
      icon: Heart,
      color: "text-primary",
    },
    {
      title: "Activity Level",
      description: "Your engagement with mindfulness exercises",
      value: "High",
      icon: Activity,
      color: "text-cta-blue",
    },
    {
      title: "Wellbeing Index",
      description: "Overall mental health assessment",
      value: "Good",
      icon: Smile,
      color: "text-accent",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold md:text-4xl">Your Insights</h1>
          <p className="mt-2 text-muted-foreground">
            Track your mental wellness journey over time
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          {insights.map((insight, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow duration-200"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                  <insight.icon className={`h-5 w-5 ${insight.color}`} />
                </div>
                <CardDescription>{insight.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{insight.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reflections</CardTitle>
              <CardDescription>
                Key insights from your conversations with MindMate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground mb-2">2 days ago</p>
                <p className="text-foreground">
                  You've shown great progress in managing stress through mindful
                  breathing exercises.
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground mb-2">5 days ago</p>
                <p className="text-foreground">
                  Your sleep patterns have improved significantly this week. Keep up
                  the good work!
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground mb-2">1 week ago</p>
                <p className="text-foreground">
                  You're building stronger emotional awareness and self-compassion.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Insights;
