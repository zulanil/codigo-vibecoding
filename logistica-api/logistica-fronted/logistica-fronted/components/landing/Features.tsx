"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, BarChart3, Zap, Layers, Smartphone } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Tracking en tiempo real",
    description:
      "Monitorea tu flota completa en un mapa interactivo. Alertas instantáneas de desvíos, retrasos y paradas no programadas. Visibilidad total de cada envío desde el origen hasta la entrega.",
    featured: true,
    iconColor: "#2563EB",
    tag: "Función estrella",
  },
  {
    icon: BarChart3,
    title: "Dashboard de operaciones",
    description:
      "KPIs en tiempo real, alertas automáticas y reportes programados para tomar decisiones basadas en datos.",
    featured: false,
    iconColor: "#F97316",
    tag: null,
  },
  {
    icon: Zap,
    title: "Rutas optimizadas con IA",
    description:
      "Algoritmos de IA reducen costos de combustible hasta un 23% y mejoran los tiempos de entrega automáticamente.",
    featured: false,
    iconColor: "#10b981",
    tag: null,
  },
  {
    icon: Layers,
    title: "Integración ERP & SAP",
    description:
      "Conecta con SAP, Oracle, sistemas de facturación electrónica y cualquier ERP mediante nuestra API REST.",
    featured: false,
    iconColor: "#8b5cf6",
    tag: null,
  },
  {
    icon: Smartphone,
    title: "App móvil para conductores",
    description:
      "Firma digital, evidencia fotográfica y comunicación directa. Todo desde el teléfono del conductor.",
    featured: false,
    iconColor: "#3B82F6",
    tag: null,
  },
];

export default function Features() {
  const prefersReduced = useReducedMotion();

  return (
    <section id="features" className="py-28 px-6 bg-lnd-bg">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span
            className="inline-block text-xs font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full text-lnd-blue2 bg-lnd-blue/[0.12] border border-lnd-blue/25"
            style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
          >
            Funcionalidades
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
          >
            Todo lo que tu operación necesita
          </h2>
          <p
            className="text-lg max-w-xl mx-auto text-white/55"
            style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
          >
            Plataforma integral diseñada para gerentes de operaciones y supply chain que exigen resultados reales.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: prefersReduced ? 0 : 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: prefersReduced ? 0 : i * 0.08 }}
              className={[
                "relative rounded-2xl p-6 cursor-default group transition-all duration-300",
                "bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm",
                f.featured ? "md:col-span-2" : "",
              ].join(" ")}
              whileHover={
                prefersReduced
                  ? {}
                  : { background: "rgba(255,255,255,0.05)", boxShadow: `0 8px 40px ${f.iconColor}15` }
              }
            >
              {f.tag && (
                <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full text-lnd-blue2 bg-lnd-blue/20 border border-lnd-blue/30">
                  {f.tag}
                </span>
              )}

              {/* icon — color is dynamic per feature, must stay inline */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: `${f.iconColor}18`,
                  border: `1px solid ${f.iconColor}30`,
                }}
              >
                <f.icon size={20} color={f.iconColor} />
              </div>

              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed text-white/55"
                style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
              >
                {f.description}
              </p>

              {f.featured && (
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { label: "Uptime", value: "99.9%" },
                    { label: "Latencia", value: "<2s" },
                    { label: "Cobertura", value: "15 países" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl p-3 text-center bg-white/[0.04]">
                      <div
                        className="text-lg font-bold text-white"
                        style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-xs text-white/40">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
