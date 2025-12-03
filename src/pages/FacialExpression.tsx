import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, CameraOff, Smile, AlertCircle, CheckCircle2, Brain } from "lucide-react";
import { auth } from "@/FirebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { toast } from "@/components/ui/use-toast";
import { pipeline, env } from "@xenova/transformers";

// Configure transformers.js to use CDN
env.allowLocalModels = false;

const FacialExpression = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detectedExpression, setDetectedExpression] = useState<string | null>(null);
  const [expressionConfidence, setExpressionConfidence] = useState<number>(0);
  const [allEmotions, setAllEmotions] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const classifierRef = useRef<any>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const loadModel = async () => {
    if (classifierRef.current) {
      setModelReady(true);
      return;
    }

    try {
      setModelLoading(true);
      setLoadingProgress("Initializing emotion detection model...");

      // Use image-classification pipeline with emotion model
      // This model is specifically trained for facial emotion recognition
      const classifier = await pipeline(
        "image-classification",
        "Xenova/facial_emotions_image_detection",
        {
          progress_callback: (progress: any) => {
            if (progress.status === "downloading") {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setLoadingProgress(`Downloading model: ${percent}%`);
            } else if (progress.status === "loading") {
              setLoadingProgress("Loading model into memory...");
            }
          },
        }
      );

      classifierRef.current = classifier;
      setModelReady(true);
      setModelLoading(false);
      setLoadingProgress("");

      toast({
        title: "Model Ready! 🧠",
        description: "AI emotion detection is now active and accurate!",
      });
    } catch (error) {
      console.error("Error loading model:", error);
      setModelLoading(false);
      setLoadingProgress("");
      toast({
        title: "Model Load Failed",
        description: "Failed to load emotion model. Please try again.",
        variant: "destructive",
      });
    }
  };

  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !classifierRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.videoWidth === 0) return;

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data as base64
      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      // Run emotion classification
      const results = await classifierRef.current(imageData, { topk: 7 });

      if (results && results.length > 0) {
        // Get top emotion
        const topEmotion = results[0];
        const emotionLabel = topEmotion.label.toLowerCase();
        const confidence = Math.round(topEmotion.score * 100);

        setDetectedExpression(emotionLabel);
        setExpressionConfidence(confidence);

        // Store all emotions for display
        const emotions: Record<string, number> = {};
        results.forEach((r: any) => {
          emotions[r.label.toLowerCase()] = Math.round(r.score * 100);
        });
        setAllEmotions(emotions);
      }
    } catch (error) {
      console.error("Analysis error:", error);
    }
  }, []);

  const startStream = async () => {
    try {
      // First load the model if not loaded
      if (!classifierRef.current) {
        await loadModel();
      }

      if (!videoRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      await videoRef.current.play();
      setIsStreaming(true);

      // Start periodic analysis (every 1 second for performance)
      analysisIntervalRef.current = setInterval(analyzeFrame, 1000);

      toast({
        title: "Camera Started",
        description: "AI emotion detection is now analyzing your expressions!",
      });
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use facial expression recognition.",
        variant: "destructive",
      });
    }
  };

  const stopStream = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setDetectedExpression(null);
    setExpressionConfidence(0);
    setAllEmotions({});

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const mapExpressionToMood = (expression: string): string => {
    const expressionMap: Record<string, string> = {
      happy: "happy",
      sad: "sad",
      angry: "stressed",
      fear: "anxious",
      fearful: "anxious",
      disgust: "anxious",
      disgusted: "anxious",
      surprise: "neutral",
      surprised: "neutral",
      neutral: "neutral",
    };
    return expressionMap[expression] || "neutral";
  };

  const saveDetectedMood = async () => {
    if (!user || !detectedExpression) {
      toast({
        title: "Cannot Save",
        description: "Please sign in and ensure a face is detected.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const mood = mapExpressionToMood(detectedExpression);
      const response = await fetch("http://localhost:5001/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          mood: mood,
          note: `Detected from facial expression: ${detectedExpression} (${expressionConfidence}% confidence)`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save mood");
      }

      toast({
        title: "Mood Saved! ✅",
        description: `Your ${mood} mood has been recorded from your facial expression.`,
      });
    } catch (error) {
      console.error("Failed to save mood:", error);
      toast({
        title: "Error",
        description: "Failed to save your mood. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getExpressionEmoji = (expression: string): string => {
    const emojis: Record<string, string> = {
      happy: "😊",
      sad: "😢",
      angry: "😠",
      fear: "😨",
      fearful: "😨",
      disgust: "🤢",
      disgusted: "🤢",
      surprise: "😲",
      surprised: "😲",
      neutral: "😐",
    };
    return emojis[expression] || "😐";
  };

  const getExpressionColor = (expression: string): string => {
    const colors: Record<string, string> = {
      happy: "bg-yellow-100 text-yellow-800 border-yellow-200",
      sad: "bg-purple-100 text-purple-800 border-purple-200",
      angry: "bg-red-100 text-red-800 border-red-200",
      fear: "bg-orange-100 text-orange-800 border-orange-200",
      fearful: "bg-orange-100 text-orange-800 border-orange-200",
      disgust: "bg-green-100 text-green-800 border-green-200",
      disgusted: "bg-green-100 text-green-800 border-green-200",
      surprise: "bg-blue-100 text-blue-800 border-blue-200",
      surprised: "bg-blue-100 text-blue-800 border-blue-200",
      neutral: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[expression] || colors.neutral;
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold md:text-4xl">AI Emotion Recognition</h1>
            </div>
            <p className="text-muted-foreground">
              Powered by a pre-trained AI model for accurate emotion detection
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              🧠 Uses advanced deep learning - much more accurate than basic detection!
            </p>
          </div>

          {modelLoading ? (
            <Card className="animate-fade-in">
              <CardContent className="p-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading AI Model</h3>
                <p className="text-muted-foreground mb-2">{loadingProgress}</p>
                <p className="text-xs text-muted-foreground">
                  First time may take 30-60 seconds to download the model
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Video Feed */}
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Camera Feed
                  </CardTitle>
                  <CardDescription>
                    {isStreaming
                      ? "AI is analyzing your expression every second"
                      : "Click start to begin AI emotion detection"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    {!isStreaming && (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Camera not active</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isStreaming ? (
                      <Button
                        onClick={startStream}
                        className="flex-1"
                        disabled={modelLoading}
                      >
                        {modelLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading Model...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4 mr-2" />
                            Start AI Detection
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={stopStream}
                        variant="destructive"
                        className="flex-1"
                      >
                        <CameraOff className="h-4 w-4 mr-2" />
                        Stop Detection
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Detection Results */}
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5 text-primary" />
                    Detected Emotion
                  </CardTitle>
                  <CardDescription>
                    Real-time AI emotion analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detectedExpression ? (
                    <>
                      <div className="text-center space-y-4">
                        <div className="text-6xl mb-4">
                          {getExpressionEmoji(detectedExpression)}
                        </div>
                        <div>
                          <Badge
                            className={`text-lg px-4 py-2 ${getExpressionColor(
                              detectedExpression
                            )}`}
                          >
                            {detectedExpression.charAt(0).toUpperCase() +
                              detectedExpression.slice(1)}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-semibold">{expressionConfidence}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${expressionConfidence}%` }}
                            />
                          </div>
                        </div>

                        {/* All emotions breakdown */}
                        {Object.keys(allEmotions).length > 0 && (
                          <div className="pt-4 border-t space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">All Emotions:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(allEmotions)
                                .sort((a, b) => b[1] - a[1])
                                .map(([emotion, score]) => (
                                  <div key={emotion} className="flex items-center justify-between">
                                    <span className="capitalize">{emotion}</span>
                                    <span className="font-mono">{score}%</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground mb-2">
                            Mapped to mood:{" "}
                            <span className="font-semibold text-foreground">
                              {mapExpressionToMood(detectedExpression)}
                            </span>
                          </p>
                          {user && (
                            <Button
                              onClick={saveDetectedMood}
                              disabled={saving}
                              className="w-full"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Save as Mood
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>
                        {isStreaming
                          ? "Analyzing your expression..."
                          : "Start detection to see your emotion"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Instructions */}
          <Card className="mt-6 animate-fade-in">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>AI-Powered!</strong> Uses a pre-trained deep learning model for accurate emotion detection
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    First time: Model downloads (~50MB) - subsequent uses are instant
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    Position your face in front of the camera with good lighting
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    Detects: Happy, Sad, Angry, Fear, Disgust, Surprise, and Neutral
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    All processing happens locally in your browser - completely private!
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    Model is cached - after first download, it loads instantly
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FacialExpression;
