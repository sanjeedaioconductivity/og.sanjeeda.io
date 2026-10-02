// File: src/app/api/ping/route.js
export async function GET() {
  return new Response("✅ Backend is alive", {
    status: 200,
  });
}

// 'use client';
// import React, { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Image from 'next/image';
// // import { Main } from 'next/document'; import QuestionBlock from '../PP/QuestionBlock'; import ResultsPage from '../PP/ResultsPage'; import SpiderChart from '../PP/SpiderChart';

// const EnterNamePage: React.FC = () => {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const router = useRouter();

//   const handleStart = () => {
//     if (name.trim() !== '') {
//       localStorage.setItem('userName', name);
//       router.push('/Main');
//     }
//   };

//   return (
//   <section className="relative w-full h-screen overflow-hidden bg-whitesmoke">
 
//   {/* 📦 Form Container */}
// <div className="flex items-center justify-center h-full px-2 relative -translate-y-60 sm:-translate-y-10">
//   <div className="bg-white backdrop-blur-md shadow-xl rounded-xl p-4 sm:p-6 md:p-10 w-full max-w-xs sm:max-w-sm md:max-w-md">

//     {/* 🖼 Logo + Heading */}
//     <div className="flex flex-col sm:flex-row items-center sm:items-start sm:gap-4 gap-2 mb-6 text-center sm:text-left">
//     <Image src="/courses/cc1.png" alt="Logo" width={60} height={30} className="h-10 w-auto object-contain"/>
//     <h1 className="font-sans serif font-semibold text-Blue text-4xl">| Lets Start</h1>
//     </div>
    
//     <div className="relative w-full">
//     <input type="text" className="mb-4 peer w-[370px] border-2 border-customBlue rounded px-3 pt-5 pb-1 text-xs font-bold placeholder-transparent focus:outline-none focus:ring-customBlue" 
//      required value={name} onChange={(e) => setName(e.target.value)}/>
//     <label htmlFor="name" className="absolute left-3 top-1 text-sm text-customBlue font-bold transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">Name</label>
//     </div>
   
//     <div className="relative w-full">
//     <input type="text" className="mb-4 peer w-[370px] border-2 border-customBlue rounded px-3 pt-5 pb-1 text-xs font-bold placeholder-transparent focus:outline-none focus:ring-customBlue" 
//      required value={email} onChange={(e) => setEmail(e.target.value)}/>
//     <label htmlFor="email" className="absolute left-3 top-1 text-sm text-customBlue font-bold transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">Email</label>
//     </div>

//     <button className="w-full bg-Blue hover:bg-Blue text-white font-semibold py-2 px-4 rounded-lg transition duration-200" 
//           onClick={handleStart}>
//             Start Questions
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default EnterNamePage;


// I have a folder project
// my-project\src
// my-project\src\app
  
//   my-project\src\app\api
//     my-project\src\app\api\add-questions
//     my-project\src\app\api\candidates
//     my-project\src\app\api\get-responses
//     my-project\src\app\api\ping
//     my-project\src\app\api\questions
//     my-project\src\app\api\saveResponses

//   my-project\src\app\components
//     my-project\src\app\components\Home
//       my-project\src\app\components\Home\Habout.tsx
//       my-project\src\app\components\Home\Hero.tsx
//       my-project\src\app\components\Home\Home.tsx
//       my-project\src\app\components\Home\ServiceList.tsx
  
//     my-project\src\app\components\nav
//       my-project\src\app\components\nav\Header.tsx
//       my-project\src\app\components\nav\ResponsiveNav.tsx
  
//   my-project\src\app\EnterNamePage
//     my-project\src\app\EnterNamePage\page.tsx 

//   my-project\src\app\footer
//     my-project\src\app\footer\page.tsx  

//   my-project\src\app\Main
//     my-project\src\app\Main\page.tsx
    
//   my-project\src\app\PP 
//   my-project\src\app\PP\QuestionBlock.tsx
//   my-project\src\app\ResultsPage.tsx
//   my-project\src\app\SpiderChart.tsx 
     
// my-project\src\utils
//   my-project\src\utils\dbConnect.js
// my-project\src\App.css
// my-project\.env.local
// my-project\.gitignore
// my-project\.hintrc
// my-project\config.js
// my-project\eslint.config.mjs
// my-project\next-env.d.ts
// my-project\next.config.ts
// my-project\package-lock.json
// my-project\package.json
// my-project\postcss.config.mjs
// my-project\README.md
// my-project\tailwind.config.ts
// my-project\tsconfig.json