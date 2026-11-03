"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Facebook,
  Linkedin,
  Mail,
  Phone,
  GraduationCap,
  Star,
} from "lucide-react";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

interface Teacher {
  id: number;
  name: string;
  designation: string;
  subject?: string;
  qualification: string;
  image: string;
  featured?: boolean;
  email?: string;
  phone?: string;
  facebook?: string;
  linkedin?: string;
}

const teachers: Teacher[] = [
  {
    id: 1,
    name: "পরেশ রায়",
    designation: "অধ্যক্ষ",
    qualification: "এম.এ (বাংলা), বি.এড",
    image: "/teachers/poresh.jpg",
    featured: true,
    email: "principal@mothercare.edu.bd",
    phone: "01700000000",
  },

  {
    id: 3,
    name: "মোঃ শামিম ইসলাম",
    designation: "সিনিয়র শিক্ষক",
    subject: "ইংরেজি",
    qualification: "বিএ, অনার্স",
    image: "/teachers/samim1.jpg",
    facebook: "https://www.facebook.com/shamimislam.suvro.1",
  },
  {
    id: 4,
    name: "মোঃ মমিনুল ইসলাম",
    designation: "সহকারী শিক্ষক",
    subject: "বিজ্ঞান",
    qualification: "বিএ, অনার্স ",
    image: "/teachers/mominul.jpg",
    facebook: "https://www.facebook.com/md.mominul.islam.343817",
  },
  {
    id: 5,
    name: "মোঃ সজিব ইসলাম",
    designation: "সহকারী শিক্ষক",
    subject: "বাংলা",
    qualification: "এম.এসসি (রসায়ন)",
    image: "/teachers/sojib.jpg",
    facebook: "https://www.facebook.com/md.sojib.islam.918760",
  },
  {
    id: 6,
    name: "সাবিনা ইয়াসমিন",
    designation: "সহকারী শিক্ষক",
    subject: "বাংলা",
    qualification: "এম.এ (বাংলা), বি.এড",
    image: "/teachers/teacher-4.jpg",
    facebook: "#",
  },
];

export default function TeacherSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const featuredTeachers = teachers.filter((t) => t.featured);
  const regularTeachers = teachers.filter((t) => !t.featured);

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

      gsap.from(featuredRef.current, {
        y: 50,
        opacity: 1,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 78%",
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
          start: "top 65%",
          toggleActions: "play none none none",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="teachers"
      ref={sectionRef}
      className="relative py-16 md:py-20 lg:py-24"
    >
      {/* Soft background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-1/3 h-72 w-72 rounded-full bg-emerald-200/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-teal-200/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-screen-2xl px-6 md:px-10 lg:px-16">
        {/* ===== Heading ===== */}
        <div
          ref={headingRef}
          className="mb-12 text-center md:mb-16"
        >
          <span className="mb-3 inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            আমাদের শিক্ষকমণ্ডলী
          </span>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            যাদের হাত ধরে গড়ে ওঠে{" "}
            <span className="text-emerald-600">
              ভবিষ্যৎ প্রজন্ম
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
            অভিজ্ঞ, দক্ষ ও নিবেদিতপ্রাণ শিক্ষকমণ্ডলী প্রতিটি শিক্ষার্থীর
            মেধা বিকাশে নিরলসভাবে কাজ করে যাচ্ছেন।
          </p>
        </div>

        {/* ===== Featured Principal / Vice Principal ===== */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 md:mb-10">
          {featuredTeachers.map((teacher, index) => (
            <div
              key={teacher.id}
              ref={(el) => {
                featuredRef.current[index] = el;
              }}
              className="group relative flex items-center gap-5 overflow-hidden rounded-3xl border border-black/[0.04] bg-gradient-to-br from-white to-emerald-50/50 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(16,185,129,0.12)] md:p-7"
            >
              {/* Rank badge */}
              <div className="absolute right-5 top-5 flex items-center gap-1 rounded-full bg-emerald-600/10 px-3 py-1 text-emerald-700">
                <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                <span className="text-[11px] font-semibold">
                  শীর্ষ নেতৃত্ব
                </span>
              </div>

              {/* Photo */}
              <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl ring-4 ring-white shadow-lg md:h-32 md:w-32">
                <Image
                  src={teacher.image}
                  alt={teacher.name}
                  fill
                  sizes="128px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  {teacher.designation}
                </p>

                <h3 className="mt-1 truncate text-xl font-bold text-slate-900 md:text-2xl">
                  {teacher.name}
                </h3>

                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <GraduationCap className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                  {teacher.qualification}
                </p>

                {/* Contact row */}
                <div className="mt-4 flex items-center gap-3">
                  {teacher.email && (
                    <a
                      href={`mailto:${teacher.email}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 ring-1 ring-emerald-100 transition-all duration-300 hover:bg-emerald-600 hover:text-white"
                      aria-label={`Email ${teacher.name}`}
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}

                  {teacher.phone && (
                    <a
                      href={`tel:${teacher.phone}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 ring-1 ring-emerald-100 transition-all duration-300 hover:bg-emerald-600 hover:text-white"
                      aria-label={`Call ${teacher.name}`}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== Regular Teacher Grid ===== */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {regularTeachers.map((teacher, index) => (
            <div
              key={teacher.id}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className="group relative overflow-hidden rounded-3xl border border-black/[0.04] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
            >
              {/* Photo */}
              <div className="relative h-56 w-full overflow-hidden md:h-60">
                <Image
                  src={teacher.image}
                  alt={teacher.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Social icons — slide up on hover */}
                <div className="absolute bottom-0 left-0 right-0 flex translate-y-full items-center justify-center gap-3 pb-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {teacher.facebook && (
                    <a
                      href={teacher.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-emerald-700 shadow-md transition-transform duration-300 hover:scale-110"
                      aria-label={`${teacher.name} Facebook`}
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}

                  {teacher.linkedin && (
                    <a
                      href={teacher.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-emerald-700 shadow-md transition-transform duration-300 hover:scale-110"
                      aria-label={`${teacher.name} LinkedIn`}
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                {teacher.subject && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                    {teacher.subject}
                  </p>
                )}

                <h3 className="mt-1 text-base font-bold text-slate-900 md:text-lg">
                  {teacher.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {teacher.designation}
                </p>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                  {teacher.qualification}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}