export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          Colección Curada · Uso 21+
        </span>
        <h1 className="font-display mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Vapes Premium,
          <br />
          <span className="text-emerald-600">selección para conocedores</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
          Cartuchos y desechables de alta pureza, curados por expertos para
          máxima calidad de vapor y sabor.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#catalogo"
            className="rounded-xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
          >
            Explorar Catálogo
          </a>
          <a
            href="#faq"
            className="rounded-xl border border-gray-300 px-8 py-3 text-base font-semibold text-gray-700 transition hover:border-emerald-300 hover:text-emerald-600"
          >
            Preguntas Frecuentes
          </a>
        </div>
      </div>
    </section>
  );
}
