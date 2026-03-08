import { motion } from "framer-motion";
import { Brain, Mic, Timer, ArrowRight, Play, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "@/components/layouts/StudentLayout";

const AIInterview = () => {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return (
      <StudentLayout>
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-32 h-32 mx-auto rounded-full hero-gradient flex items-center justify-center mb-6">
              <span className="text-5xl font-bold text-primary-foreground">78</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Interview Complete!</h1>
            <p className="text-muted-foreground mt-2">Here's your performance breakdown</p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: "Technical", score: 82, color: "hero-gradient" },
              { label: "Communication", score: 75, color: "gold-gradient" },
              { label: "Confidence", score: 78, color: "bg-success" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl border p-4 text-center">
                <div className={`w-12 h-12 mx-auto rounded-full ${s.color} flex items-center justify-center mb-2`}>
                  <span className="text-primary-foreground font-bold text-sm">{s.score}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-card rounded-xl border p-6">
            <h2 className="font-semibold text-foreground mb-3">Key Improvements</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Practice explaining technical concepts with real-world examples</li>
              <li>• Work on structuring answers using the STAR method</li>
              <li>• Improve confidence in system design discussions</li>
            </ul>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={() => { setCompleted(false); setStarted(false); }} variant="outline">Try Again</Button>
            <Link to="/student/dashboard"><Button className="hero-gradient border-0">Back to Dashboard</Button></Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (started) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">Question 1 of 5</span>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-accent" />
              <span className="text-sm font-mono font-semibold text-foreground">01:30</span>
            </div>
          </div>
          <div className="h-1 rounded-full bg-secondary mb-8">
            <div className="h-full hero-gradient rounded-full" style={{ width: "20%" }} />
          </div>

          <div className="bg-card rounded-xl border p-8">
            <h2 className="text-lg font-semibold text-foreground">Explain the difference between REST and GraphQL APIs. When would you choose one over the other?</h2>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" className="rounded-full w-16 h-16 bg-destructive hover:bg-destructive/90 border-0">
              <Mic className="w-6 h-6 text-destructive-foreground" />
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-3">Click to start recording your answer</p>

          <div className="mt-8 flex justify-end">
            <Button onClick={() => setCompleted(true)} className="hero-gradient border-0">Next Question <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

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
            <Select defaultValue="frontend">
              <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend">Frontend Developer</SelectItem>
                <SelectItem value="backend">Backend Developer</SelectItem>
                <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                <SelectItem value="data">Data Scientist</SelectItem>
                <SelectItem value="devops">DevOps Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select defaultValue="intermediate">
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
            <Select defaultValue="5">
              <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="7">7 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setStarted(true)} className="w-full h-11 hero-gradient border-0 font-semibold">
            <Play className="w-4 h-4 mr-2" /> Start Interview
          </Button>
        </div>
      </div>
    </StudentLayout>
  );
};

export default AIInterview;
