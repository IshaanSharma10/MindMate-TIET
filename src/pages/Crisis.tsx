import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Globe, AlertCircle, Heart, Shield } from "lucide-react";

interface CrisisResource {
  name: string;
  phone: string;
  description: string;
  available: string;
  website?: string;
}

const crisisResources: CrisisResource[] = [
  {
    name: "National Suicide Prevention Lifeline",
    phone: "988",
    description: "Free, confidential support for people in distress, 24/7",
    available: "24/7",
    website: "https://988lifeline.org",
  },
  {
    name: "Crisis Text Line",
    phone: "Text HOME to 741741",
    description: "Free, 24/7 crisis support via text message",
    available: "24/7",
    website: "https://www.crisistextline.org",
  },
  {
    name: "SAMHSA National Helpline",
    phone: "1-800-662-4357",
    description: "Free, confidential treatment referral and information service",
    available: "24/7",
    website: "https://www.samhsa.gov/find-help/national-helpline",
  },
  {
    name: "National Domestic Violence Hotline",
    phone: "1-800-799-7233",
    description: "Support for those experiencing domestic violence",
    available: "24/7",
    website: "https://www.thehotline.org",
  },
  {
    name: "Veterans Crisis Line",
    phone: "1-800-273-8255 (Press 1)",
    description: "Confidential support for veterans and their families",
    available: "24/7",
    website: "https://www.veteranscrisisline.net",
  },
];

const copingStrategies = [
  {
    title: "Grounding Techniques",
    description: "Use the 5-4-3-2-1 method: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
  },
  {
    title: "Deep Breathing",
    description: "Take slow, deep breaths. Inhale for 4 counts, hold for 4, exhale for 4. Repeat.",
  },
  {
    title: "Reach Out",
    description: "Contact a trusted friend, family member, or mental health professional.",
  },
  {
    title: "Move Your Body",
    description: "Take a walk, stretch, or do light exercise to help regulate your nervous system.",
  },
  {
    title: "Use Cold Water",
    description: "Splash cold water on your face or hold an ice cube to help ground yourself.",
  },
  {
    title: "Listen to Music",
    description: "Play calming music or sounds that help you feel more centered.",
  },
];

const Crisis = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <h1 className="text-3xl font-bold md:text-4xl">Crisis Resources</h1>
            </div>
            <p className="text-muted-foreground">
              Immediate help and support when you need it most
            </p>
          </div>

          {/* Emergency Alert */}
          <Card className="mb-6 border-destructive bg-destructive/5 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">In Immediate Danger?</h3>
                  <p className="text-muted-foreground mb-4">
                    If you're in immediate danger or having thoughts of self-harm, please call 911 or
                    go to your nearest emergency room right away.
                  </p>
                  <Button
                    onClick={() => (window.location.href = "tel:911")}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call 911
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crisis Hotlines */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Crisis Hotlines
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {crisisResources.map((resource, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{resource.phone}</span>
                      <span className="text-muted-foreground">• {resource.available}</span>
                    </div>
                    {resource.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(resource.website, "_blank")}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Visit Website
                      </Button>
                    )}
                    <Button
                      className="w-full bg-cta-blue hover:bg-cta-blue/90"
                      onClick={() => {
                        const phoneNumber = resource.phone.replace(/\D/g, "");
                        window.location.href = `tel:${phoneNumber}`;
                      }}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Coping Strategies */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Immediate Coping Strategies
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {copingStrategies.map((strategy, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{strategy.title}</h3>
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Safety Information */}
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Your Safety Matters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Remember, reaching out for help is a sign of strength, not weakness. These
                resources are here to support you through difficult times. You don't have to go
                through this alone.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>All hotlines are free and confidential</li>
                <li>You can call or text at any time, day or night</li>
                <li>Trained counselors are ready to listen and help</li>
                <li>You can remain anonymous if you prefer</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Crisis;

