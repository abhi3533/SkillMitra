import { motion } from "framer-motion";
import { Brain, Timer, ArrowRight, Play, BarChart3, Send, Loader2, SkipForward, CheckCircle, AlertCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "@/components/layouts/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  question: string;
  topic: string;
}

interface Evaluation {
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface AnswerRecord {
  question: Question;
  answer: string;
  evaluation: Evaluation;
}

const AIInterview = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Setup state
  const [role, setRole] = useState("Frontend Developer");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [questionCount, setQuestionCount] = useState("5");

  // Interview state
  const [phase, setPhase] = useState<"setup" | "loading" | "interview" | "evaluating" | "feedback" | "results">("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState(120);

  // Timer
  useEffect(() => {
    if (phase !== "interview") return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startInterview = useCallback(async () => {
    setPhase("loading");
    try {
      const { data, error } = await supabase.functions.invoke("ai-interview", {
        body: { action: "generate", role, difficulty, questionCount: parseInt(questionCount) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setQuestions(data.result);
      setCurrentIndex(0);
      setAnswer("");
      setAnswers([]);
      setTimeLeft(120);
      setPhase("interview");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to generate questions. Please try again.", variant: "destructive" });
      setPhase("setup");
    }
  }, [role, difficulty, questionCount, toast]);

  const submitAnswer = useCallback(async () => {
    const currentQ = questions[currentIndex];
    const studentAnswer = answer.trim() || "(No answer provided)";
    setPhase("evaluating");

    try {
      const { data, error } = await supabase.functions.invoke("ai-interview", {
        body: { action: "evaluate", question: currentQ.question, answer: studentAnswer },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const evaluation = data.result as Evaluation;
      setCurrentEvaluation(evaluation);
      setAnswers(prev => [...prev, { question: currentQ, answer: studentAnswer, evaluation }]);
      setPhase("feedback");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to evaluate answer.", variant: "destructive" });
      setPhase("interview");
    }
  }, [answer, currentIndex, questions, toast]);

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase("results");
    } else {
      setCurrentIndex(i => i + 1);
      setAnswer("");
      setCurrentEvaluation(null);
      setTimeLeft(120);
      setPhase("interview");
    }
  };

  const avgScore = (key: keyof Evaluation) => {
    if (answers.length === 0) return 0;
    return Math.round(answers.reduce((sum, a) => sum + (a.evaluation[key] as number), 0) / answers.length);
  };

  // ─── Setup Screen ───
  if (phase === "setup") {
    return (
      <StudentLayout>
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl hero-gradient flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">AI Mock Interview</h1>
            <p className="text-muted-foreground mt-2">Practice with AI-powered interviews tailored to your target role</p>
          </motion.div>

          <div className="bg-card rounded-xl border p-6 space-y-5">
            <div>
              <Label>Job Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                  <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                  <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                  <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                  <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number of Questions</Label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="7">7 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={startInterview} className="w-full h-11 hero-gradient border-0 font-semibold">
              <Play className="w-4 h-4 mr-2" /> Start Interview
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ─── Loading Screen ───
  if (phase === "loading") {
    return (
      <StudentLayout>
        <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Preparing your interview...</h2>
          <p className="text-sm text-muted-foreground mt-1">AI is generating questions for {role}</p>
        </div>
      </StudentLayout>
    );
  }

  // ─── Interview Screen (with text input) ───
  if (phase === "interview") {
    const currentQ = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</span>
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 ${timeLeft <= 30 ? "text-destructive" : "text-accent"}`} />
              <span className={`text-sm font-mono font-semibold ${timeLeft <= 30 ? "text-destructive" : "text-foreground"}`}>{formatTime(timeLeft)}</span>
            </div>
          </div>
          <div className="h-1 rounded-full bg-secondary mb-6">
            <div className="h-full hero-gradient rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {currentQ && (
            <>
              <div className="bg-card rounded-xl border p-6 mb-4">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{currentQ.topic}</span>
                <h2 className="text-lg font-semibold text-foreground mt-3">{currentQ.question}</h2>
              </div>

              <div className="bg-card rounded-xl border p-5">
                <Label className="text-sm font-medium mb-2 block">Your Answer</Label>
                <Textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer here... Be detailed and specific."
                  className="min-h-[140px] resize-none text-sm"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground">{answer.length} characters</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={submitAnswer} disabled={!answer.trim()}>
                      <SkipForward className="w-3.5 h-3.5 mr-1.5" /> Skip
                    </Button>
                    <Button size="sm" onClick={submitAnswer} disabled={!answer.trim()} className="hero-gradient border-0">
                      <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Answer
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </StudentLayout>
    );
  }

  // ─── Evaluating Screen ───
  if (phase === "evaluating") {
    return (
      <StudentLayout>
        <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Evaluating your answer...</h2>
          <p className="text-sm text-muted-foreground mt-1">AI is analyzing your response</p>
        </div>
      </StudentLayout>
    );
  }

  // ─── Feedback Screen (per-question) ───
  if (phase === "feedback" && currentEvaluation) {
    const currentQ = questions[currentIndex];
    const overallScore = Math.round((currentEvaluation.technicalScore + currentEvaluation.communicationScore + currentEvaluation.confidenceScore) / 3);
    const scoreColor = overallScore >= 70 ? "text-emerald-600" : overallScore >= 40 ? "text-amber-600" : "text-destructive";

    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length} — Feedback</span>
          </div>

          <div className="bg-card rounded-xl border p-6 mb-4">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{currentQ?.topic}</span>
            <h2 className="text-sm font-medium text-foreground mt-3">{currentQ?.question}</h2>
            <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg p-3 italic">"{answer || "(No answer provided)"}"</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Technical", score: currentEvaluation.technicalScore, gradient: "hero-gradient" },
              { label: "Communication", score: currentEvaluation.communicationScore, gradient: "gold-gradient" },
              { label: "Confidence", score: currentEvaluation.confidenceScore, gradient: "bg-emerald-500" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl border p-3 text-center">
                <div className={`w-10 h-10 mx-auto rounded-full ${s.gradient} flex items-center justify-center mb-1.5`}>
                  <span className="text-primary-foreground font-bold text-xs">{s.score}</span>
                </div>
                <p className="text-xs font-medium text-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Feedback */}
          <div className="bg-card rounded-xl border p-5 space-y-4 mb-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{currentEvaluation.feedback}</p>
            </div>

            {currentEvaluation.strengths?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Strengths
                </h4>
                <ul className="space-y-1">
                  {currentEvaluation.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentEvaluation.improvements?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Areas to Improve
                </h4>
                <ul className="space-y-1">
                  {currentEvaluation.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={nextQuestion} className="hero-gradient border-0">
              {currentIndex + 1 >= questions.length ? "View Results" : "Next Question"} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ─── Results Screen ───
  if (phase === "results") {
    const overall = Math.round((avgScore("technicalScore") + avgScore("communicationScore") + avgScore("confidenceScore")) / 3);
    return (
      <StudentLayout>
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-28 h-28 mx-auto rounded-full hero-gradient flex items-center justify-center mb-5">
              <span className="text-4xl font-bold text-primary-foreground">{overall}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Interview Complete!</h1>
            <p className="text-muted-foreground mt-1 text-sm">{role} • {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} • {questions.length} questions</p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: "Technical", score: avgScore("technicalScore"), gradient: "hero-gradient" },
              { label: "Communication", score: avgScore("communicationScore"), gradient: "gold-gradient" },
              { label: "Confidence", score: avgScore("confidenceScore"), gradient: "bg-emerald-500" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl border p-4 text-center">
                <div className={`w-12 h-12 mx-auto rounded-full ${s.gradient} flex items-center justify-center mb-2`}>
                  <span className="text-primary-foreground font-bold text-sm">{s.score}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Per-question breakdown */}
          <div className="mt-6 space-y-3">
            <h2 className="font-semibold text-foreground">Question-by-Question</h2>
            {answers.map((a, i) => {
              const qScore = Math.round((a.evaluation.technicalScore + a.evaluation.communicationScore + a.evaluation.confidenceScore) / 3);
              return (
                <div key={i} className="bg-card rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-primary font-medium">{a.question.topic}</span>
                      <p className="text-sm font-medium text-foreground mt-0.5 line-clamp-2">{a.question.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.evaluation.feedback}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${qScore >= 70 ? "bg-emerald-100 text-emerald-700" : qScore >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      <span className="text-sm font-bold">{qScore}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={() => { setPhase("setup"); setAnswers([]); setQuestions([]); setCurrentIndex(0); }} variant="outline">Try Again</Button>
            <Link to="/student/dashboard"><Button className="hero-gradient border-0">Back to Dashboard</Button></Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return null;
};

export default AIInterview;
