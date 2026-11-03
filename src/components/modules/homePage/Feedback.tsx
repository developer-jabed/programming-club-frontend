"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star, Quote } from "lucide-react";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

interface Feedback {
  id: number;
  name: string;
  role: string;
  studentClass?: string;
  message: string;
  rating: number;
  image?: string;
}

const feedbacks: Feedback[] = [
  {
    id: 1,
    name: "মোঃ শাহীন আলম",
    role: "অভিভাবক",
    studentClass: "৫ম শ্রেণি",
    message:
      "আমার মেয়ে এই স্কুলে ভর্তি হওয়ার পর থেকে তার পড়াশোনার প্রতি আগ্রহ অনেক বেড়েছে। শিক্ষকরা প্রতিটি শিক্ষার্থীর প্রতি ব্যক্তিগতভাবে মনোযোগ দেন, যা সত্যিই প্রশংসনীয়।",
    rating: 5,
  },
  {
    id: 2,
    name: "রুমানা আক্তার",
    role: "অভিভাবক",
    studentClass: "৮ম শ্রেণি",
    message:
      "আধুনিক শিক্ষা পদ্ধতি ও নিরাপদ পরিবেশের কারণে আমরা নিশ্চিন্তে আমাদের সন্তানকে এখানে পড়াচ্ছি। ফলাফলও প্রতি বছর দারুণ আসছে।",
    rating: 5,
  },
  {
    id: 3,
    name: "তানভীর হাসান",
    role: "প্রাক্তন শিক্ষার্থী",
    studentClass: "এসএসসি ২০২৩",
    message:
      "এই স্কুলের শিক্ষকরা শুধু পাঠ্যবই নয়, জীবনের জন্যও আমাদের প্রস্তুত করেছেন। আজ আমি যা কিছু অর্জন করেছি তার পেছনে তাদের অবদান অনেক।",
    rating: 5,
  },
  {
    id: 4,
    name: "ফরিদা ইয়াসমিন",
    role: "অভিভাবক",
    studentClass: "নার্সারি",
    message:
      "প্রথমবার সন্তানকে স্কুলে পাঠানোর দুশ্চিন্তা ছিল, কিন্তু এখানকার যত্নশীল পরিবেশ দেখে সেই দুশ্চিন্তা দূর হয়ে গেছে। ধন্যবাদ মাদার কেয়ারকে।",
    rating: 4,
  },
  {
    id: 5,
    name: "মোঃ কামরুজ্জামান",
    role: "অভিভাবক",
    studentClass: "৭ম শ্রেণি",
    message:
      "নিয়মিত অভিভাবক সমাবেশ ও শিক্ষার অগ্রগতি সম্পর্কে আপডেট দেওয়ার ব্যবস্থা আমার খুব ভালো লেগেছে। যোগাযোগ ব্যবস্থা অত্যন্ত স্বচ্ছ।",
    rating: 5,
  },
  {
    id: 6,
    name: "নাজমুন নাহার",
    role: "অভিভাবক",
    studentClass: "৩য় শ্রেণি",
    message:
      "সহশিক্ষা কার্যক্রম ও খেলাধুলার সুযোগ থাকায় আমার সন্তান শুধু পড়াশোনায় নয়, সার্বিক বিকাশেও এগিয়ে যাচ্ছে।",
    rating: 5,
  },
];

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function FeedbackSection() {
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
        duration: 0.8,
        stagger: 0.1,
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
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 py-16 md:py-20 lg:py-24"
    >
      {/* Decorative blurred orbs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

      {/* grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-screen-2xl px-6 md:px-10 lg:px-16">
        {/* ===== Heading ===== */}
        <div ref={headingRef} className="mb-12 text-center md:mb-16">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-100 backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-emerald-300 text-emerald-300" />
            অভিভাবক ও শিক্ষার্থীদের মতামত
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            যা বলছেন আমাদের{" "}
            <span className="text-emerald-300">পরিবারের সদস্যরা</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-emerald-100/80 md:text-lg">
            আমাদের শিক্ষার্থী ও অভিভাবকদের অভিজ্ঞতাই আমাদের সবচেয়ে বড় অর্জন।
          </p>
        </div>

        {/* ===== Feedback Grid ===== */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {feedbacks.map((fb, index) => (
            <div
              key={fb.id}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/[0.11] hover:shadow-[0_20px_45px_rgba(0,0,0,0.25)] md:p-7"
            >
              {/* quote icon watermark */}
              <Quote
                className="absolute right-5 top-5 h-10 w-10 text-white/[0.06] transition-colors duration-500 group-hover:text-white/10"
                fill="currentColor"
                strokeWidth={0}
              />

              {/* stars */}
              <div className="mb-4 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < fb.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-white/10 text-white/10"
                    }`}
                  />
                ))}
              </div>

              {/* message */}
              <p className="flex-1 text-sm leading-relaxed text-emerald-50/90 md:text-[15px]">
                “{fb.message}”
              </p>

              {/* divider */}
              <div className="my-5 h-px w-full bg-gradient-to-r from-white/0 via-white/15 to-white/0" />

              {/* person */}
              <div className="flex items-center gap-3">
                {fb.image ? (
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
                    <Image
                      src={fb.image}
                      alt={fb.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white ring-2 ring-white/20">
                    {getInitials(fb.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {fb.name}
                  </p>
                  <p className="truncate text-xs text-emerald-200/70">
                    {fb.role}
                    {fb.studentClass ? ` • ${fb.studentClass}` : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== Trust stat strip ===== */}
        <div className="mt-14 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4 md:mt-16">
          {[
            { value: "৪.৯/৫", label: "গড় রেটিং" },
            { value: "৫০০+", label: "সন্তুষ্ট অভিভাবক" },
            { value: "৯৮%", label: "পাসের হার" },
            { value: "১.৫+", label: "বছরের অভিজ্ঞতা" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white md:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-200/70 md:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}