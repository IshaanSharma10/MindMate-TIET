import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, CameraOff, Smile, AlertCircle, CheckCircle2, Brain, Sun } from "lucide-react";
import { auth } from "@/FirebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { toast } from "@/components/ui/use-toast";
import { pipeline, env } from "@xenova/transformers";

// Configure transformers.js to use CDN
env.allowLocalModels = false;

// Optimized settings for low latency
const SMOOTHING_FRAMES = 3; // Reduced for faster response
const MIN_CONFIDENCE_THRESHOLD = 20;
const ANALYSIS_INTERVAL = 300; // Faster analysis

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
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const classifierRef = useRef<any>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // For temporal smoothing - store recent predictions
  const recentPredictionsRef = useRef<Array<Record<string, number>>>([]);
  const isAnalyzingRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Create processing canvas once
    processingCanvasRef.current = document.createElement("canvas");
    
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
        description: "AI emotion detection is now active!",
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

  // Fast image preprocessing - minimal operations for low latency
  const preprocessImage = (
    video: HTMLVideoElement, 
    canvas: HTMLCanvasElement
  ): string => {
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return "";

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Simple center crop - minimal computation
    const cropSize = Math.min(videoWidth, videoHeight) * 0.75;
    const cropX = (videoWidth - cropSize) / 2;
    const cropY = (videoHeight - cropSize) / 2 - videoHeight * 0.03;

    // Smaller output for faster processing
    const outputSize = 192;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Use CSS filter for fast contrast enhancement (GPU accelerated)
    ctx.filter = "contrast(1.1) brightness(1.05)";
    
    // Single draw operation
    ctx.drawImage(
      video,
      Math.max(0, cropX), Math.max(0, cropY), cropSize, cropSize,
      0, 0, outputSize, outputSize
    );
    
    ctx.filter = "none";

    // Lower quality for faster encoding
    return canvas.toDataURL("image/jpeg", 0.75);
  };

  // Fast smoothed predictions with minimal computation
  const getSmoothedPredictions = (
    currentPredictions: Record<string, number>
  ): { emotion: string; confidence: number; allEmotions: Record<string, number> } => {
    // Add current and trim old
    recentPredictionsRef.current.push(currentPredictions);
    if (recentPredictionsRef.current.length > SMOOTHING_FRAMES) {
      recentPredictionsRef.current.shift();
    }

    // Fast averaging using simple loop
    const averaged: Record<string, number> = {};
    const counts: Record<string, number> = {};
    const predictions = recentPredictionsRef.current;
    const len = predictions.length;

    for (let i = 0; i < len; i++) {
      const pred = predictions[i];
      for (const emotion in pred) {
        averaged[emotion] = (averaged[emotion] || 0) + pred[emotion];
        counts[emotion] = (counts[emotion] || 0) + 1;
      }
    }

    // Find top emotion while calculating averages
    let topEmotion = "neutral";
    let topScore = 0;

    for (const emotion in averaged) {
      averaged[emotion] = Math.round(averaged[emotion] / counts[emotion]);
      if (averaged[emotion] > topScore) {
        topScore = averaged[emotion];
        topEmotion = emotion;
      }
    }

    return { emotion: topEmotion, confidence: topScore, allEmotions: averaged };
  };

  const analyzeFrame = useCallback(async () => {
    // Skip if already analyzing (prevents queue buildup)
    if (isAnalyzingRef.current) return;
    if (!videoRef.current || !processingCanvasRef.current || !classifierRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.readyState < 2) return;

    isAnalyzingRef.current = true;

    try {
      // Fast preprocessing
      const imageData = preprocessImage(video, processingCanvasRef.current);
      if (!imageData) {
        isAnalyzingRef.current = false;
        return;
      }

      // Run emotion classification with minimal options
      const results = await classifierRef.current(imageData);

      if (results && results.length > 0) {
        // Fast emotion extraction
        const currentEmotions: Record<string, number> = {};
        for (let i = 0; i < Math.min(results.length, 7); i++) {
          currentEmotions[results[i].label.toLowerCase()] = Math.round(results[i].score * 100);
        }

        // Get smoothed predictions
        const smoothed = getSmoothedPredictions(currentEmotions);

        // Batch state updates
        if (smoothed.confidence >= MIN_CONFIDENCE_THRESHOLD) {
          setDetectedExpression(smoothed.emotion);
          setExpressionConfidence(smoothed.confidence);
          setAllEmotions(smoothed.allEmotions);
          setAnalysisStatus(`${smoothed.emotion}`);
        } else {
          setAnalysisStatus("Adjusting...");
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      isAnalyzingRef.current = false;
    }
  }, []);

  const startStream = async () => {
    try {
      // First load the model if not loaded
      if (!classifierRef.current) {
        await loadModel();
      }

      if (!videoRef.current) return;

      // Request higher resolution for better accuracy
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "user",
          // Request higher frame rate for smoother analysis
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      await videoRef.current.play();
      setIsStreaming(true);

      // Clear previous predictions
      recentPredictionsRef.current = [];

      // Start fast periodic analysis
      analysisIntervalRef.current = setInterval(analyzeFrame, ANALYSIS_INTERVAL);

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
    setAnalysisStatus("");
    recentPredictionsRef.current = [];
    isAnalyzingRef.current = false;

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
              Powered by a pre-trained AI model with enhanced accuracy
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              🧠 Uses temporal smoothing and image preprocessing for stable, accurate results!
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
                      ? analysisStatus || "Analyzing your expression..."
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
                    {isStreaming && (
                      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Live Analysis
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
                    Low-latency AI analysis (~{ANALYSIS_INTERVAL}ms)
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
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${expressionConfidence}%` }}
                            />
                          </div>
                        </div>

                        {/* All emotions breakdown */}
                        {Object.keys(allEmotions).length > 0 && (
                          <div className="pt-4 border-t space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">All Emotions (Smoothed):</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(allEmotions)
                                .sort((a, b) => b[1] - a[1])
                                .map(([emotion, score]) => (
                                  <div key={emotion} className="flex items-center justify-between">
                                    <span className="capitalize">{emotion}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-secondary rounded-full h-1.5">
                                        <div
                                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: `${score}%` }}
                                        />
                                      </div>
                                      <span className="font-mono w-8 text-right">{score}%</span>
                                    </div>
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

          {/* Tips for better accuracy */}
          <Card className="mt-6 animate-fade-in border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sun className="h-5 w-5 text-primary" />
                Tips for Better Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">💡</span>
                  <span>Ensure good, even lighting on your face (avoid backlighting)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">📏</span>
                  <span>Position your face in the center of the frame</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🎭</span>
                  <span>Make clear facial expressions - exaggerate slightly for better detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">⏱️</span>
                  <span>Hold your expression for 2-3 seconds for stable results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🚫</span>
                  <span>Remove glasses/sunglasses if possible for better eye detection</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mt-6 animate-fade-in">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Low Latency:</strong> Analyzes every {ANALYSIS_INTERVAL}ms with {SMOOTHING_FRAMES}-frame smoothing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Smart Cropping:</strong> Automatically focuses on the center face area
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Image Enhancement:</strong> Adjusts contrast and brightness for better analysis
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Confidence Filter:</strong> Only shows results above {MIN_CONFIDENCE_THRESHOLD}% confidence
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
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FacialExpression;
