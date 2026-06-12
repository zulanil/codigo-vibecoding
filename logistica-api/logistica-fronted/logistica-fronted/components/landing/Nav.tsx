"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import Link from "next/link";

const links = [
  { label: "Producto", href: "#features" },
  { label: "Cómo funciona", href: "#how-it-works" },
  { label: "Testimonios", href: "#testimonials" },
  { label: "Precios", href: "#pricing" },
];

function MagneticButton({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const prefersReduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  const onMove = (e: React.MouseEvent) => {
    if (prefersReduced) return;
    const rect = ref.current!.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  };

  return (
    <motion.a
      ref={ref}
      href={href ?? "#demo"}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 pt-4"
    >
      {/* Nav bar — glass effect via inline because it's conditional on scroll state */}
      <nav
        className={[
          "max-w-6xl mx-auto rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-500",
          scrolled
            ? "bg-lnd-bg/85 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            : "border border-transparent",
        ].join(" ")}
      >
        <a href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-lnd-blue">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8l4-4 4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span
            className="font-semibold text-white text-sm tracking-wide"
            style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
          >
            LogísticaWeb
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="text-sm text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
            style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
          >
            Ingresar
          </Link>
          <MagneticButton
            href="#demo"
            className="text-sm font-semibold text-white px-5 py-2 rounded-lg cursor-pointer transition-opacity duration-200 hover:opacity-90 bg-lnd-orange shadow-[0_0_20px_rgba(249,115,22,0.25)]"
          >
            Solicitar demo
          </MagneticButton>
        </div>

        <button
          className="md:hidden text-white/70 hover:text-white cursor-pointer transition-colors duration-200"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {mobileOpen ? (
              <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            ) : (
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden max-w-6xl mx-auto mt-2 rounded-2xl px-6 py-4 bg-lnd-bg/95 backdrop-blur-xl border border-white/[0.08]"
        >
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-white/70 hover:text-white text-sm border-b border-white/[0.06] last:border-0 cursor-pointer transition-colors duration-200"
              style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#demo"
            className="mt-3 block text-center text-sm font-semibold text-white py-3 rounded-lg cursor-pointer bg-lnd-orange"
            style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
          >
            Solicitar demo
          </a>
        </motion.div>
      )}
    </motion.header>
  );
}
