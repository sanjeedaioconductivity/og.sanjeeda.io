import React from "react";
// import Awrapper from "./Awrapper";

const AboutCard = () => {
  return (
    <div className="relative  overflow-hidden">
      {/* Background Video */}
      {/* <video src="/t2.mp4" autoPlay muted loop playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      /> */}

      {/* Foreground Content */}
      <div className="relative z-10 py-14 bg-blue-950 dark:bg-darkBlue">
        <section>
          
          {/* Video Section */}
          <div className="container mx-auto flex flex-col md:flex-row px-4 sm:px-6">
            <div className="video-container w-full md:w-1/2 mt-2 md:mt-0 md:pl-1 lg:w-4/5 lg:m-auto py-5">
              <video
                src="/Video1.mp4"
                controls
                autoPlay
                loop
                muted
                className="w-full h-auto rounded-lg shadow-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutCard;
