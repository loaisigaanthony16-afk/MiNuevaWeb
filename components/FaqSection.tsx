"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ } from "@/lib/data";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 bg-white py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            Ayuda
          </span>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Preguntas Frecuentes
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {FAQ.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`overflow-hidden rounded-xl border transition ${
                  isOpen ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-gray-900">{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-emerald-600 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
