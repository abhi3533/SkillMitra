import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Award, Calendar, User, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CertificateVerify = () => {
  const { certificateId } = useParams();
  const [searchId, setSearchId] = useState(certificateId || "");
  const [verified, setVerified] = useState(!!certificateId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 lg:px-8 pt-28 pb-20">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl hero-gradient flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Certificate Verification</h1>
          <p className="mt-2 text-muted-foreground">Enter a certificate ID to verify its authenticity</p>

          <div className="flex gap-2 mt-6">
            <Input value={searchId} onChange={e => setSearchId(e.target.value)} placeholder="Enter Certificate ID (e.g. SM-CERT-2024-001)" className="h-11" />
            <Button onClick={() => setVerified(true)} className="hero-gradient border-0 px-6">Verify</Button>
          </div>

          {verified && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-card rounded-xl border p-6 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-success-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-success">Verified Certificate</p>
                  <p className="text-xs text-muted-foreground">This certificate is genuine and valid</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Student</span>
                  <span className="text-sm font-medium text-foreground">Kavya Menon</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Course</span>
                  <span className="text-sm font-medium text-foreground">Full Stack Web Development</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Trainer</span>
                  <span className="text-sm font-medium text-foreground">Rajesh Kumar (Microsoft)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Overall Score</span>
                  <span className="text-sm font-bold text-foreground">85/100</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Issue Date</span>
                  <span className="text-sm font-medium text-foreground">Jan 15, 2026</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Certificate ID</span>
                  <span className="text-sm font-mono text-foreground">SM-CERT-2024-001</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CertificateVerify;
