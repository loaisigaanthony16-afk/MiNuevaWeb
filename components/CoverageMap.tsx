/**
 * Mapa de cobertura.
 *
 * La silueta se trazó proyectando coordenadas reales de Nicaragua
 * (lon -87.7 a -83.1, lat 10.7 a 15.0) sobre el viewBox, así que la forma
 * es reconocible: frontera norte, costa caribeña, río San Juan al sur y
 * costa del Pacífico. Los dos lagos van en su posición aproximada.
 *
 * Se dibuja sola al cargar y late en varios puntos del territorio.
 */

const OUTLINE = [
  [20, 140], // esquina noroeste, Pacífico
  [66, 121],
  [111, 88],
  [150, 69],
  [183, 43],
  [229, 17], // frontera norte con Honduras
  [268, 23],
  [300, 10], // Cabo Gracias a Dios
  [314, 49],
  [300, 88],
  [294, 140], // costa caribeña
  [287, 179],
  [281, 212],
  [268, 238],
  [261, 277], // desembocadura del San Juan
  [216, 270],
  [177, 264],
  [150, 264], // frontera sur con Costa Rica
  [137, 231],
  [111, 212],
  [85, 192],
  [66, 173], // costa del Pacífico
  [40, 147],
];

// Entregas repartidas por el territorio (sin nombrar ciudades).
const PINGS = [
  [92, 148],
  [152, 112],
  [233, 86],
  [256, 152],
  [116, 200],
  [206, 196],
  [253, 226],
  [186, 252],
];

export default function CoverageMap({ className = "" }: { className?: string }) {
  const d = OUTLINE.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ") + " Z";

  return (
    <svg
      viewBox="0 0 340 300"
      fill="none"
      className={className}
      role="img"
      aria-label="Cobertura de entrega en todo el territorio nacional de Nicaragua"
    >
      <defs>
        <linearGradient id="coast" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6edd6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#b08d3e" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* Territorio */}
      <path d={d} fill="#dcc183" fillOpacity="0.05" />
      <path
        d={d}
        stroke="url(#coast)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="map-outline"
      />

      {/* Lago de Managua y lago de Nicaragua */}
      <ellipse
        cx="111"
        cy="183"
        rx="29"
        ry="8"
        transform="rotate(-28 111 183)"
        fill="#0a0a0b"
        stroke="#dcc183"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <ellipse
        cx="170"
        cy="235"
        rx="33"
        ry="17"
        transform="rotate(-38 170 235)"
        fill="#0a0a0b"
        stroke="#dcc183"
        strokeOpacity="0.35"
        strokeWidth="1"
      />

      {/* Entregas */}
      {PINGS.map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r="2"
            fill="#dcc183"
            fillOpacity="0"
            className="map-ping"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
          <circle cx={x} cy={y} r="1.8" fill="#f6edd6" fillOpacity="0.8" />
        </g>
      ))}
    </svg>
  );
}
