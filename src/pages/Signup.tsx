import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowLeft, Sparkles, Shield, Heart, Loader2 } from "lucide-react";
import { auth, provider } from "../FirebaseConfig"; // adjust import path
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Signup successful:", email);
      navigate("/");
    } catch (error: any) {
      console.error("Signup error:", error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google signup successful:", user);
      navigate("/");
    } catch (error: any) {
      console.error("Google signup error:", error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
      
      {/* Back to home button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to home</span>
      </Link>

      <div className="w-full max-w-6xl relative z-10 animate-fade-in">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left side - Benefits */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Brain className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h1 className="text-4xl font-bold leading-tight">
                Start your journey to better mental health
              </h1>
              <p className="text-lg text-muted-foreground">
                Join thousands who trust MindMate for their wellness journey
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-primary/10 h-fit">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized recommendations based on your mood and activities
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-accent/10 h-fit">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Private & Secure</h3>
                  <p className="text-sm text-muted-foreground">
                    Your data is encrypted and never shared with third parties
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-primary/10 h-fit">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Track Your Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor your mental wellness journey with detailed insights
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Signup form */}
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-6 lg:hidden">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Brain className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Create your account</h1>
              <p className="text-muted-foreground">Start your wellness journey today</p>
            </div>

            <div className="lg:text-center lg:mb-6 hidden lg:block">
              <h2 className="text-2xl font-bold mb-2">Create your account</h2>
              <p className="text-muted-foreground">Get started in less than a minute</p>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium bg-accent hover:bg-accent/90 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              {/* OR divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs text-muted-foreground">OR</span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Google Signup Button */}
              <Button
                onClick={handleGoogleSignup}
                variant="outline"
                className="w-full h-11 text-base font-medium flex items-center justify-center gap-2"
                disabled={loading}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continue with Google
              </Button>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link 
                    to="/login" 
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
