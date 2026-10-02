import {
  Check,
  Compass,
  Layers3,
  TrendingUp,
} from "lucide-react";
import ModernServices from "./ModernServices";

const journey = [
  {
    number: "01",
    title: "Understand yourself",
    description:
      "Start with your personality, strengths and readiness—not a generic list of careers.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Build your advantage",
    description:
      "Shape a stronger profile through practical tools, mentoring and professional development.",
    icon: Layers3,
  },
  {
    number: "03",
    title: "Choose with confidence",
    description:
      "Compare opportunities clearly and make the next move with evidence, not guesswork.",
    icon: TrendingUp,
  },
];

export default function ModernHomepage() {
  return (
    <main className="overflow-hidden text-brand-ink dark:text-white">
   
      <ModernServices/>

      <section
        id="career-pathway"
        className="relative 
        dark:bg-[#ffffffdd] 
        playful:bg-brand-paper  
      playful-dark:bg-gradient-to-r from-[#9a97a9] via-[#b36e87] to-[#aa9aaa]
        sm:py-24 py-3"
      >
        <div className="mx-auto max-w-[1200px] px-5 lg:py-4 ">
 

          <div className="mt-3 -mb-6 overflow-hidden rounded-[24px] bg-brand-accent  p-6
          text-white shadow-[0_25px_70px_rgba(232,52,68,0.22)] 
          sm:-mt-16 sm:rounded-[34px] sm:p-10 lg:flex lg:items-center lg:justify-between lg:px-12">
            <div className="max-w-2xl ">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white ">
                One connected journey
              </p>
              <h3 className="mt-3 text-xl font-black tracking-[-0.03em] sm:text-2xl lg:text-3xl">
                From uncertainty to your next move.
              </h3>
            </div>

          </div>

          <div className="relative mt-14 grid gap-5 md:grid-cols-3 lg:mt-18 ">
            <div className="absolute  left-[16%] right-[16%] top-10 hidden border-t border-dashed border-brand-blue/25 md:block" />
            {journey.map(({ number, title, description, icon: Icon }) => (
              <article
                key={number}
                className="relative overflow-hidden rounded-[20px]
                 dark:bg-[#0f73bfdd] 
                 playful-dark:bg-brand-accent
                bg-brand-sky playful:bg-pinkShades-600 p-6 shadow-[0_18px_55px_rgba(11,22,63,0.07)] dark:border-white/10 sm:p-8"
              >
                <div className="pointer-events-none absolute inset-0 opacity-100">
                  <div className="absolute -right-5 -bottom-5 h-16 w-16 rounded-full bg-brand-paper" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-sm font-black tracking-[0.16em] text-white">
                    {number}
                  </span>
                </div>

                <h3 className="relative z-10 mt-5 text-xl font-black text-[#e1edef] tracking-[-0.025em] sm:text-2xl">
                  {title}
                </h3>
                <p className="relative z-10 mt-2 text-sm text-[#e1edef] dark:text-white/60">
                  {description}
                </p>
              </article>
            ))}
          </div>


        </div>
      </section>

      <section className="relative 
      playful-dark:bg-brand-ink 
      playful:bg-muted-foreground
      overflow-hidden bg-brand-sky py-20 text-white transition-colors sm:py-24 lg:py-14 
      dark:bg-[#1c87b5] dark:text-white">
        {/* Red + white blurred circle decorations */}
        
      <div className="pointer-events-none absolute inset-0 opacity-70 ">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-[#ff0228] playful:bg-[#e7d0d4] blur-5xl" />
        <div className="absolute -right-44 bottom-5 h-80 w-80 rounded-full bg-[#ffffff] blur-5xl" />
      </div>

        <div className="relative mx-auto grid max-w-[1500px] items-center gap-10 px-10 sm:px-5 lg:grid-cols-[3fr_5fr] lg:gap-10 lg:px-8">
          
          <div>
            <h2 className="-mt-10 
            playful:text-4xl font-black tracking-[-0.04em] sm:text-5xl
             playful:text-white">
              Offer Guide
            </h2>
        

            <ul className="mt-7 space-y-2 font-bold">
              {[
                "Tell us about your career stage",
                "what you do now ?", 
                "what you're looking for ?",
                "Add the offer details",
                "Set your priorities what matters most to you",
                "Your priorities change how the offer is scored",
                "Get decision guidance A fit score across seven categories",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm font-sans
                  text-white playful:text-white sm:text-lg dark:text-white/85">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-accent">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
           
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-brand-blue/50 to-brand-accent/35 blur-2xl" />
            <div className="relative overflow-hidden rounded-[30px]  p-2 shadow-2xl dark:border-white/15 dark:bg-black/20">
              <video
                src="/offerguide-explainer.mp4"
                poster="/offerguide-explainer-poster.jpg"
                controls
                preload="metadata"
                playsInline
                className="aspect-video w-full rounded-[23px] bg-white"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>
      
    </main>
  );
}
