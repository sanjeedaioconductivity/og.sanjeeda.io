// import Awrapper from "./Awrapper";
const AboutCard = () => {
  return (
    <div className="bg-blue-950 dark:bg-darkBlue w-full pt-[16vh] md:pt-12 h-screen">
      <section className="py-20 lg:top-12 w-full ">

        {/* Video Section */}
        <div className="container mx-auto flex flex-col md:flex-row px-4 sm:px-6">
          <div className="video-container w-full md:w-1/2 mt-2 md:mt-0 md:pl-1 lg:w-4/5 lg:m-auto py-5 ">
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
      {/* <Awrapper/> */}
      <div className="margin mt-32"></div>
     
    </div>
  );
};

export default AboutCard;
