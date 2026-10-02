'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import Image from 'next/image';

const cards = [
  {
    id: 1, cover: "/courses/cc1.png", ServicesName:"Personality Assessment ",
     desc: "For enhanced data efficiency for recruiters and employers.",
   },
   {
     id: 2, cover: "/courses/c1.png", ServicesName: "3D CVs (AI Based-for Different JDs)",
     desc: "Easily create a standout CV tailored to your unique skills and experiences.",
   },
   {
     id: 3, cover: "/courses/c4.png", ServicesName: "Resume Services",
     desc: "Variety of desirable job openings, making it easy to apply and find opportunities that fit your skills.",
   },
   {
     id: 6, cover: "/courses/cc3.png", ServicesName: "Consultancy & Advisory Services",
     desc: "Personalized mock interview services to boost your interview success.",
   },
   {
     id: 5, cover: "/courses/c6.png", ServicesName: "Memberships",
     desc: "Designed for job seekers to improve and polish your skills to elevate your career.",
   },
   {
     id: 4, cover: "/courses/c5.png", ServicesName: "Offer Calculator",
     desc: "Evaluate and compare multiple job offers based on key factors like salary, benefits, and growth opportunities.",
   },
   {
     id: 7, cover: "/courses/cc9.png", ServicesName: "Mentoring Programs",
     desc: "Training and mentorship to help individuals gain the skills and confidence needed.",
   },
   {
     id: 8, cover: "/courses/cc8.png", ServicesName: "Career Placement Services",
     desc: "Tools to evaluate your skills and personality to identify suitable career paths.",
   },
   {
     id: 9, cover: "/courses/c2.png", ServicesName: "Counselling Services",
     desc: "Personalized strategies and insights to help you navigate challenges, enhance performance, and achieve your goals.",
   },
];

export default function Carousel() {
  return (
    // <div className="w-full px-10 py-10  h-screen mt-14"> <h2 className="text-3xl font-bold text-center text-Red mb-8">Explore Our Services</h2>
//   <section className="services-section  relative overflow-hidden pt-[43%]">
//     {/* <video src="/ES.mp4" className="absolute top-px left-0 w-auto h-max object-cover z-0" autoPlay muted loop playsInline/> */}
//     <video src="/explore services.mp4" className="absolute top-px left-0 w-auto h-max object-cover z-0" 
//     autoPlay muted loop playsInline/>
    
//     <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center z-10 px-4">
   
//     {/* Heading */}
//     <h2 className="text-3xl py-4 font-bold text-[#AD0217] mt-5 
//     md:text-sm lg:text-4xl xl:text-4xl sm:text-xs">Explore Our Services</h2>
    
//     <Swiper effect="coverflow" grabCursor={true} centeredSlides={true} slidesPerView="auto" 
//     loop={true} autoplay={{ delay: 3000, disableOnInteraction: false,}} 
//     coverflowEffect={{ rotate: 0, stretch: 0, depth: 100, modifier: 2.5,}} 
//     pagination={{ clickable: true }} modules={[EffectCoverflow, Pagination, Autoplay]} 
//     className="w-full max-w-6xl mx-auto">
      
//       {cards.map((card, index) => (
        
//         <SwiperSlide key={index} className="bg-white rounded-xl overflow-hidden shadow-lg max-w-xs">
          
//           <Image className="w-12 h-12 sm:w-4 sm:h-4 md:w-48 md:h-48 lg:w-52 lg:h-52 mx-auto mt-10"
//           src={card.cover} width={100} height={100} alt={card.ServicesName} />
          
//           <div className="p-4 text-center ">
//             {/* Optionally display the description or ServicesName */}
//             <h2 className="mt-2 text-lg font-semibold text-Red">{card.ServicesName}</h2>
//             <p className="text-sm text-darkBlue">{card.desc}</p>
//           </div>
          
//         </SwiperSlide>
//         ))}

//   </Swiper>
// </div>
// </section>

<section className="relative overflow-hidden bg-blue-950 dark:bg-darkBlue">
  {/* <video src="/explore services.mp4" className="absolute h-full md:h-auto left-0 w-full  object-cover z-0"
    autoPlay muted loop playsInline
  /> */}

  <div className="relative z-10 sm:mt-20 -mt-2 flex flex-col items-center justify-center px-4 py-16">
    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-5 text-center">
      Explore Our Services
    </h2>

    {/* Swiper */}
    <Swiper
      effect="coverflow"
      grabCursor={true}
      centeredSlides={true}
      slidesPerView="auto"
      loop={true}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      coverflowEffect={{ rotate: 0, stretch: 0, depth: 100, modifier: 2.5 }}
      pagination={{ clickable: true }}
      modules={[EffectCoverflow, Pagination, Autoplay]}
      className="w-full max-w-6xl"
    >
      {cards.map((card, index) => (
        <SwiperSlide
          key={index}
          className="bg-white rounded-xl overflow-hidden shadow-lg max-w-xs sm:max-w-sm p-4"
        >
          {/* Image */}
          <Image
            className="w-full h-40 sm:h-48 md:h-52 lg:h-56 object-contain mx-auto"
            src={card.cover}
            width={300}
            height={300}
            alt={card.ServicesName}
          />

          {/* Text */}
          <div className="mt-4 text-center">
            <h3 className="text-base sm:text-lg font-semibold text-[#AD0217]">
              {card.ServicesName}
            </h3>
            <p className="text-sm sm:text-base text-[#081b9c] mt-1">
              {card.desc}
            </p>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
</section>

);}