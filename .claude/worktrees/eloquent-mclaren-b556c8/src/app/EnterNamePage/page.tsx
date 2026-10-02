"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const EnterNamePageInner: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldEmail, setOldEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  useEffect(() => {
    if (isEditMode) {
      const stored = localStorage.getItem("candidate");
      if (stored) {
        const { name, email } = JSON.parse(stored);
        setName(name);
        setEmail(email);
        setOldEmail(email);
      }
    }
  }, [isEditMode]);

  const handleStart = async () => {
    if (!name.trim() || !email.trim()) return;

    try {
      if (oldEmail) {
        const res = await fetch("/api/candidates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldEmail, name, email }),
        });
        const data = await res.json();
        if (data.success) {
          router.push("/Main");
          return;
        }
      }

      const res = await fetch(
        `/api/candidates?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (data.exists) {
        setName(data.candidate.name);
        setEmail(data.candidate.email);
        setOldEmail(data.candidate.email);
        setSubmitted(true);
        localStorage.setItem("candidate", JSON.stringify(data.candidate));
      } else {
        await fetch("/api/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
        router.push("/Main");
      }
    } catch (err) {
      console.error("Error submitting candidate:", err);
    }
  };

  const handleUseSameDetails = () => {
    router.push("/Main");
  };

  const handleEdit = () => {
    router.push("/EnterNamePage?mode=edit");
  };

  return (
    <section className="relative w-full h-screen overflow-hidden bg-whitesmoke">
      
      <div className="flex items-center justify-center h-full px-2 relative -translate-y-60 sm:-translate-y-10">
        
        <div className="bg-white backdrop-blur-md shadow-xl rounded-xl p-4 sm:p-6 md:p-10 w-full max-w-xs sm:max-w-sm md:max-w-md">
          {!submitted || isEditMode ? (
          <>
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:gap-4 gap-2 mb-6 text-center sm:text-left">
              <Image src="/courses/cc1.png" alt="Logo" width={60} height={30} className="h-10 w-auto object-contain"/>
              <h1 className="font-sans serif font-semibold text-Blue text-4xl">| Lets Start</h1>
            </div>

            <div className="relative w-full">
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="mb-4 peer w-[370px] border-2 px-3 pt-5 pb-1 text-xs font-sans serif" 
              />
              <label className="absolute left-3 top-1 text-sm text-customBlue font-bold"> Name</label>
            </div>

              <div className="relative w-full">
                <input type="email" className="mb-4 peer w-[370px] border-2 px-3 pt-5 pb-1 text-xs font-sans serif"
                  required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <label className="absolute left-3 top-1 text-sm text-customBlue font-bold"> Email</label>
              </div>

              <button className="w-auto px-10 items-center bg-whitesmoke border-2 text-black text-xs font-semibold py-2"
                onClick={handleStart}>Submit</button>
          </>
          ) : (
          <>
            <p className="text-center font-semibold text-black mb-4">Use Same Details or Edit</p>
              <p className="mb-16 text-sm font-sans serif">
                Wanna continue with previous name, email or edit!
              </p>

            <div className="flex gap-20">
              
              <button className="flex-1 bg-whitesmoke border-2 text-black text-xs font-semibold py-2"
                onClick={handleUseSameDetails}>Use Previous Details</button>

                <button className="flex-1 bg-whitesmoke border-2 text-black text-xs font-semibold py-2"
                  onClick={handleEdit}>Edit & Continue</button>

            </div>

          </>
          )}
        </div>
      </div>
    </section>
  );
};

const EnterNamePage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnterNamePageInner />
    </Suspense>
  );
};

export default EnterNamePage;