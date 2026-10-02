"use client";

import Link from "next/link";
import Image from "next/image";
import { VscSend } from "react-icons/vsc";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaPaperPlane,
} from "react-icons/fa";

const Footer = () => {
  const socialLinks = [
    { href: "https://www.facebook.com", icon: <FaFacebookF />, label: "Facebook" },
    { href: "https://www.instagram.com", icon: <FaInstagram />, label: "Instagram" },
    { href: "https://www.youtube.com", icon: <FaYoutube />, label: "YouTube" },
    { href: "https://twitter.com", icon: <FaTwitter />, label: "Twitter" },
    { href: "https://www.linkedin.com", icon: <FaLinkedinIn />, label: "LinkedIn" },
  ];

  const quickLinks = [
    { name: "About Us", path: "/aboutus" },
    { name: "Services", path: "/allServices" },
    { name: "Privacy", path: "/privacy" },
    { name: "Blog", path: "/Blogs/" },
    { name: "Terms & Conditions", path: "/terms" },
    { name: "Feedback", path: "/feedback" },
    { name: "Have a Question?", path: "/contact" },
  ];

  return (
    <footer className="bg-blue-950 dark:bg-darkBlue text-white">
      {/* Newsletter Section */}
      <section className="border-b border-white/10 bg-gradient-to-r from-Red via-rose-500 to-Blue">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl text-center lg:text-left">
              <p className="text-sm uppercase tracking-[0.2em] text-white/80 mb-2">
                Newsletter
              </p>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-snug">
                Stay tuned and get the latest updates
              </h2>
            </div>

            <form className="w-full max-w-xl">
              <div className="flex flex-col sm:flex-row items-stretch rounded-2xl overflow-hidden bg-white shadow-lg">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  className="w-full px-4 py-4 text-black outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="inline-flex items-center justify-center gap-2 bg-slate-950 px-6 py-4 font-medium text-white transition hover:bg-slate-800"
                >
                  Subscribe
                  <VscSend className="text-lg" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/sanjeeda logo2.png"
                alt="Sanjeeda logo"
                width={200}
                height={150}
                className="-mt-16  -mb-24"
                priority
              />
            </Link>

            <p className="mt-4 text-sm leading-7 text-white/70 max-w-sm">
              Helping learners and families stay connected with quality support,
              guidance, and accessible educational services.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-Red hover:text-white"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          {/* <div>
            <h3 className="text-lg font-semibold mb-5">Quick Links</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-white/75">
              {quickLinks.map((item, i) => (
                <li key={i}>
                  <Link href={item.path} className="transition hover:text-Red">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}

          {/* Contact Info */}
          <div className="xl:col-span-2">
            <h3 className="text-lg font-semibold mb-5">Contact Info</h3>
            <ul className="space-y-4 text-sm text-white/75">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-Red">
                  <FaMapMarkerAlt />
                </span>
                <span>B-65, Block 2, Gulshan-e-Iqbal, Karachi, Pakistan</span>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-1 text-Red">
                  <FaPhoneAlt />
                </span>
                <span>+92-21-34832777, 03132193503</span>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-1 text-Red">
                  <FaPaperPlane />
                </span>
                <span>info@conductivity.com.pk</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Bottom Bar */}
      <section className="border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex 
          flex-col xs:flex-row items-center justify-between
           text-white/60">
            <span>© {new Date().getFullYear()} Sanjeeda.io All rights reserved.</span>
          </div>
        </div>
      </section>
    </footer>
  );
};

export default Footer;