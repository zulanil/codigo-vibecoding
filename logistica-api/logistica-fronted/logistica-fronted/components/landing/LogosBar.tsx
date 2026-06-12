const logos = [
  "Coca-Cola FEMSA", "DHL Express", "Mercado Libre", "Falabella", "Rappi",
  "Grupo Bimbo", "Claro Colombia", "Postobón", "Bavaria", "Almacenes Éxito",
  "Coca-Cola FEMSA", "DHL Express", "Mercado Libre", "Falabella", "Rappi",
  "Grupo Bimbo", "Claro Colombia", "Postobón", "Bavaria", "Almacenes Éxito",
];

export default function LogosBar() {
  return (
    <section className="py-12 overflow-hidden bg-lnd-bg border-y border-white/[0.06]">
      <p
        className="text-center text-xs font-medium tracking-widest uppercase mb-8 text-white/30"
        style={{ fontFamily: "var(--font-body-landing, system-ui)" }}
      >
        Empresas líderes en Latinoamérica confían en LogísticaWeb
      </p>
      <div className="relative flex">
        <div className="landing-marquee flex items-center gap-16 whitespace-nowrap">
          {logos.map((name, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0 opacity-30">
              <div className="w-6 h-6 rounded bg-white/15" />
              <span
                className="text-sm font-semibold text-white"
                style={{ fontFamily: "var(--font-heading-landing, system-ui)" }}
              >
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
