import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import meditationIllustration from "@/assets/meditation-illustration.png";

const Insights = () => {
  const moodData = [
    { day: "Mon", value: 65 },
    { day: "Tue", value: 78 },
    { day: "Wed", value: 62 },
    { day: "Thu", value: 71 },
    { day: "Fri", value: 58 },
    { day: "Sat", value: 85 },
    { day: "Sun", value: 72 },
  ];

  const emotionData = [
    { emotion: "Calm", value: 85, label: "Calm" },
    { emotion: "Content", value: 72, label: "Content" },
    { emotion: "Anxious", value: 35, label: "Anxious" },
    { emotion: "Sad", value: 28, label: "Sad" },
    { emotion: "Happy", value: 68, label: "Happy" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold md:text-4xl">Your Mental Wellness Journey</h1>
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

        {/* Summary Card */}
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">
                  This week you felt mostly calm 😌
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Keep up the great work! Remember to take breaks and practice mindfulness to maintain
                  your inner peace. Your week was characterized by moments of tranquility and contentment,
                  with a notable absence of anxiety or sadness. Continue nurturing these positive emotions
                  through self-care and relaxation techniques.
                </p>
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
