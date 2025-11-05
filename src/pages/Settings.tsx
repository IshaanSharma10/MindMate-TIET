import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Moon, Lock, User } from "lucide-react";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold md:text-4xl">Settings</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your preferences and account settings
            </p>
          </div>

          <div className="space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Profile Information</CardTitle>
                </div>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" defaultValue="Sarah Johnson" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    defaultValue="sarah@example.com"
                  />
                </div>
                <Button className="bg-cta-blue hover:bg-cta-blue/90">
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle>Notifications</CardTitle>
                </div>
                <CardDescription>
                  Choose what notifications you receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Check-ins</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded to check in with your feelings
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Insight Summaries</Label>
                    <p className="text-sm text-muted-foreground">
                      Weekly summaries of your mental wellness
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mindfulness Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Gentle reminders to practice mindfulness
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-primary" />
                  <CardTitle>Appearance</CardTitle>
                </div>
                <CardDescription>Customize how MindMate looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <CardTitle>Privacy & Security</CardTitle>
                </div>
                <CardDescription>
                  Manage your privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      All conversations are encrypted
                    </p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
