"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  {
    id: 1,
    image: "/asset/img1.jpg",
    title: "মাদার কেয়ার স্কুল অ্যান্ড কলেজ",
    subtitle: "শিক্ষাই ভবিষ্যতের আলোর পথ",
    badge: "ভর্তি চলছে ২০২৬",
  },
  {
    id: 2,
    image: "/asset/img2.jpg",
    title: "আধুনিক ও মানসম্মত শিক্ষা",
    subtitle: "নার্সারি থেকে দশম শ্রেণি পর্যন্ত সম্পূর্ণ শিক্ষা ব্যবস্থা",
    badge: "সীমিত আসন",
  },
  {
    id: 3,
    image: "/asset/img3.jpg",
    title: "নিরাপদ ও অনুপ্রেরণামূলক পরিবেশ",
    subtitle: "আপনার সন্তানের উজ্জ্বল ভবিষ্যতের নিশ্চয়তা",
    badge: "এখনই ভর্তি হোন",
  },
  {
    id: 4,
    image: "/asset/img4.jpg",
    title: "দক্ষ ও অভিজ্ঞ শিক্ষকমণ্ডলী",
    subtitle: "শিক্ষার্থীবান্ধব পরিবেশে মানসম্মত পাঠদান",
    badge: "উন্নত শিক্ষা",
  },
  {
    id: 5,
    image: "/asset/img5.jpg",
    title: "ডিজিটাল ও আধুনিক ক্লাসরুম",
    subtitle: "প্রযুক্তিনির্ভর শিক্ষার মাধ্যমে এগিয়ে চলুন",
    badge: "স্মার্ট শিক্ষা",
  },
  {
    id: 6,
    image: "/asset/img6.jpg",
    title: "সহশিক্ষা ও খেলাধুলার সুযোগ",
    subtitle: "শরীর ও মনের সুস্থ বিকাশে আমরা প্রতিশ্রুতিবদ্ধ",
    badge: "পূর্ণাঙ্গ বিকাশ",
  },
  {
    id: 7,
    image: "/asset/img7.jpg",
    title: "আপনার সন্তানের উজ্জ্বল ভবিষ্যৎ এখানেই শুরু",
    subtitle: "মাদার কেয়ার — বিশ্বাস ও মানের প্রতীক",
    badge: "ভর্তি চলছে",
  },
];

export default function HomepageHeader() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Auto play every 6 seconds
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slideVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.06,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 280, damping: 32 },
        opacity: { duration: 0.45 },
        scale: { duration: 0.7 },
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-40%" : "40%",
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: "spring", stiffness: 280, damping: 32 },
        opacity: { duration: 0.4 },
      },
    }),
  };

  const contentVariants: Variants = {
    hidden: { opacity: 0, y: 36 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.28 + i * 0.11,
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  return (
    <section className="relative h-[75vh] min-h-[480px]  w-full overflow-hidden bg-[#0c1f1a]">
      {/* ===== SLIDER ===== */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <div className="absolute inset-0">
            <Image
              src={slides[current].image}
              alt={slides[current].title}
              fill
              priority={current === 0}
              className="object-cover"
              sizes="100vw"
              quality={90}
            />
            {/* Dark overlays for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-screen-2xl px-6 md:px-10 lg:px-16">
          <div className="max-w-3xl">
            {/* Badge */}
            <motion.div
              key={`badge-${current}`}
              custom={0}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-5 py-2.5 backdrop-blur-md"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-sm font-semibold tracking-wide text-emerald-200">
                {slides[current].badge}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              key={`title-${current}`}
              custom={1}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="mb-5 text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.2rem]"
            >
              {slides[current].title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              key={`subtitle-${current}`}
              custom={2}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="mb-10 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl"
            >
              {slides[current].subtitle}
            </motion.p>

            {/* Buttons */}
            <motion.div
              key={`buttons-${current}`}
              custom={3}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="#admission"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-950/50 transition-all duration-300 hover:scale-[1.03] hover:bg-emerald-500 hover:shadow-emerald-700/40"
              >
                ভর্তি কার্যক্রম
              </Link>

              <Link
                href="#about"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-white/50 hover:bg-white/20"
              >
                আমাদের সম্পর্কে
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ===== ARROWS ===== */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-600 md:left-8"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-600 md:right-8"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* ===== DOTS ===== */}
      <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > current ? 1 : -1);
              setCurrent(index);
            }}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === current
                ? "w-10 bg-emerald-400"
                : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}