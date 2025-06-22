import React from "react";
import { Navbar } from "../components/layout/Navbar";
import { Hero } from "../components/layout/Hero";
import { Footer } from "../components/layout/Footer";
import { Features } from "../components/landing/features";
import { HowItWorks } from "../components/landing/Working";
import { Pricing } from "../components/landing/Pricing";

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
};
