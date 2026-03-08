import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Sparkles, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StudentLayout from "@/components/layouts/StudentLayout";

const ResumeBuilder = () => {
  const [objective, setObjective] = useState("Motivated software developer with hands-on experience in React and Node.js seeking a challenging role at a growth-stage tech company.");
  const [atsScore] = useState(85);

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" /> Resume Builder
            </h1>
            <p className="text-muted-foreground mt-1">Build an ATS-optimized resume</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${atsScore >= 80 ? "bg-success" : "gold-gradient"}`}>
                <span className="text-primary-foreground font-bold text-sm">{atsScore}</span>
              </div>
              <span className="text-xs text-muted-foreground">ATS Score</span>
            </div>
            <Button className="hero-gradient border-0"><Download className="w-4 h-4 mr-2" /> Download PDF</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold text-foreground mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input defaultValue="Kavya Menon" className="mt-1.5" /></div>
                <div><Label>Email</Label><Input defaultValue="kavya@email.com" className="mt-1.5" /></div>
                <div><Label>Phone</Label><Input defaultValue="+91 98765 43210" className="mt-1.5" /></div>
                <div><Label>City</Label><Input defaultValue="Hyderabad" className="mt-1.5" /></div>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Career Objective</h3>
                <Button size="sm" variant="outline" className="text-xs"><Sparkles className="w-3 h-3 mr-1 text-accent" /> AI Improve</Button>
              </div>
              <Textarea value={objective} onChange={e => setObjective(e.target.value)} className="min-h-[100px]" />
            </div>

            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold text-foreground mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {["React", "Node.js", "TypeScript", "Python", "MongoDB", "Git"].map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-secondary-foreground">{s}</span>
                ))}
                <button className="px-3 py-1.5 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:border-primary">
                  <Plus className="w-3 h-3 inline mr-1" /> Add
                </button>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Projects</h3>
                <Button size="sm" variant="outline" className="text-xs"><Plus className="w-3 h-3 mr-1" /> Add Project</Button>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="font-medium text-foreground text-sm">E-commerce Platform</p>
                  <p className="text-xs text-muted-foreground">Built full-stack e-commerce with React, Node.js, Stripe integration</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="font-medium text-foreground text-sm">Task Management App</p>
                  <p className="text-xs text-muted-foreground">Real-time collaborative task manager with WebSocket</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card rounded-xl border p-8 sticky top-24">
            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-bold text-foreground">Kavya Menon</h2>
              <p className="text-sm text-muted-foreground">kavya@email.com • +91 98765 43210 • Hyderabad</p>
            </div>
            <div className="mb-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Objective</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{objective}</p>
            </div>
            <div className="mb-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Skills</h3>
              <p className="text-xs text-muted-foreground">React • Node.js • TypeScript • Python • MongoDB • Git</p>
            </div>
            <div className="mb-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Projects</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">E-commerce Platform</p>
                  <p className="text-xs text-muted-foreground">Built full-stack e-commerce with React, Node.js, Stripe</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Task Management App</p>
                  <p className="text-xs text-muted-foreground">Real-time collaborative task manager with WebSocket</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Certifications</h3>
              <p className="text-xs text-muted-foreground">SkillMitra Full Stack Development Certificate</p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default ResumeBuilder;
