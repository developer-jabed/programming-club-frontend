"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Users,
  Monitor,
  Wifi,
  Shield,
  BookOpen,
  Lightbulb,
  Trophy,
  Heart,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    id: 1,
    icon: Users,
    title: "দক্ষ ও অভিজ্ঞ শিক্ষক",
    desc: "উচ্চশিক্ষিত, অভিজ্ঞ ও শিক্ষার্থীবান্ধব শিক্ষকমণ্ডলী প্রতিটি শিক্ষার্থীর ব্যক্তিগত মনোযোগ দেন।",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
  },
  {
    id: 2,
    icon: Monitor,
    title: "আধুনিক শ্রেণিকক্ষ",
    desc: "স্মার্ট বোর্ড ও ডিজিটাল কন্টেন্টের মাধ্যমে পাঠদান আরও আকর্ষণীয় ও বোধগম্য করা হয়।",
    color: "text-teal-600",
    bg: "bg-teal-50",
    ring: "ring-teal-100",
  },
  {
    id: 3,
    icon: Lightbulb,
    title: "ডিজিটাল শিক্ষা ব্যবস্থা",
    desc: "প্রযুক্তিনির্ভর শিক্ষা পদ্ধতিতে শিক্ষার্থীরা আধুনিক বিশ্বের সাথে তাল মিলিয়ে চলতে শেখে।",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    ring: "ring-cyan-100",
  },
  {
    id: 4,
    icon: Shield,
    title: "নিরাপদ ক্যাম্পাস",
    desc: "সার্বক্ষণিক নিরাপত্তা ব্যবস্থা ও নিয়ন্ত্রিত প্রবেশদ্বার শিক্ষার্থীদের নিরাপদ পরিবেশ নিশ্চিত করে।",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
  },
  {
    id: 5,
    icon: BookOpen,
    title: "সমৃদ্ধ লাইব্রেরি",
    desc: "বয়স উপযোগী বই, রেফারেন্স ও শিক্ষামূলক উপকরণে ভরা লাইব্রেরি জ্ঞানচর্চাকে উৎসাহিত করে।",
    color: "text-teal-700",
    bg: "bg-teal-50",
    ring: "ring-teal-100",
  },
  {
    id: 6,
    icon: Wifi,
    title: "ফ্রি ওয়াইফাই ও ল্যাব",
    desc: "কম্পিউটার ল্যাব ও ইন্টারনেট সুবিধার মাধ্যমে ব্যবহারিক প্রযুক্তি শিক্ষা নিশ্চিত করা হয়।",
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    ring: "ring-cyan-100",
  },
  {
    id: 7,
    icon: Trophy,
    title: "সহশিক্ষা কার্যক্রম",
    desc: "খেলাধুলা, সাংস্কৃতিক অনুষ্ঠান ও প্রতিযোগিতার মাধ্যমে সর্বাঙ্গীণ বিকাশ ঘটানো হয়।",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
  },
  {
    id: 8,
    icon: Heart,
    title: "নৈতিক ও মূল্যবোধভিত্তিক শিক্ষা",
    desc: "একাডেমিক সাফল্যের পাশাপাশি সততা, দায়িত্ববোধ ও মানবিক গুণাবলি গড়ে তোলা হয়।",
    color: "text-teal-600",
    bg: "bg-teal-50",
    ring: "ring-teal-100",
  },
];

export default function WhyChooseUs() {
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
        y: 40,
        opacity: 1,
        duration: 0.75,
        stagger: 0.08,
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
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-screen-2xl px-6 md:px-10 lg:px-16">
        {/* ===== Heading ===== */}
        <div ref={headingRef} className="mb-12 text-center md:mb-16">
          <span className="mb-3 inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            কেন আমাদের বেছে নেবেন
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            যা আমাদের করে তোলে{" "}
            <span className="text-emerald-600">আলাদা</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
            শুধু পাঠদান নয় — আমরা গড়ে তুলি নিরাপদ পরিবেশ, আধুনিক সুযোগ-সুবিধা
            এবং মূল্যবোধসম্পন্ন শিক্ষার এক সমন্বিত অভিজ্ঞতা।
          </p>
        </div>

        {/* ===== Feature Grid ===== */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className="group relative overflow-hidden rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(16,185,129,0.10)] md:rounded-3xl md:p-6"
            >
              {/* hover glow */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-200/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg} ${feature.color} ring-1 ${feature.ring} transition-transform duration-500 group-hover:scale-110`}
                >
                  <feature.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>

                {/* Title */}
                <h3 className="text-[15px] font-bold leading-snug text-slate-900 md:text-base">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}