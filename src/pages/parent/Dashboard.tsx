import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const ParentDashboard = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 container mx-auto px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">Parent Dashboard</h1>
      <p className="mt-4 text-muted-foreground">Parent dashboard is coming soon. Please check back later.</p>
      <Link to="/" className="text-primary hover:underline mt-4 inline-block">Back to Home</Link>
    </div>
  </div>
);

export default ParentDashboard;
