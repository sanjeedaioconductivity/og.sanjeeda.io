"use client";
import Image from "next/image";
import Link from "next/link";

const blogs = [
  {
    id: 1,
    title: "Interview Struggles",
    image: "/interview.jpeg",
    description:
      "Why do so many candidates struggle with job interviews, and what steps can improve the interview process for both employers and applicants?",
  },
  {
    id: 2,
    title: "Workplace Culture",
    image: "/culture.jpeg",
    description:
      "Workplace culture shapes employee behavior, satisfaction, and engagement. Learn why it matters and how to improve it.",
  },
  {
    id: 3,
    title: "Staying in Pakistan or Working Abroad",
    image: "/abroad.jpeg",
    description:
      "Is staying in Pakistan for work worth it, or are better opportunities available abroad? A question many young professionals ask.",
  },
];

const BlogCard = () => {
  return (
    <section className="relative overflow-hidden py-14 sm:py-16 md:py-24">
      {/* Background video */}
      {/* <video
        src="/explore services.mp4"
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      /> */}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-blue-950 dark:bg-darkBlue" />

      {/* Soft gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10 md:mb-5">
          <p className="mb-2 mt-10 text-sm font-medium uppercase tracking-[0.25em] text-white/80">
            Insights & Articles
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Blogs
          </h2>
          <div className="mx-auto mt-3 h-1 w-32 rounded-full bg-gradient-to-r from-red-500 to-blue-600" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <article
              key={blog.id}
              className="group mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-1xl border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-2 hover:bg-white/15"
            >
              {/* Image */}
              <div className="relative  m-3 overflow-hidden rounded-1xl">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  width={600}
                  height={380}
                  className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              {/* Text */}
              <div className="flex flex-1 flex-col px-5 pb-5 pt-1 sm:px-6">
                <h3 className="mb-3 text-center text-xl font-bold font-sans text-white">
                  {blog.title}
                </h3>

                <p className="mb-5 line-clamp-4 text-sm font-sans leading-6 text-white/85 xs:text-[15px]">
                  {blog.description}
                </p>

                <div className="-mt-2">
                  <Link
                    href={`/Blogpage/${blog.id}`}
                    className="inline-flex items-center rounded-full font-sans bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:scale-105 hover:bg-red-500 hover:text-white"
                  >
                    Read More
                    <span className="ml-2">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogCard;