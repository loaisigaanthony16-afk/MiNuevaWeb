import Newsletter from "@/components/Newsletter";

export default function Footer() {
  return (
    <footer
      id="contacto"
      className="scroll-mt-24 border-t border-gray-200 bg-white py-12"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h4 className="font-display text-base font-bold text-gray-900">
            PremiumVapes
          </h4>
          <p className="mt-3 max-w-xs text-sm text-gray-500">
            Productos de alta calidad para uso adulto responsable.
          </p>
        </div>

        <div>
          <h4 className="font-display text-base font-bold text-gray-900">
            Enlaces
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-500">
            <li>
              <a href="#catalogo" className="transition hover:text-emerald-600">
                Catálogo
              </a>
            </li>
            <li>
              <a href="#faq" className="transition hover:text-emerald-600">
                FAQ
              </a>
            </li>
            <li>
              <a href="#" className="transition hover:text-emerald-600">
                Política de Privacidad
              </a>
            </li>
            <li>
              <a href="#" className="transition hover:text-emerald-600">
                Términos y Condiciones
              </a>
            </li>
          </ul>
        </div>

        <Newsletter />
      </div>

      <div className="mt-10 border-t border-gray-200 pt-6 text-center">
        <p className="text-xs text-gray-400">
          Solo para mayores de 21 años. No vendemos a menores de edad.
        </p>
        <p className="mt-1 text-xs text-gray-300">
          © {new Date().getFullYear()} PremiumVapes.
        </p>
      </div>
    </footer>
  );
}
