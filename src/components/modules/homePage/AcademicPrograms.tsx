"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Baby,
  BookOpen,
  FlaskConical,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const programs = [
  {
    id: 1,
    icon: Baby,
    level: "নার্সারি",
    grade: "প্রি-প্রাইমারি",
    desc: "খেলাধুলা ও আনন্দের মাধ্যমে শিশুদের প্রথম শিক্ষার যাত্রা শুরু হয় এখানে। ভাষা, সংখ্যা ও সামাজিক দক্ষতার ভিত গড়ে তোলা হয়।",
    points: ["আনন্দময় শেখা", "মৌলিক দক্ষতা", "নিরাপদ পরিবেশ"],
    border: "border-t-orange-400",
    bg: "bg-orange-50/60",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    accent: "text-orange-600",
  },
  {
    id: 2,
    icon: BookOpen,
    level: "১ম - ৫ম শ্রেণি",
    grade: "প্রাথমিক স্তর",
    desc: "মৌলিক শিক্ষা, নৈতিকতা ও সৃজনশীলতার সমন্বয়ে গড়ে তোলা হয় শিক্ষার্থীর শক্ত ভিত। পড়া, লেখা ও গণিতের দক্ষতা বাড়ানো হয়।",
    points: ["মৌলিক শিক্ষা", "নৈতিক মূল্যবোধ", "সৃজনশীলতা"],
    border: "border-t-blue-400",
    bg: "bg-blue-50/50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    accent: "text-blue-600",
  },
  {
    id: 3,
    icon: FlaskConical,
    level: "৬ষ্ঠ - ৮ম শ্রেণি",
    grade: "নিম্ন মাধ্যমিক",
    desc: "বিজ্ঞান, গণিত ও প্রযুক্তির প্রতি আগ্রহ জাগিয়ে তোলা হয়। সমস্যা সমাধান ও বিশ্লেষণী চিন্তার দক্ষতা গড়ে তোলা হয় এই পর্যায়ে।",
    points: ["বিজ্ঞান ও গণিত", "প্রযুক্তি দক্ষতা", "বিশ্লেষণী চিন্তা"],
    border: "border-t-emerald-400",
    bg: "bg-emerald-50/60",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    accent: "text-emerald-600",
  },
  {
    id: 4,
    icon: GraduationCap,
    level: "৯ম - ১০ম শ্রেণি",
    grade: "মাধ্যমিক স্তর",
    desc: "বোর্ড পরীক্ষার পূর্ণাঙ্গ প্রস্তুতি ও ভবিষ্যৎ ক্যারিয়ারের দিকনির্দেশনা দেওয়া হয়। একাডেমিক শ্রেষ্ঠত্বের সাথে নেতৃত্বের গুণও বিকশিত হয়।",
    points: ["বোর্ড প্রস্তুতি", "ক্যারিয়ার গাইড", "নেতৃত্ব বিকাশ"],
    border: "border-t-violet-400",
    bg: "bg-violet-50/50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    accent: "text-violet-600",
  },
];

export default function AcademicPrograms() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
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

      gsap.from(cardsRef.current, {
        y: 50,
        opacity: 1,
        duration: 0.85,
        stagger: 0.13,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 78%",
          toggleActions: "play none none none",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-20 lg:py-24"
    >
      {/* soft background accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-200/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-screen-2xl px-6 md:px-10 lg:px-16">
        {/* ===== Heading ===== */}
        <div ref={headingRef} className="mb-12 text-center md:mb-16">
          <span className="mb-3 inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            একাডেমিক কার্যক্রম
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            প্রতিটি স্তরে{" "}
            <span className="text-emerald-600">মানসম্মত শিক্ষা</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
            নার্সারি থেকে মাধ্যমিক পর্যন্ত ধারাবাহিক ও যুগোপযোগী পাঠ্যক্রমের
            মাধ্যমে আমরা গড়ে তুলি আত্মবিশ্বাসী ও যোগ্য শিক্ষার্থী।
          </p>
        </div>

        {/* ===== Program Cards ===== */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
          {programs.map((program, index) => (
            <div
              key={program.id}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border border-black/[0.04] border-t-4 ${program.border} ${program.bg} p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] md:p-7`}
            >
              {/* number watermark */}
              <span className="pointer-events-none absolute right-4 top-3 text-6xl font-bold text-black/[0.03]">
                0{index + 1}
              </span>

              {/* Icon */}
              <div
                className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${program.iconBg} ${program.iconColor} transition-transform duration-500 group-hover:scale-110`}
              >
                <program.icon className="h-6 w-6" strokeWidth={1.7} />
              </div>

              {/* Level */}
              <p className={`text-xs font-semibold uppercase tracking-wider ${program.accent}`}>
                {program.grade}
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">
                {program.level}
              </h3>

              {/* Description */}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                {program.desc}
              </p>

              {/* Points */}
              <div className="mt-5 flex flex-wrap gap-2">
                {program.points.map((point) => (
                  <span
                    key={point}
                    className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-black/5"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ===== Bottom CTA ===== */}
        <div className="mt-12 flex justify-center md:mt-16">
          <Link
            href="#admission"
            className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition-all duration-300 hover:bg-emerald-500 hover:shadow-emerald-600/30"
          >
            ভর্তি সম্পর্কে জানুন
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}