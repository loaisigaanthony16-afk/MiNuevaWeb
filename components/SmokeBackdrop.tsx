/**
 * Capa de humo real detrás del titular.
 *
 * El clip viene con fondo negro, así que se compone con `mix-blend-mode:
 * screen`: el negro desaparece y solo queda el humo. Un degradado de máscara
 * difumina los bordes para que no se note el recuadro del video.
 *
 * Se sirve WebM primero (820 KB) y MP4 como respaldo (1.9 MB), con póster
 * para el primer pintado. Sin audio y sin JavaScript.
 */
export default function SmokeBackdrop() {
  return (
    <div className="smoke-layer" aria-hidden>
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/smoke-poster.jpg"
      >
        <source src="/smoke.webm" type="video/webm" />
        <source src="/smoke.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
