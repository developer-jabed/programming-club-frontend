
'use client';

import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  Users, BookOpen, Award, MapPin, Phone, Mail, Calendar,
  GraduationCap, Shield, Wifi, Monitor, Trophy
} from "lucide-react";


export const revalidate = 1800;

export default function MotherCareHomepage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] bg-[length:50px_50px] opacity-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-2 shadow-lg mb-6">
              <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-emerald-700">ভর্তি চলছে ২০২৬</span>
            </div>

            <h1 className="text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
              মাদার কেয়ার স্কুল অ্যান্ড কলেজ
            </h1>
            <p className="text-2xl text-slate-600 max-w-3xl mx-auto mb-10">
              শিক্ষাই ভবিষ্যতের আলোর পথ
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <motion.a
                href="#admission"
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all"
              >
                ভর্তি কার্যক্রম
              </motion.a>
              <motion.a
                href="#about"
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center justify-center px-10 py-4 border-2 border-slate-900 text-slate-900 font-semibold rounded-2xl text-lg hover:bg-slate-900 hover:text-white transition-all"
              >
                আমাদের সম্পর্কে
              </motion.a>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="text-slate-400">↓</div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl font-bold text-slate-900 mb-8">আমাদের সম্পর্কে</h2>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>মাদার কেয়ার স্কুল অ্যান্ড কলেজ প্রতিষ্ঠিত হয় ২০২৫ সালে।</p>
                <p>প্রতিষ্ঠানটি অবস্থিত ১৩ মাইল বাজার, কাহারোল থানা, দিনাজপুর জেলা।</p>
                <p>আমাদের লক্ষ্য শুধুমাত্র পরীক্ষায় ভালো ফলাফল নয় — বরং একজন আদর্শ, সৎ ও দায়িত্বশীল নাগরিক তৈরি করা।</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { title: "প্রতিষ্ঠাকাল", value: "২০২৫" },
                { title: "শ্রেণি", value: "নার্সারি - ১০ম" },
                { title: "সেকশন", value: "প্রতি শ্রেণিতে ২টি" },
                { title: "আসন", value: "৫০ জন/সেকশন" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-3xl p-8 text-center hover:shadow-xl transition-all"
                >
                  <p className="text-emerald-600 font-medium text-sm mb-2">{item.title}</p>
                  <p className="text-4xl font-bold text-slate-900">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ACADEMIC PROGRAMS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">আমাদের একাডেমিক কার্যক্রম</h2>
            <p className="text-xl text-slate-600">প্রতিটি স্তরে মানসম্মত শিক্ষা</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { level: "নার্সারি", desc: "শিশুদের আনন্দময় শিক্ষার সূচনা", color: "orange" },
              { level: "১ম - ৫ম শ্রেণি", desc: "মৌলিক শিক্ষা, নৈতিকতা ও সৃজনশীলতা", color: "blue" },
              { level: "৬ষ্ঠ - ৮ম শ্রেণি", desc: "বিজ্ঞান, গণিত ও প্রযুক্তি দক্ষতা", color: "emerald" },
              { level: "৯ম - ১০ম শ্রেণি", desc: "বোর্ড পরীক্ষার প্রস্তুতি ও ক্যারিয়ার গাইডলাইন", color: "violet" },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -12 }}
                className="bg-white rounded-3xl p-10 shadow-lg border border-slate-100 hover:border-blue-200 transition-all group"
              >
                <div className={`h-16 w-16 rounded-2xl bg-${item.color}-100 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <GraduationCap className={`h-9 w-9 text-${item.color}-600`} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.level}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">কেন আমাদের স্কুল?</h2>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              "দক্ষ ও অভিজ্ঞ শিক্ষক", "আধুনিক শ্রেণিকক্ষ", "ডিজিটাল শিক্ষা ব্যবস্থা",
              "স্মার্ট উপস্থিতি", "নিরাপদ ক্যাম্পাস", "সহশিক্ষা কার্যক্রম",
              "বিজ্ঞানভিত্তিক শিক্ষা", "তথ্যপ্রযুক্তি শিক্ষা"
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 items-start p-6 rounded-3xl hover:bg-emerald-50 transition-colors"
              >
                <div className="mt-1 text-emerald-600">
                  <Award className="h-7 w-7" />
                </div>
                <p className="font-medium text-lg leading-tight">{feature}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TEACHERS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">আমাদের শিক্ষকবৃন্দ</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">উচ্চশিক্ষিত, অভিজ্ঞ ও শিক্ষার্থীবান্ধব শিক্ষকমণ্ডলী</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { name: "মোঃ রহিম উদ্দিন", subject: "গণিত ও বিজ্ঞান", exp: "১২ বছর" },
              { name: "ফাতেমা বেগম", subject: "বাংলা ও ইংরেজি", exp: "৯ বছর" },
              { name: "আব্দুল্লাহ আল মামুন", subject: "কম্পিউটার", exp: "৭ বছর" },
            ].map((teacher, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-3xl overflow-hidden shadow-xl"
              >
                <div className="h-72 bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center">
                  <div className="text-8xl opacity-30">👩‍🏫</div>
                </div>
                <div className="p-8">
                  <h4 className="font-bold text-2xl mb-1">{teacher.name}</h4>
                  <p className="text-emerald-600">{teacher.subject}</p>
                  <p className="text-sm text-slate-500 mt-4">অভিজ্ঞতা: {teacher.exp}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FACILITIES */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16">আমাদের সুবিধাসমূহ</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[
              { icon: BookOpen, title: "লাইব্রেরি" },
              { icon: Monitor, title: "কম্পিউটার ল্যাব" },
              { icon: Trophy, title: "খেলার মাঠ" },
              { icon: Shield, title: "নিরাপত্তা ব্যবস্থা" },
              { icon: Wifi, title: "ফ্রি ওয়াইফাই" },
              { icon: GraduationCap, title: "ডিজিটাল ক্লাসরুম" },
            ].map((fac, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8 }}
                className="bg-white border border-slate-100 rounded-3xl p-10 text-center hover:shadow-2xl transition-all"
              >
                <fac.icon className="mx-auto h-14 w-14 text-blue-600 mb-6" />
                <p className="font-semibold text-xl">{fac.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          {[
            { end: 1100, suffix: "+", label: "মোট আসন" },
            { end: 25, suffix: "+", label: "দক্ষ শিক্ষক" },
            { end: 1000, suffix: "+", label: "সন্তুষ্ট শিক্ষার্থী" },
            { end: 11, suffix: "", label: "শ্রেণি" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8 }}
              whileInView={{ scale: 1 }}
              className="space-y-3"
            >
              <div className="text-6xl font-bold">
                <CountUp end={stat.end} duration={2.5} />{stat.suffix}
              </div>
              <p className="text-blue-100 text-xl">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ADMISSION */}
      <section id="admission" className="py-24 bg-emerald-50">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-6xl font-bold mb-6">ভর্তি চলছে</h2>
          <p className="text-2xl text-slate-600 mb-10">নার্সারি থেকে ১০ম শ্রেণি পর্যন্ত সীমিত আসনে ভর্তি চলছে</p>

          <motion.a
            href="#"
            whileHover={{ scale: 1.05 }}
            className="inline-block px-16 py-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-2xl font-semibold rounded-3xl shadow-2xl hover:shadow-emerald-500/50 transition-all"
          >
            এখনই আবেদন করুন
          </motion.a>
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16">আমাদের ক্যাম্পাস</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="aspect-video bg-slate-200 rounded-3xl overflow-hidden shadow-xl"
              >
                <div className="h-full w-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-6xl text-white/60">
                  🏫
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-16">অভিভাবকদের মতামত</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "রহিমা খাতুন", role: "অভিভাবক", text: "আমার ছেলে এখানে পড়ার পর অনেক পরিবর্তন হয়েছে। শিক্ষকরা অসাধারণ।" },
              { name: "করিম উদ্দিন", role: "অভিভাবক", text: "নিরাপদ পরিবেশ এবং আধুনিক শিক্ষা পদ্ধতির জন্য মাদার কেয়ারকে ধন্যবাদ।" },
            ].map((t, i) => (
              <div key={i} className="bg-white p-10 rounded-3xl shadow-xl">
                <p className="italic text-lg mb-8">“{t.text}”</p>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-slate-500">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-24 bg-white border-t">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-5xl font-bold mb-8">যোগাযোগ করুন</h2>
            <div className="space-y-6 text-lg">
              <div className="flex gap-4">
                <MapPin className="h-7 w-7 text-blue-600 mt-1" />
                <div>১৩ মাইল বাজার, কাহারোল থানা, দিনাজপুর জেলা</div>
              </div>
              <div className="flex gap-4">
                <Phone className="h-7 w-7 text-blue-600 mt-1" />
                <div>+880 1XXX-XXXXXX</div>
              </div>
              <div className="flex gap-4">
                <Mail className="h-7 w-7 text-blue-600 mt-1" />
                <div>info@mothercareschool.edu.bd</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 rounded-3xl p-10">
            {/* Contact Form Placeholder */}
            <form className="space-y-6">
              <input type="text" placeholder="আপনার নাম" className="w-full p-4 rounded-2xl border focus:outline-none focus:border-blue-600" />
              <input type="email" placeholder="ইমেইল" className="w-full p-4 rounded-2xl border focus:outline-none focus:border-blue-600" />
              <textarea placeholder="আপনার বার্তা" rows={5} className="w-full p-4 rounded-2xl border focus:outline-none focus:border-blue-600"></textarea>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors">
                বার্তা পাঠান
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}