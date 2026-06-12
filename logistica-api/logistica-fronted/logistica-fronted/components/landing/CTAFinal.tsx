"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function CTAFinal() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  };

  return (
    <section className="py-28 px-6 bg-lnd-bg2">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="landing-gradient-border relative rounded-2xl"
          style={{ isolation: "isolate" }}
        >
          <div
            className="relative rounded-2xl px-8 py-16 text-center overflow-hidden backdrop-blur-2xl border border-white/10"
            style={{ background: "rgba(8,14,28,0.95)" }}
          >
            {/* inner glow — complex gradient, must be inline */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(37,99,235,0.18) 0%, transparent 60%)",
              }}
            />

            <div className="relative">
              <span
                className="inline-block text-xs font-semibold tracking-widest uppercase mb-6 px-3 py-1 rounded-full text-lnd-orange bg-lnd-orange/[0.12] border border-lnd-orange/25"
                style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
              >
                Demo gratuita
              </span>

              <h2
                className="text-4xl md:text-5xl font-bold text-white mb-4"
                style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
              >
                ¿Listo para transformar<br />tu logística?
              </h2>
              <p
                className="text-lg mb-10 max-w-lg mx-auto text-white/60"
                style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
              >
                Únete a más de 500 empresas que ya optimizan sus operaciones. Sin tarjeta de crédito, sin compromisos.
              </p>

              {!sent ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    required
                    className="flex-1 px-5 py-3.5 rounded-xl text-sm text-white outline-none transition-all duration-200 bg-white/[0.06] border border-white/[0.12] placeholder:text-white/30 focus:border-lnd-blue focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
                    style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
                  />
                  <motion.button
                    type="submit"
                    whileHover={prefersReduced ? {} : { scale: 1.02, boxShadow: "0 0 40px rgba(249,115,22,0.45)" }}
                    whileTap={prefersReduced ? {} : { scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white cursor-pointer bg-lnd-orange shadow-[0_0_24px_rgba(249,115,22,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-orange"
                    style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
                  >
                    Solicitar demo <ArrowRight size={16} />
                  </motion.button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <CheckCircle2 size={40} className="text-lnd-green" />
                  <p
                    className="text-lg font-semibold text-white"
                    style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
                  >
                    ¡Perfecto! Te contactamos pronto.
                  </p>
                  <p
                    className="text-sm text-white/50"
                    style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
                  >
                    Un especialista estará en contacto en menos de 24 horas.
                  </p>
                </motion.div>
              )}

              <div className="mt-8 flex flex-wrap justify-center gap-6">
                {["Sin tarjeta de crédito", "Setup en 1 día", "Soporte en español"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-lnd-green" />
                    <span
                      className="text-xs text-white/50"
                      style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
