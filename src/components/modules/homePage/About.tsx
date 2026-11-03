"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Calendar, Layers, Users, MapPin } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const infoCards = [
  {
    id: 1,
    icon: Calendar,
    title: "প্রতিষ্ঠাকাল",
    value: "২০২৫",
    border: "border-l-emerald-500",
    bg: "bg-emerald-50/70",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    id: 2,
    icon: Layers,
    title: "শ্রেণি",
    value: "নার্সারি - ১০ম",
    border: "border-l-teal-500",
    bg: "bg-teal-50/70",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    id: 3,
    icon: Users,
    title: "সেকশন",
    value: "প্রতি শ্রেণিতে ২টি",
    border: "border-l-cyan-500",
    bg: "bg-cyan-50/70",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    id: 4,
    icon: MapPin,
    title: "আসন সংখ্যা",
    value: "৫০ জন / সেকশন",
    border: "border-l-emerald-600",
    bg: "bg-emerald-50/50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(leftRef.current, {
        x: -40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      gsap.from(cardsRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-screen-2xl px-6 md:px-10 lg:px-16">
        {/* ===== Section Header (full width) ===== */}
        <div className="mb-12 max-w-3xl md:mb-16">
          <span className="mb-4 inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            আমাদের সম্পর্কে
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            মাদার কেয়ার স্কুল{" "}
            <span className="text-emerald-600">অ্যান্ড কলেজ</span>
          </h2>
        </div>

        {/* ===== Content Grid ===== */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Text - 5 columns */}
          <div ref={leftRef} className="lg:col-span-5">
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-600 md:text-base">
              <p>
                মাদার কেয়ার স্কুল অ্যান্ড কলেজ প্রতিষ্ঠিত হয় ২০২৫ সালে।
                প্রতিষ্ঠানটি অবস্থিত ১৩ মাইল বাজার, কাহারোল থানা, দিনাজপুর জেলায়।
              </p>
              <p>
                আমাদের লক্ষ্য শুধুমাত্র পরীক্ষায় ভালো ফলাফল নয় — বরং একজন
                আদর্শ, সৎ ও দায়িত্বশীল নাগরিক তৈরি করা। আমরা বিশ্বাস করি,
                শিক্ষাই ভবিষ্যতের আলোর পথ।
              </p>
              <p>
                আধুনিক শিক্ষা পদ্ধতি, দক্ষ শিক্ষকমণ্ডলী এবং নিরাপদ পরিবেশের
                মাধ্যমে আমরা শিক্ষার্থীদের সর্বোচ্চ বিকাশ নিশ্চিত করতে
                প্রতিশ্রুতিবদ্ধ।
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-px w-12 bg-emerald-500" />
              <p className="text-sm font-medium text-emerald-700">
                শিক্ষা · নৈতিকতা · উন্নয়ন
              </p>
            </div>
          </div>

          {/* Right Cards - 7 columns (more space) */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:col-span-7">
            {infoCards.map((card, index) => (
              <div
                key={card.id}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className={`group relative overflow-hidden rounded-2xl border border-black/[0.04] border-l-4 ${card.border} ${card.bg} p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(16,185,129,0.10)] md:rounded-3xl md:p-7`}
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/70 blur-2xl" />

                <div className="relative z-10">
                  <div
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor} transition-transform duration-500 group-hover:scale-110`}
                  >
                    <card.icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>

                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-1.5 text-lg font-bold text-slate-900 md:text-xl">
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}