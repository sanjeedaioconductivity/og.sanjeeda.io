"use client";
import React, { useState } from "react";
import Link from "next/link";
import ServicesList from "./ServicesList";

const Home = () => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <div>
      <ServicesList />

      <section className="bg-white dark:bg-darkBlue py-10 sm:py-20 lg:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold tracking-tight text-Blue dark:text-sky-300 sm:text-4xl lg:text-5xl">
              Sanjeed<span className="text-rose-600 dark:text-rose-400">a!</span> stands for:
            </h1>

            <p className="mt-3 text-lg font-semibold text-rose-600 sm:text-xl lg:text-2xl">
              Career Development for People Serious About
            </p>

            <div className="mt-8 w-full max-w-4xl">
              <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {/* Readiness Dropdown */}
                <li className="relative">
                  <button
                    onClick={() => toggleDropdown("readiness")}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-100 shadow-sm transition hover:bg-slate-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20 sm:text-base"
                  >
                    <i className="fa fa-angle-down" aria-hidden="true"></i>
                    <span>Readiness</span>
                  </button>

                  {openDropdown === "readiness" && (
                    <ul className="absolute left-1/2 z-20 mt-3 w-52 -translate-x-1/2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1533] p-2 shadow-lg">
                      <li>
                        <Link
                          href="Registration#Registration"
                          className="block rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        >
                          Student
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="Registration#Registration"
                          className="block rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        >
                          Job Seeker
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="Registration#Registration"
                          className="block rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        >
                          Professional
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="Registration#Registration"
                          className="block rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        >
                          Mentor
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="Registration#Registration"
                          className="block rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        >
                          Employer
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* Opportunities Dropdown */}
                <li className="relative">
                  <button
                    onClick={() => toggleDropdown("opportunities")}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-100 shadow-sm transition hover:bg-slate-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20 sm:text-base"
                  >
                    <span>Opportunities</span>
                  </button>

                  {openDropdown === "opportunities" && (
                    <ul className="absolute left-1/2 z-20 mt-3 w-56 -translate-x-1/2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1533] p-2 shadow-lg">
                      <li>
                        <Link
                          href="/#self-discovery"
                          className="block rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        >
                          Training & development
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/#cv-profile"
                          className="block rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        >
                          Counseling
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* Success Dropdown */}
                <li className="relative">
                  <button
                    onClick={() => toggleDropdown("success")}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-100 shadow-sm transition hover:bg-slate-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20 sm:text-base"
                  >
                    <span>Success</span>
                  </button>

                  {openDropdown === "success" && (
                    <ul className="absolute left-1/2 z-20 mt-3 w-52 -translate-x-1/2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1533] p-2 shadow-lg">
                      <li>
                        <Link
                          href="/#self-discovery"
                          className="block rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        >
                          Success Stories
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;