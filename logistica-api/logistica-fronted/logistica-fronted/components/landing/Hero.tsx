"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { ArrowRight, TrendingDown, Clock, Star } from "lucide-react";

const ParticlesCanvas = dynamic(() => import("./ParticlesCanvas"), { ssr: false });

const headline = "Mueve más, gestiona menos.";
const words = headline.split(" ");

const floatingBadges = [
  { icon: TrendingDown, label: "−23% combustible", color: "#10b981", delay: 0 },
  { icon: Clock, label: "Entregas a tiempo", color: "#2563EB", delay: 0.3 },
  { icon: Star, label: "4.9 / 5 valoración", color: "#F97316", delay: 0.6 },
];

function MagneticCTA({
  children,
  primary,
}: {
  children: React.ReactNode;
  primary?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const prefersReduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 22 });
  const sy = useSpring(y, { stiffness: 300, damping: 22 });

  const onMove = (e: React.MouseEvent) => {
    if (prefersReduced) return;
    const rect = ref.current!.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={[
        "flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-blue",
        primary
          ? "bg-lnd-orange text-white shadow-[0_0_32px_rgba(249,115,22,0.3)] hover:shadow-[0_0_48px_rgba(249,115,22,0.5)]"
          : "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}

export default function Hero() {
  const prefersReduced = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReduced ? 0 : 0.08 } },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-lnd-bg">
      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(37,99,235,0.18) 0%, transparent 60%)",
              "radial-gradient(ellipse 60% 50% at 80% 80%, rgba(59,130,246,0.12) 0%, transparent 60%)",
              "radial-gradient(ellipse 40% 40% at 60% 10%, rgba(249,115,22,0.08) 0%, transparent 60%)",
            ].join(","),
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: [
              "linear-gradient(rgba(37,99,235,1) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(37,99,235,1) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <ParticlesCanvas />

      {/* Content */}
      <div
        className="relative flex flex-col items-center text-center px-6 pt-32 pb-20 max-w-5xl mx-auto"
        style={{ zIndex: 2 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-lnd-blue/15 border border-lnd-blue/30 text-lnd-blue2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-lnd-blue animate-pulse" />
          Más de 500 empresas en Latinoamérica ya confían en nosotros
        </motion.div>

        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 text-white leading-[1.1]"
          style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
        >
          {words.map((word, i) => (
            <motion.span key={i} variants={wordVariants} className="inline-block will-change-transform">
              {word === "más," ? (
                <span className="text-lnd-orange">más,</span>
              ) : word === "menos." ? (
                <span className="text-lnd-blue2">menos.</span>
              ) : (
                word
              )}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: prefersReduced ? 0 : 0.55 }}
          className="text-lg md:text-xl max-w-2xl mb-10 leading-relaxed text-white/65"
          style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
        >
          Logística inteligente para empresas que no se detienen. Tracking en tiempo real,
          rutas optimizadas con IA y dashboards que muestran lo que importa.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.75 }}
          className="flex flex-wrap gap-4 justify-center mb-14"
          style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
        >
          <MagneticCTA primary>
            Solicitar demo gratuita <ArrowRight size={16} />
          </MagneticCTA>
          <MagneticCTA>Ver cómo funciona</MagneticCTA>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.95 }}
          className="flex flex-wrap justify-center items-center gap-6 mb-16"
        >
          <div className="flex -space-x-2">
            {["bg-lnd-blue", "bg-lnd-blue2", "bg-lnd-orange", "bg-lnd-green", "bg-lnd-purple"].map(
              (bg, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-lnd-bg ${bg}`} />
              )
            )}
          </div>
          <p
            className="text-sm text-white/55"
            style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
          >
            <span className="text-white font-semibold">+500</span> gerentes de operaciones confían en nosotros
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={13} fill="#F97316" color="#F97316" />
            ))}
            <span
              className="text-sm ml-1 text-white/55"
              style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
            >
              4.9/5
            </span>
          </div>
        </motion.div>

        {/* Glass dashboard card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: prefersReduced ? 0 : 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl rounded-2xl p-px will-change-transform"
          style={{
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.4), rgba(59,130,246,0.1), rgba(249,115,22,0.2))",
          }}
        >
          <div
            className="rounded-2xl p-6 md:p-8 backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 0 80px rgba(37,99,235,0.15)",
            }}
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Envíos activos", value: "12,847", change: "+18%", color: "text-lnd-green" },
                { label: "Rutas optimizadas", value: "3,291", change: "IA activa", color: "text-lnd-blue2" },
                { label: "Ahorro mensual", value: "$284k", change: "vs. mes anterior", color: "text-lnd-orange" },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div
                    className="text-2xl md:text-3xl font-bold text-white"
                    style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
                  >
                    {stat.value}
                  </div>
                  <div className={`text-xs font-medium ${stat.color}`}>{stat.change}</div>
                  <div className="text-xs text-white/45">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badges */}
          {!prefersReduced &&
            floatingBadges.map((badge, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: badge.delay,
                }}
                className="absolute hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white backdrop-blur-xl will-change-transform"
                style={{
                  background: "rgba(8,14,28,0.9)",
                  border: `1px solid ${badge.color}33`,
                  boxShadow: `0 0 20px ${badge.color}22`,
                  top: i === 0 ? "-20px" : i === 1 ? "40%" : "auto",
                  bottom: i === 2 ? "-20px" : "auto",
                  left: i === 0 ? "5%" : i === 2 ? "10%" : "auto",
                  right: i === 1 ? "-5%" : "auto",
                }}
              >
                <badge.icon size={12} color={badge.color} />
                <span>{badge.label}</span>
              </motion.div>
            ))}
        </motion.div>
      </div>
    </section>
  );
}
