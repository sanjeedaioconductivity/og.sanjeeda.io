 "use client";
import React from "react";
import { team } from "../../../data/data";
import Image from "next/image";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";

type TeamMember = {
  cover: string;
  name: string;
  work: string;
};

const TeamCard = () => {
  return (
  
      <section className="relative py-24 overflow-hidden">
        {/* 🔹 Background Video */}
        <video
          src="/explore services.mp4"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
        />

 {/* Overlay for readability */}
      <div className="absolute inset-0 bg-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50" />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10 md:mb-14">
          <p className="mb-2 mt-10 text-sm font-medium uppercase tracking-[0.25em] text-white/80">
            Our Leadership
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Management
          </h2>
          <div className="mx-auto mt-3 h-1 w-72 rounded-full bg-gradient-to-r from-red-500 to-blue-600" />
        </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {team.map((member: TeamMember, index: number) => (
              <div
                key={index}
              className="group mx-auto w-full max-w-sm overflow-hidden rounded-1xl border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-2 hover:bg-white/15"
              >
              <div className="relative m-3 overflow-hidden rounded-1xl">
                  <Image
                    src={member.cover}
                    alt={member.name}
                    width={400}
                    height={400}
                  className="h-72 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-80"
                  />
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/55 opacity-0 transition duration-300 group-hover:opacity-100">
                  <SocialIcon href="https://facebook.com" title="Facebook" color="#1877F2">
                    <FaFacebookF />
                  </SocialIcon>
                  <SocialIcon href="https://twitter.com" title="Twitter" color="#1DA1F2">
                    <FaTwitter />
                  </SocialIcon>
                  <SocialIcon href="https://linkedin.com" title="LinkedIn" color="#0077B5">
                    <FaLinkedinIn />
                  </SocialIcon>
                  <SocialIcon href="https://instagram.com" title="Instagram" color="#E4405F">
                    <FaInstagram />
                  </SocialIcon>
                  </div>
                </div>

              <div className="px-5 pb-6 pt-2 text-center sm:px-6">
                <h3 className="mb-1 text-xl font-bold text-white font-sans">{member.name}</h3>
                <p className="text-sm leading-6 text-white/80 font-sans">{member.work}</p>
              </div>
              </div>
            ))}
          </div>
        </div>
      </section>

  );
};

export default TeamCard;

// 🔧 Social Icon Component
const SocialIcon = ({
  href,
  title,
  color,
  children,
}: {
  href: string;
  title: string;
  color: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title={title}
    className="text-white hover:text-white hover:scale-110 transition-all duration-300 text-xl p-2 rounded-full"
    style={{ backgroundColor: color }}
  >
    {children}
  </a>
);
