"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana González", role: "COO", company: "TecnoRetail S.A.", avatar: "AG", color: "#2563EB",
    quote: "Redujimos costos de combustible en un 23% en el primer trimestre. El ROI fue inmediato. Nunca creí que una plataforma pudiera tener un impacto tan rápido en nuestra operación.",
    stars: 5,
  },
  {
    name: "Carlos Mendoza", role: "Gerente de Logística", company: "DistribuMed Colombia", avatar: "CM", color: "#F97316",
    quote: "El tracking en tiempo real cambió completamente nuestra relación con los clientes. Ahora ellos saben exactamente dónde está su pedido en todo momento.",
    stars: 5,
  },
  {
    name: "María Fernández", role: "VP de Operaciones", company: "FreshDelivery", avatar: "MF", color: "#10b981",
    quote: "La integración con SAP fue sorprendentemente sencilla. En dos días ya teníamos toda la información fluyendo entre los sistemas sin intervención manual.",
    stars: 5,
  },
  {
    name: "Rodrigo Suárez", role: "Director de Supply Chain", company: "AutoParts Pro", avatar: "RS", color: "#8b5cf6",
    quote: "Las rutas optimizadas con IA son un game changer. Nuestros conductores cubren un 30% más de entregas diarias con el mismo tiempo y combustible.",
    stars: 5,
  },
  {
    name: "Laura Ramírez", role: "CEO", company: "LastMile Express", avatar: "LR", color: "#3B82F6",
    quote: "La app para conductores fue adoptada en días. Firma digital y fotos de evidencia eliminaron completamente los reclamos por entregas no confirmadas.",
    stars: 5,
  },
  {
    name: "Sebastián Torres", role: "Head of Operations", company: "MarketHub Latam", avatar: "ST", color: "#F97316",
    quote: "El dashboard de KPIs es exactamente lo que necesitaba para presentar resultados a la junta directiva. Datos claros, visualizaciones impecables.",
    stars: 5,
  },
];

function TestimonialCard({ t, i }: { t: typeof testimonials[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const srx = useSpring(rotateX, { stiffness: 200, damping: 22 });
  const sry = useSpring(rotateY, { stiffness: 200, damping: 22 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced) return;
    const rect = ref.current!.getBoundingClientRect();
    rotateY.set(((e.clientX - rect.left) / rect.width - 0.5) * 5);
    rotateX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 5);
  };

  const onLeave = () => { rotateX.set(0); rotateY.set(0); };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: prefersReduced ? 0 : 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: prefersReduced ? 0 : (i % 3) * 0.08 }}
      style={prefersReduced ? {} : { rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="mb-5 will-change-transform"
    >
      <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm transition-colors duration-200 hover:bg-white/[0.05]">
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: t.stars }).map((_, j) => (
            <Star key={j} size={13} fill="#F97316" color="#F97316" />
          ))}
        </div>
        <p
          className="text-sm leading-relaxed mb-5 text-white/70"
          style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
        >
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3">
          {/* Avatar color is dynamic per testimonial — must stay inline */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: t.color }}
          >
            {t.avatar}
          </div>
          <div>
            <div
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
            >
              {t.name}
            </div>
            <div
              className="text-xs text-white/40"
              style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
            >
              {t.role} · {t.company}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Testimonials() {
  const col0 = testimonials.filter((_, i) => i % 3 === 0);
  const col1 = testimonials.filter((_, i) => i % 3 === 1);
  const col2 = testimonials.filter((_, i) => i % 3 === 2);

  return (
    <section id="testimonials" className="py-28 px-6 bg-lnd-bg">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span
            className="inline-block text-xs font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full text-lnd-green bg-lnd-green/[0.12] border border-lnd-green/25"
            style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
          >
            Testimonios
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
          >
            Lo que dicen nuestros clientes
          </h2>
          <p
            className="text-lg max-w-xl mx-auto text-white/55"
            style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
          >
            Más de 500 empresas ya transformaron su logística. Estos son sus resultados reales.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-5 items-start">
          <div>{col0.map((t, i) => <TestimonialCard key={t.name} t={t} i={i * 3} />)}</div>
          <div className="md:mt-10">{col1.map((t, i) => <TestimonialCard key={t.name} t={t} i={i * 3 + 1} />)}</div>
          <div>{col2.map((t, i) => <TestimonialCard key={t.name} t={t} i={i * 3 + 2} />)}</div>
        </div>
      </div>
    </section>
  );
}
