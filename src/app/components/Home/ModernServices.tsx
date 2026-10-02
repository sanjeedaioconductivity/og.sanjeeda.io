"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  A11y,
  Autoplay,
  Keyboard,
  Navigation,
  Pagination,
} from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const services = [
  {
    number: "01",
    name: "Personality Assessment",
    eyebrow: "Discover yourself",
    description: "A guided assessment that shows where you naturally thrive.",
    image: "/services/assessment-full.jpg",
  },
  {
    number: "02",
    name: "3D CVs",
    eyebrow: "Tell your full story",
    description: "An AI-assisted profile that stands out beyond a resume.",
    image: "/services/cv-full.jpg",
  },
  {
    number: "03",
    name: "Offer Calculator",
    eyebrow: "Compare with confidence",
    description: "See the real value of every offer before you say yes.",
    image: "/services/offer-full.jpg",
  },
  {
    number: "04",
    name: "Mentoring Programs",
    eyebrow: "Learn from experience",
    description: "Direction and accountability from mentors who've been there.",
    image: "/services/mentoring-full.jpg",
  },
  {
    number: "05",
    name: "Career Counseling",
    eyebrow: "Find your direction",
    description: "Personalized guidance that turns confusion into a clear plan.",
    image: "/services/counseling-full.png",
  },
];

export default function ModernServices() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative overflow-hidden bg-brand-sky
      playful:bg-brand-paper
      playful-dark:bg-gradient-to-r from-[#9a97a9] via-[#b36e87] to-[#aa9aaa]
      dark:bg-[#0f73bfdd] // set this in modern-theme (dark mode)
      py-20 text-white  playful:text-brand-ink playful-dark:bg-slate-200 playful-dark:text-brand-ink sm:py-24 lg:py-16"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 playful:opacity-40">
        {/* <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-brand-accent blur-5xl" /> */}
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-[#ff0228] playful:bg-[#ff0077d2] blur-5xl" />
        <div className="absolute -right-44 bottom-6 h-80 w-80 rounded-full bg-[#ffffff] blur-5xl playful:bg-brand-ink" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="mb-10 flex flex-col gap-7 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.24em] text-[#ffffff] playful:text-brand-accent sm:text-sm">
              <span className="h-px w-8 bg-[#fbfafa] playful:bg-brand-accent" />
              Explore our services
            </p>
            <h2
              id="services-heading"
              className="text-lg font-black tracking-[-0.04em] text-white playful:text-pinkShades-600 sm:text-5xl lg:text-4xl"
            >
              Support for every turn in your career.
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous service"
              className="service-prev grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/5 transition hover:border-white/50 hover:bg-white hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-white/70 playful:border-brand-ink/15 playful:bg-white playful:hover:border-brand-accent/40 playful:hover:bg-brand-accent-soft playful:focus:ring-brand-accent/40"
            >
              <ChevronLeft size={21} />
            </button>
            <button
              type="button"
              aria-label="Next service"
              className="service-next grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/5 transition hover:border-white/50 hover:bg-white hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-white/70 playful:border-brand-ink/15 playful:bg-white playful:hover:border-brand-accent/40 playful:hover:bg-brand-accent-soft playful:focus:ring-brand-accent/40"
            >
              <ChevronRight size={21} />
            </button>
          </div>
        </div>

        <Swiper
          modules={[Navigation, Pagination, Autoplay, Keyboard, A11y]}
          navigation={{ prevEl: ".service-prev", nextEl: ".service-next" }}
          pagination={{ clickable: true }}
          keyboard={{ enabled: true }}
          autoplay={{ delay: 1600, disableOnInteraction: false, pauseOnMouseEnter: true }}
          loop
          speed={1000}
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 18 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
          }}
          className="services-swiper !overflow-hidden !pb-14 lg:!overflow-visible"
        >
          {services.map((service) => (
            <SwiperSlide key={service.name} className="!h-auto">
              <article className="mx-auto flex w-full max-w-[320px] flex-col">
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-white/5">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px"
                    className="object-cover"
                  />
                  <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-brand-ink text-xs font-bold text-white">
                    {service.number}
                  </span>
                </div>

                <div className="pt-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-ink playful:text-brand-accent">
                    {service.eyebrow}
                  </p>
                  <h3 className="mb-1 text-base font-black tracking-[-0.02em] text-white playful:text-pink">
                    {service.name}
                  </h3>
                 </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
