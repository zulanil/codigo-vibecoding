"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Settings, Route, Radio, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Settings,
    title: "Conecta tu flota en minutos",
    description:
      "Integra tus vehículos y conductores en la plataforma. Sin hardware adicional — funciona con el teléfono del conductor o el GPS existente de tu flota.",
    color: "#2563EB",
  },
  {
    number: "02",
    icon: Route,
    title: "La IA optimiza tus rutas",
    description:
      "Nuestros algoritmos analizan tráfico, clima, capacidad de carga y ventanas de entrega para generar las rutas más eficientes automáticamente.",
    color: "#F97316",
  },
  {
    number: "03",
    icon: Radio,
    title: "Monitoreo en tiempo real",
    description:
      "Sigue cada envío en vivo. Recibe alertas de desvíos, retrasos o incidentes. Comunícate directo con el conductor desde el dashboard.",
    color: "#10b981",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Analiza y escala",
    description:
      "Reportes automáticos de KPIs, costos por ruta, performance de conductores y tendencias. Datos para decisiones que mueven el negocio.",
    color: "#8b5cf6",
  },
];

export default function HowItWorks() {
  const prefersReduced = useReducedMotion();

  return (
    <section id="how-it-works" className="py-28 px-6 bg-lnd-bg2">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <span
            className="inline-block text-xs font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full text-lnd-orange bg-lnd-orange/[0.12] border border-lnd-orange/25"
            style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
          >
            Cómo funciona
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
          >
            Operativo en menos de un día
          </h2>
          <p
            className="text-lg max-w-xl mx-auto text-white/55"
            style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
          >
            Sin implementaciones largas ni consultores caros. Tu equipo empieza a ver resultados desde el primer día.
          </p>
        </motion.div>

        <div className="space-y-8">
          {steps.map((step, i) => {
            const isEven = i % 2 === 1;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: prefersReduced ? 0 : isEven ? 48 : -48 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`flex flex-col md:flex-row items-center gap-8 will-change-transform ${isEven ? "md:flex-row-reverse" : ""}`}
              >
                {/* Number — dynamic color per step, must be inline */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg"
                    style={{
                      background: `${step.color}18`,
                      border: `1px solid ${step.color}40`,
                      color: step.color,
                      fontFamily: "var(--font-heading-landing, system-ui)",
                    }}
                  >
                    {step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="hidden md:block w-px h-8 mt-2"
                      style={{ background: `${step.color}30` }}
                    />
                  )}
                </div>

                {/* Content card */}
                <motion.div
                  className="flex-1 rounded-2xl p-7 bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm transition-colors duration-200"
                  whileHover={prefersReduced ? {} : { background: "rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${step.color}18` }}
                    >
                      <step.icon size={18} color={step.color} />
                    </div>
                    <div>
                      <h3
                        className="text-xl font-semibold text-white mb-2"
                        style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed text-white/55"
                        style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
