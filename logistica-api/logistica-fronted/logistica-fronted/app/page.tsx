import { Lexend, Source_Sans_3 } from "next/font/google";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import LogosBar from "@/components/landing/LogosBar";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import CTAFinal from "@/components/landing/CTAFinal";
import Footer from "@/components/landing/Footer";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading-landing",
  display: "swap",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body-landing",
  display: "swap",
});

export default function LandingPage() {
  return (
    <div
      className={`${lexend.variable} ${sourceSans3.variable}`}
      style={{ fontFamily: "var(--font-body-landing, system-ui, sans-serif)" }}
    >
      <Nav />
      <Hero />
      <LogosBar />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTAFinal />
      <Footer />
    </div>
  );
}
