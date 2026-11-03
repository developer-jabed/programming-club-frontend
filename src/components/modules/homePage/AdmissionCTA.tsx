"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const highlights = [
  "নার্সারি থেকে ১০ম শ্রেণি পর্যন্ত",
  "সীমিত আসনে ভর্তি চলছে",
  "আধুনিক ও নিরাপদ পরিবেশ",
  "দক্ষ শিক্ষকমণ্ডলী",
];

export default function AdmissionCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, {
        y: 50,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="admission"
      ref={sectionRef}
      className="relative py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-screen-2xl px-6 md:px-10 lg:px-16">
        <div
          ref={contentRef}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 px-8 py-14 shadow-2xl shadow-emerald-900/20 md:px-14 md:py-16 lg:px-20 lg:py-20"
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-2xl" />

          {/* Grid pattern overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </span>
              <span className="text-sm font-semibold tracking-wide text-emerald-100">
                ভর্তি চলছে ২০২৬
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl lg:leading-tight">
              আপনার সন্তানের উজ্জ্বল
              <br />
              ভবিষ্যৎ শুরু হোক আজই
            </h2>

            {/* Subtitle */}
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-emerald-100/85 md:text-lg">
              নার্সারি থেকে দশম শ্রেণি পর্যন্ত সীমিত আসনে ভর্তি চলছে।
              আধুনিক শিক্ষা ও নিরাপদ পরিবেশে গড়ে তুলুন আগামীর নেতৃত্ব।
            </p>

            {/* Highlights */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-50"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/admission"
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-emerald-700 shadow-xl shadow-black/10 transition-all duration-300 hover:scale-[1.03] hover:bg-emerald-50"
              >
                এখনই আবেদন করুন
                <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/20"
              >
                যোগাযোগ করুন
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}