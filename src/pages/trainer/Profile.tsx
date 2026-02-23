import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, BadgeCheck, MapPin, Globe, Clock, Users, Briefcase, Calendar, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const trainerData: Record<string, any> = {
  "1": { name: "Priya Sharma", role: "Senior Data Scientist", company: "Google", experience: 8, bio: "I'm a Senior Data Scientist at Google with 8 years of experience in ML and AI. I've trained 245+ students and helped many land roles at top tech companies. I believe in hands-on, project-based learning where every concept is tied to real-world applications. My teaching philosophy is simple: if you can build it, you understand it.", skills: ["Python", "Machine Learning", "Data Science", "TensorFlow", "Deep Learning", "NLP"], languages: ["English", "Hindi"], rating: 4.9, reviews: 127, students: 245, responseTime: "< 2 hours", verified: true, elite: true, courses: [
    { id: "c1", title: "Complete Data Science Bootcamp", duration: "90 days", sessions: 36, fee: 14999, level: "Beginner to Advanced", description: "Master data science from scratch. Covers Python, statistics, ML, deep learning, and capstone project.", curriculum: ["Python & NumPy fundamentals", "Statistics & Probability", "Machine Learning algorithms", "Deep Learning with TensorFlow", "NLP & Computer Vision", "Capstone Project"] },
    { id: "c2", title: "Machine Learning Masterclass", duration: "45 days", sessions: 18, fee: 8999, level: "Intermediate", description: "Deep dive into ML algorithms, model optimization, and deployment.", curriculum: ["Supervised Learning", "Unsupervised Learning", "Model Evaluation", "Feature Engineering", "ML Deployment"] },
  ], reviews_list: [
    { student: "Kavya M.", rating: 5, text: "Priya ma'am is an incredible teacher. She explained complex ML concepts in Hindi which made it so easy to understand. Got placed at Amazon!", date: "2 weeks ago" },
    { student: "Rohit S.", rating: 5, text: "The Data Science bootcamp was worth every rupee. Real Google-level projects and amazing support.", date: "1 month ago" },
    { student: "Ankit P.", rating: 4, text: "Very thorough teaching. Sometimes sessions run over time because she wants to explain everything properly.", date: "2 months ago" },
  ]},
};

// Default fallback
const defaultTrainer = trainerData["1"];

const TrainerProfile = () => {
  const { id } = useParams();
  const trainer = trainerData[id || "1"] || defaultTrainer;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="hero-gradient pt-24 pb-12 lg:pt-28 lg:pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl hero-gradient border-4 border-primary-foreground/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-4xl">{trainer.name[0]}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground">{trainer.name}</h1>
                {trainer.verified && <BadgeCheck className="w-6 h-6 text-accent" />}
                {trainer.elite && <span className="text-xs font-bold px-2 py-1 rounded gold-gradient text-accent-foreground">ELITE</span>}
              </div>
              <p className="text-primary-foreground/70 mt-1">{trainer.role} at {trainer.company} • {trainer.experience} years experience</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-primary-foreground/60">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-accent fill-accent" /> {trainer.rating} ({trainer.reviews} reviews)</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {trainer.students} students</span>
                <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {trainer.languages.join(", ")}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Responds {trainer.responseTime}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {trainer.skills.map((s: string) => (
                  <span key={s} className="text-xs px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/80 font-medium">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <div className="flex-1 space-y-8">
            {/* About */}
            <section className="bg-card rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed">{trainer.bio}</p>
            </section>

            {/* Courses */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Courses Offered</h2>
              <div className="space-y-4">
                {trainer.courses.map((c: any) => (
                  <div key={c.id} className="bg-card rounded-xl border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{c.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.duration}</span>
                          <span>{c.sessions} sessions</span>
                          <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{c.level}</span>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-medium text-foreground mb-1">Curriculum Preview:</p>
                          <ul className="space-y-1">
                            {c.curriculum.slice(0, 4).map((topic: string) => (
                              <li key={topic} className="text-xs text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3 text-accent" />{topic}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-foreground">₹{c.fee.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{c.duration}</p>
                        <Button size="sm" className="mt-3 hero-gradient border-0 text-xs">Enroll Now</Button>
                        <p className="text-xs text-accent mt-2 cursor-pointer hover:underline">Free Trial Available</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Student Reviews</h2>
              <div className="space-y-4">
                {trainer.reviews_list.map((r: any) => (
                  <div key={r.student} className="bg-card rounded-xl border p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">{r.student[0]}</span>
                      </div>
                      <span className="font-medium text-foreground text-sm">{r.student}</span>
                      <div className="flex gap-0.5">{[...Array(r.rating)].map((_, i) => <Star key={i} className="w-3 h-3 text-accent fill-accent" />)}</div>
                      <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-card rounded-xl border p-6 sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Quick Enroll</h3>
              <p className="text-sm text-muted-foreground mb-1">Starting from</p>
              <p className="text-3xl font-bold text-foreground">₹{Math.min(...trainer.courses.map((c: any) => c.fee)).toLocaleString()}</p>
              <Button className="w-full mt-4 hero-gradient border-0 font-semibold h-11">
                Enroll Now <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full mt-2 h-11 font-semibold">
                Book Free Trial
              </Button>
              <div className="mt-6 pt-4 border-t space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Next available slot</span>
                  <span className="text-foreground font-medium">Today, 6 PM</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Response time</span>
                  <span className="text-foreground font-medium">{trainer.responseTime}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Students trained</span>
                  <span className="text-foreground font-medium">{trainer.students}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TrainerProfile;
