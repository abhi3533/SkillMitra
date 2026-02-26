import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Star, Clock, BadgeCheck, GraduationCap, Globe, Home, Shield, IndianRupee, Award, ChevronRight, Quote, Sparkles, BookOpen, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = [
{ step: "01", title: "Browse & Choose", description: "Explore verified trainers by skill, language, and budget. Read reviews and check credentials.", icon: BookOpen },
{ step: "02", title: "Book a Free Trial", description: "Schedule a free trial session to meet your trainer and experience the teaching style.", icon: Video },
{ step: "03", title: "Learn & Grow", description: "Attend 1:1 sessions from home, build projects, earn certificates, and land your dream job.", icon: Sparkles }];


const benefits = [
{ title: "1:1 Personal Training", description: "Not group classes. Your trainer focuses only on you, tailoring every session to your pace.", icon: Users },
{ title: "In Your Language", description: "Learn in Telugu, Hindi, Tamil, English, or any language you're comfortable in.", icon: Globe },
{ title: "From Home", description: "No commuting. Attend live sessions from your room via Google Meet.", icon: Home },
{ title: "Verified Experts", description: "Every trainer is ID-verified with checked credentials and work experience.", icon: Shield },
{ title: "Affordable Pricing", description: "Starting from ₹999. Get industry-expert training at a fraction of coaching institute costs.", icon: IndianRupee },
{ title: "Earn Certificates", description: "Get SkillMitra certificates verified by QR code. Showcase on LinkedIn.", icon: Award }];


const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
};

// Demo data for initial launch
const demoTrainers = [
{ id: "demo-1", name: "Rahul Sharma", role: "Senior Software Engineer", company: "Google", skills: ["React", "Node.js", "System Design"], rating: 4.9, students: 85, plan: "elite" },
{ id: "demo-2", name: "Priya Patel", role: "Data Scientist", company: "Microsoft", skills: ["Python", "ML", "Data Analytics"], rating: 4.8, students: 62, plan: "pro" },
{ id: "demo-3", name: "Arjun Reddy", role: "Full Stack Developer", company: "Amazon", skills: ["Java", "AWS", "Microservices"], rating: 4.7, students: 71, plan: "elite" },
{ id: "demo-4", name: "Sneha Iyer", role: "UI/UX Designer", company: "Flipkart", skills: ["Figma", "UI Design", "Prototyping"], rating: 4.9, students: 53, plan: "pro" },
{ id: "demo-5", name: "Vikram Singh", role: "DevOps Engineer", company: "Razorpay", skills: ["Docker", "Kubernetes", "CI/CD"], rating: 4.6, students: 44, plan: "pro" }];


const demoReviews = [
{ id: "r1", text: "Rahul sir is an amazing teacher. He explained React concepts so clearly that I built my first project within 2 weeks. Highly recommended!", rating: 5, name: "Ananya M.", city: "Hyderabad", course: "React Mastery" },
{ id: "r2", text: "Priya ma'am helped me land my first data science internship. Her teaching style is very practical and project-based.", rating: 5, name: "Karthik R.", city: "Chennai", course: "Data Science Bootcamp" },
{ id: "r3", text: "The 1:1 sessions with Arjun sir were incredibly valuable. He helped me prepare for my Amazon interview and I cleared it!", rating: 5, name: "Deepak K.", city: "Bangalore", course: "DSA & System Design" },
{ id: "r4", text: "Learning UI/UX from Sneha was the best decision. She reviews every design I make and gives detailed feedback.", rating: 4, name: "Meera S.", city: "Mumbai", course: "UI/UX Design" },
{ id: "r5", text: "Vikram sir's DevOps course is very hands-on. I learned Docker and Kubernetes with real projects. Worth every rupee.", rating: 5, name: "Rohit P.", city: "Delhi", course: "DevOps Mastery" }];


const Index = () => {
  const [realStats, setRealStats] = useState({ students: 0, trainers: 0, avgRating: 0, hours: 0 });
  const [realTrainers, setRealTrainers] = useState<any[]>([]);
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, trainersRes, sessionsRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("trainers").select("id, average_rating, user_id, skills, current_role, current_company, subscription_plan, total_students", { count: "exact" }).eq("approval_status", "approved"),
        supabase.from("course_sessions").select("actual_duration_mins").eq("status", "completed")]
        );

        const totalHours = (sessionsRes.data || []).reduce((sum: number, s: any) => sum + (s.actual_duration_mins || 0), 0) / 60;
        const approvedTrainers = trainersRes.data || [];
        const ratings = approvedTrainers.filter((t: any) => t.average_rating > 0);
        const avgRating = ratings.length > 0 ? ratings.reduce((sum: number, t: any) => sum + Number(t.average_rating), 0) / ratings.length : 0;

        setRealStats({
          students: studentsRes.count || 0,
          trainers: trainersRes.count || 0,
          avgRating: Math.round(avgRating * 10) / 10,
          hours: Math.round(totalHours)
        });

        // Fetch trainer profiles separately
        if (approvedTrainers.length > 0) {
          const userIds = approvedTrainers.map((t) => t.user_id);
          const profileMap = await fetchProfilesMap(userIds);
          const enriched = approvedTrainers.slice(0, 6).map((t) => ({ ...t, profile: profileMap[t.user_id] }));
          setRealTrainers(enriched);
        }

        // Fetch reviews separately (no nested join)
        const { data: ratingsData } = await supabase.from("ratings").select("*").not("student_to_trainer_rating", "is", null).order("created_at", { ascending: false }).limit(5);
        if (ratingsData && ratingsData.length > 0) {
          const studentIds = ratingsData.map((r) => r.student_id);
          const { data: studentData } = await supabase.from("students").select("id, user_id").in("id", studentIds);
          const sUserIds = (studentData || []).map((s) => s.user_id);
          const sProfileMap = await fetchProfilesMap(sUserIds);
          const studentMap: Record<string, any> = {};
          (studentData || []).forEach((s) => {studentMap[s.id] = sProfileMap[s.user_id];});
          setRealReviews(ratingsData.map((r) => ({ ...r, studentProfile: studentMap[r.student_id] })));
        }
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Use demo + real data combined. Show demo stats enhanced with real.
  const displayStats = {
    students: `${Math.max(realStats.students, 500)}+`,
    trainers: `${Math.max(realStats.trainers, 100)}+`,
    avgRating: realStats.avgRating > 0 ? `${realStats.avgRating}★` : "4.3★",
    hours: `${Math.max(realStats.hours, 500)}+`
  };

  // Show real trainers if available, otherwise demo
  const displayTrainers = realTrainers.length > 0 ? realTrainers : null;
  const displayReviews = realReviews.length > 0 ? realReviews : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 lg:pt-40 lg:pb-28 bg-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-foreground text-balance">
                Learn Any Skill From{" "}
                <span className="text-primary">India's Best Experts</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Personal 1:1 training in your language from verified industry experts. From home. At your pace.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/browse">
                  <Button className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold text-[15px] px-8 h-12 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto">
                    Browse Trainers <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/trainer/signup">
                  <Button variant="outline" className="border-[1.5px] border-primary text-primary hover:bg-primary/5 font-semibold text-[15px] px-8 h-12 rounded-lg w-full sm:w-auto">
                    Become a Trainer
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-medium">Verified Experts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="font-medium">4.3 Avg Rating</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium">500+ Students</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:block">
              <div className="relative">
                <div className="card-elevated p-8 max-w-sm mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Find Your Mentor</h3>
                      <p className="text-sm text-muted-foreground">1:1 Personal Training</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Python", "React", "Data Science"].map((s) =>
                    <span key={s} className="text-xs px-3 py-1 rounded-full bg-primary/5 text-primary font-medium">{s}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">From ₹999/mo</span>
                    <span className="text-sm font-semibold text-primary">Explore →</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="bg-primary/[0.04] border-y border-border">
        <div className="container mx-auto px-4 lg:px-8 py-10 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
            { label: "Students Trained", value: displayStats.students },
            { label: "Verified Trainers", value: displayStats.trainers },
            { label: "Average Rating", value: displayStats.avgRating },
            { label: "Hours Taught", value: displayStats.hours }].
            map((stat, i) =>
            <motion.div key={stat.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-primary">{loading ? "-" : stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      




















      {/* Featured Trainers */}
      <section className="section-padding bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="label-uppercase text-primary mb-3">Top Trainers</p>
              <h2 className="text-foreground">Meet Our Expert Trainers</h2>
            </div>
            <Link to="/browse" className="hidden md:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(displayTrainers || demoTrainers.slice(0, 6)).map((t: any, i: number) => {
              const isReal = !!t.user_id;
              const name = isReal ? t.profile?.full_name || "Trainer" : t.name;
              const role = isReal ? t.current_role || "Trainer" : t.role;
              const company = isReal ? t.current_company : t.company;
              const skills = isReal ? t.skills || [] : t.skills;
              const rating = isReal ? Number(t.average_rating) : t.rating;
              const studentCount = isReal ? t.total_students || 0 : t.students;
              const plan = isReal ? t.subscription_plan : t.plan;
              const id = isReal ? t.id : t.id;

              return (
                <motion.div key={id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Link to={isReal ? `/trainer/${t.id}` : "/browse"} className="block group">
                    <div className="bg-white rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all duration-200 hover-lift relative">
                      {plan === "elite" &&
                      <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full gold-gradient text-accent-foreground">★ ELITE</span>
                      }
                      <div className="flex items-start gap-4">
                        <div className="w-[72px] h-[72px] rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold text-2xl">{name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg font-semibold text-foreground truncate">{name}</span>
                            <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                          </div>
                          <p className="text-sm text-muted-foreground">{role}</p>
                          {company && <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{company}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {skills.slice(0, 3).map((s: string) =>
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/5 text-primary font-medium">{s}</span>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="text-sm font-semibold text-foreground">{rating > 0 ? rating : "New"}</span>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{studentCount} students</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>);

            })}
          </div>
        </div>
      </section>

      {/* Why SkillMitra */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="label-uppercase text-primary mb-3">Why Choose Us</p>
            <h2 className="text-foreground">Why Students Trust SkillMitra</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) =>
            <motion.div key={b.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="bg-white rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-200 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      





































      {/* Trainer CTA */}
      <section className="bg-primary section-padding">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-white">Start Teaching. Start Earning.</h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Join our growing community of verified trainers. Teach from home in your own schedule.
            </p>
            <div className="mt-8">
              <Link to="/trainer/signup">
                <Button className="bg-white text-primary hover:bg-white/90 font-semibold text-[15px] px-8 h-12 rounded-lg shadow-lg">
                  Apply as Trainer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>);

};

export default Index;