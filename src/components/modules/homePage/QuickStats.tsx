"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Users, GraduationCap, BookOpen, Award } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  {
    id: 1,
    icon: Users,
    value: 1100,
    suffix: "+",
    label: "মোট আসন",
    bg: "bg-emerald-50/80",
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    numberColor: "text-emerald-700",
  },
  {
    id: 2,
    icon: GraduationCap,
    value: 25,
    suffix: "+",
    label: "দক্ষ শিক্ষক",
    bg: "bg-teal-50/80",
    border: "border-l-teal-500",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    numberColor: "text-teal-700",
  },
  {
    id: 3,
    icon: BookOpen,
    value: 500,
    suffix: "+",
    label: "সন্তুষ্ট শিক্ষার্থী",
    bg: "bg-cyan-50/80",
    border: "border-l-cyan-500",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    numberColor: "text-cyan-700",
  },
  {
    id: 4,
    icon: Award,
    value: 10,
    suffix: "",
    label: "শ্রেণি",
    bg: "bg-emerald-50/60",
    border: "border-l-emerald-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    numberColor: "text-emerald-800",
  },
];

export default function QuickStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const numbersRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Heading animation
      gsap.from(headingRef.current, {
        y: 40,
        opacity: 1,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      // Cards entrance
      gsap.from(cardsRef.current, {
        y: 50,
        opacity: 1,
        duration: 0.85,
        stagger: 0.14,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 78%",
          toggleActions: "play none none none",
        },
      });

      // Smooth number counting
      numbersRef.current.forEach((el, index) => {
        if (!el) return;
        const target = stats[index].value;

        const obj = { val: 0 };

        gsap.to(obj, {
          val: target,
          duration: 2.4,
          delay: 0.35 + index * 0.14,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 78%",
            toggleActions: "play none none none",
          },
          onUpdate: () => {
            el.textContent = Math.floor(obj.val).toLocaleString("en-IN");
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-20 lg:py-24"
    >
      {/* soft top line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />

      <div className="relative mx-auto max-w-screen-2xl px-6 md:px-10 lg:px-16">
        {/* ===== Heading ===== */}
        <div ref={headingRef} className="mb-12 text-center md:mb-16">
          <span className="mb-3 inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            আমাদের অগ্রগতি
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            সংখ্যায় আমাদের পরিচয়
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
            মাদার কেয়ার স্কুল অ্যান্ড কলেজে শিক্ষার্থী, শিক্ষক এবং অবকাঠামোর
            মাধ্যমে আমরা গড়ে তুলছি একটি নির্ভরযোগ্য শিক্ষা পরিবেশ।
          </p>
        </div>

        {/* ===== Cards ===== */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className={`group relative overflow-hidden rounded-2xl border border-black/[0.04] border-l-4 ${stat.border} ${stat.bg} p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(16,185,129,0.10)] md:rounded-3xl md:p-7`}
            >
              {/* soft shine */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/60 blur-2xl transition-opacity duration-500 group-hover:opacity-80" />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor} transition-transform duration-500 group-hover:scale-110 md:h-12 md:w-12 md:rounded-2xl`}
                >
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.8} />
                </div>

                {/* Number */}
                <div className="flex items-baseline gap-0.5">
                  <span
                    ref={(el) => {
                      numbersRef.current[index] = el;
                    }}
                    className={`text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem] ${stat.numberColor}`}
                  >
                    0
                  </span>
                  <span className={`text-2xl font-bold md:text-3xl ${stat.numberColor}`}>
                    {stat.suffix}
                  </span>
                </div>

                {/* Label */}
                <p className="mt-2 text-sm font-medium text-slate-500 md:text-[15px]">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}