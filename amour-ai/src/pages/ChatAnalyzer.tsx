import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzeChatImage, analyzeChatText } from "@/services/ai";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Copy,
  ArrowLeft,
  Bot,
  Shield,
  Zap,
  Sparkles,
  Coins,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

type Mode = "paste" | "upload";

const ChatAnalyzer = ({user}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("paste");
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const handleFileChange = (f?: File) => {
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  // inside component
  const handleAnalyzeText = async () => {
    if (!input.trim()) {
      toast({
        title: "Empty Input",
        description: "Paste a chat conversation first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if(!user){
        navigate("/signup")
        toast({ title: "Error", description: "Please Login to Continue.", variant: "destructive" });
        return
      }
      // before: const data = await analyzeChat();
      const data = await analyzeChatText(input);
      setResult(data);

      toast({
        title: "Analysis Complete",
        description: "Your war room is ready.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "Failed to analyze chat.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!file) {
      toast({
        title: "No Image",
        description: "Please upload a chat screenshot first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if(!user){
        navigate("/signup")
        toast({ title: "Error", description: "Please Login to Continue.", variant: "destructive" });
        return
      }
      // before: manual fetch POST formdata
      const data = await analyzeChatImage(file);
      setResult(data);

      toast({
        title: "Analysis Complete",
        description: "Screenshot analyzed.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err?.message || "Failed to analyze screenshot.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = () => {
    if (mode === "paste") handleAnalyzeText();
    else handleAnalyzeImage();
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto py-12 px-4 max-w-5xl relative z-10">
        {/* Top Bar with Nav and Credits */}
        <div className="flex justify-between items-center mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="group pl-0 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Tools
          </Button>

        {/* Credits Badge */}
          <div className="flex">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-secondary/50 rounded-xl border border-secondary text-sm font-medium">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-md"><span className="text-lg">{user?.credits}</span></span>
            
          </div>
          <Button variant="outline" className="ml-2 md:py-6 text-md bg-primary/70"
              onClick={() => navigate('/buy-credits')}
            >
              Buy Credits
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Chat War Room
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Paste your conversation history below or upload a chat screenshot.
            AI will deconstruct the subtext, flag red flags, and draft the
            perfect response.
          </p>
        </div>

        <div className="grid gap-10">
          {/* Mode selector (radio-like segmented control) */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex bg-muted/30 p-1 rounded-full border border-muted/20">
              <button
                onClick={() => setMode("paste")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === "paste"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
                aria-pressed={mode === "paste"}
              >
                Paste Chats
              </button>
              <button
                onClick={() => setMode("upload")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === "upload"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
                aria-pressed={mode === "upload"}
              >
                Upload Screenshot
              </button>
            </div>
          </div>

          {/* Input Section */}
          <Card className="border-muted/40 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              {/* Paste mode */}
              {mode === "paste" && (
                <>
                  <div className="p-6">
                    <Textarea
                      placeholder="Him: Hey, what's up?&#10;Me: Not much, just working.&#10;Him: Oh cool..."
                      className="min-h-[250px] font-mono text-sm leading-relaxed bg-background/50 border-muted-foreground/20 focus:border-primary/50 resize-y p-4 rounded-xl"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Upload mode */}
              {mode === "upload" && (
                <>
                  <div className="p-6 grid gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <label className="w-full md:w-auto cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            handleFileChange(f);
                          }}
                        />
                        <div className="px-4 py-3 rounded-xl border border-muted/20 bg-background/50 text-sm text-muted-foreground w-full md:w-64 text-center">
                          Click to upload a screenshot
                        </div>
                      </label>

                      <div className="flex-1">
                        {file ? (
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-sm text-foreground/90 break-words">
                              {file.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  handleFileChange();
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No file selected
                          </div>
                        )}
                      </div>
                    </div>

                    {previewUrl && (
                      <div className="rounded-xl overflow-hidden border border-muted/20">
                        {/* image preview responsive */}
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="w-full h-auto object-contain max-h-96"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="bg-muted/30 p-4 border-t border-muted/20 flex justify-end">
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  size="lg"
                  className="w-full md:w-auto min-w-[200px] h-12 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                      Analyzing Intelligence...
                    </>
                  ) : (
                    <>
                      <Bot className="mr-2 h-5 w-5" /> Analyze Conversation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <Tabs defaultValue="flags" className="w-full space-y-8">
                <div className="flex justify-center">
                  <TabsList className="grid w-full max-w-md grid-cols-3 h-12 bg-muted/50 p-1 rounded-full">
                    <TabsTrigger
                      value="flags"
                      className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Analysis
                    </TabsTrigger>
                    <TabsTrigger
                      value="intent"
                      className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Intent
                    </TabsTrigger>
                    <TabsTrigger
                      value="responses"
                      className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Replies
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab 1: Flags */}
                <TabsContent
                  value="flags"
                  className="mt-0 focus-visible:outline-none"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-red-500 text-lg">
                          <AlertTriangle className="h-5 w-5" /> Red Flags
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {result.redFlags.map((flag, i) => (
                            <li
                              key={i}
                              className="flex items-start text-sm text-muted-foreground"
                            >
                              <span className="mr-3 text-red-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 block" />
                              {flag}
                            </li>
                          ))}
                          {result.redFlags.length === 0 && (
                            <p className="text-muted-foreground italic flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> No major red
                              flags detected.
                            </p>
                          )}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-green-500 text-lg">
                          <CheckCircle2 className="h-5 w-5" /> Green Flags
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {result.greenFlags.map((flag, i) => (
                            <li
                              key={i}
                              className="flex items-start text-sm text-muted-foreground"
                            >
                              <span className="mr-3 text-green-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0 block" />
                              {flag}
                            </li>
                          ))}
                          {result.greenFlags.length === 0 && (
                            <p className="text-muted-foreground italic">
                              No specific green flags noted.
                            </p>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Tab 2: Intent */}
                <TabsContent
                  value="intent"
                  className="mt-0 focus-visible:outline-none"
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Subtext Decoder
                      </CardTitle>
                      <CardDescription>
                        What they are really thinking, beyond the words.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                        <p className="text-lg md:text-xl leading-relaxed font-medium text-foreground/90 italic">
                          "{result.intent}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 3: Responses */}
                <TabsContent
                  value="responses"
                  className="mt-0 focus-visible:outline-none"
                >
                  <div className="grid gap-5">
                    {result.responses.map((resp, i) => (
                      <Card
                        key={i}
                        className="hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group bg-card/50 backdrop-blur-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(resp.text);
                          toast({
                            title: "Copied!",
                            description: "Response copied to clipboard.",
                          });
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-3">
                            <span
                              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border
                              ${
                                resp.tone === "Safe"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-200"
                                  : resp.tone === "Bold"
                                  ? "bg-red-500/10 text-red-600 border-red-200"
                                  : "bg-purple-500/10 text-purple-600 border-purple-200"
                              }`}
                            >
                              {resp.tone === "Safe" && (
                                <Shield className="h-3 w-3" />
                              )}
                              {resp.tone === "Bold" && (
                                <Zap className="h-3 w-3" />
                              )}
                              {resp.tone === "Witty" && (
                                <Sparkles className="h-3 w-3" />
                              )}
                              {resp.tone}
                            </span>
                            <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-primary/10">
                              <Copy className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                          <p className="text-lg text-foreground/90 leading-relaxed">
                            {resp.text}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatAnalyzer;
