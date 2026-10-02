"use client";
import React from "react";
import { useParams } from "next/navigation";

const BlogPage = () => {
  const params = useParams();
  const id = params?.id as string | undefined; // Ensures correct type handling

  const blogData = {
    "1": { title: "Interview Struggles" },
    "2": { title: "Workplace Culture" },
    "3": { title: "Staying in Pakistan or Working Abroad" },
  };

  const blog = id && blogData[id as keyof typeof blogData] ? blogData[id as keyof typeof blogData] : null;

  return (
    <div className="blog-page px-4 py-6 bg-white">
      {blog ? (
        <div className="bg-Black shadow-lg rounded-lg p-6 md:p-20">
          <h1 className="text-2xl font-bold text-Red text-center mb-6 ">{blog.title}</h1>

          {id === "1" && (
            <section>
              <blockquote className="text-black space-y-4">
                <p className="text-lg pl-4">
                  Why do so many candidates struggle with Job Interviews? And what steps should be taken to improve the job interview process.
                </p>
                <p className="text-base pl-6">
                  Job interviews are an important step in getting a job as they give employers a chance to see if the candidate is suitable for the position and if their interests align with the company. They also help the candidate understand the work environment and what to expect as a potential employee.
                </p>
                <p className='text-base pl-6'>
                However, just the thought of giving an interview can be extremely daunting and stressful for many. In today&apos;s competitive job market, 
                being well-prepared and confident is very important. This article explores some key points to help you prepare for a job interview, 
                common challenges you might face or mistakes you might make and how to handle those situations with confidence.
                </p>

                <h2 className="text-xl font-semibold mt-6">Common Mistakes and Challenges during a Job Interview</h2>
                <ul className="list-disc list-inside space-y-4 mt-4">
                  <li>
                    <strong>Lack of Preparation and Research:</strong>  Before you go in for an interview, it is vital that you research the company, its culture, values, and any information about the 
      position you’ve applied for. Candidates should know the company’s recent developments, which helps demonstrate genuine interest and 
      alignment with the organization.
                  </li>
                  <li>
                    <strong>Poor Communication Skills:</strong> This does not only mean verbal communication but also your body language, gestures, eye contact etc. Answers that are short, 
                    irrelevant or incoherent can confuse the interviewer, leave a poor impression and might lead to lack of understanding.
                  </li>
                  <li>
                    <strong>Negative Attitude:</strong>  Speaking poorly of your past coworkers or company is never encouraged. No matter how you were treated in your past experience, 
                    ill speaking shows unprofessionalism and will make the interviewer think of you unfavorably.
                  </li>
                  <li>
                    <strong>Improper Dressing:</strong> You must dress properly with a professional look. Dressing casually might give an impression that you are not taking 
                    the job/interview seriously. 
                  </li>
                  <li>
                    <strong>Focusing Too Much on Salary:</strong>  It completely makes sense for a person to be looking for a good pay for their work, however, focusing too much on 
                    compensation might suggest that you’re more interested in money than the actual job. 
                  </li>
                </ul>

                <h2 className="text-xl font-semibold mt-6">How to Improve Your Interview Performance</h2>
                <ul className="list-disc list-inside space-y-4">
                  <li>
                    <strong>Know Your Strengths:</strong> You must show off your skills and knowledge to let them know your strengths, what you are capable of and 
                    what you can bring to the company.Highlight any relevant accomplishments that you believe could be useful for the job.
                  </li>
                  <li>
                    <strong>Be Authentic:</strong>  Be honest about your personality and skills. Many interviewers can sense when a person isn’t being honest and 
                    it leaves a bad impression so show your true self and accentuate the skills that you actually possess. 
                  </li>
                  <li>
                    <strong>Stay Calm and Confident:</strong> Before you go on for an interview, always prepare yourself beforehand. Rehearse ways to control your nerves and 
      do practice interviews with yourself or with the help of someone. You have to exude confidence to leave a positive impression and 
      effectively communicate your potential during the interview
                  </li>
                  <li>
                    <strong>Listen Attentively and be curious:</strong> Listen carefully to the interviewer’s questions and any comments/feedback and ask relevant questions to show that you’ve 
                    been attentive. Do not interrupt the interviewer and maintain eye contact.
                  </li>
                  <li>
                    <strong>Follow-Up:</strong> Following up after an interview is crucial for reinforcing your interest. Within 24 hours, send a thank-you email 
      expressing gratitude and highlighting specific points from your conversation. Reiterate your enthusiasm for the role and 
      include any important details you missed during the interview. Keep the tone professional and consider asking about the 
      timeline for the hiring decision. A thoughtful follow-up can strengthen your candidacy and showcase your professionalism!
                  </li>
                </ul>
              </blockquote>
              <p className="text-Blue font-bold mt-6 text-center">- Wafa Fazal Ahmed</p>
            </section>
          )}

          {id === "2" && (
            <section>
              <blockquote className="text-black space-y-4">
                <p className="text-lg pl-4">
                Should we stress upon the importance of Workplace Culture and promote ways to improve it?<br />
                </p>
                <p className="text-base pl-6">
                Workplace culture plays a crucial role in shaping employee behaviour, satisfaction, engagement, and overall organizational success. 
 So should we emphasize the importance of workplace culture? Absolutely. By promoting a positive culture, organizations can create an 
 environment where employees thrive, teamwork and positivity flourishes, and innovation is encouraged. This article explores 
 the significance of workplace culture and ways to improve it.
                </p>

                <h2 className="text-xl font-semibold mt-6">But what exactly does workplace culture mean?</h2>
                <p className="text-base pl-6">
                Simply put, it means the values, beliefs, behaviors, and 
                practices that the employees and members of an organization share and how those values shape up the environment and the dynamics within. It includes aspects like company mission, vision, the way people communicate, relationship between employees, and work practices. A strong workplace culture influences how employees interact and behave, how decisions are made, and overall job satisfaction. It plays a crucial role in employee engagement, retention, and organizational performance, as it reflects the organization&apos;s identity and can significantly impact its success.
                </p>
                <p className='text-base pl-6'>Some of the key components that make up the workplace culture and ways to improve them:</p>
                <ul className="list-disc list-inside space-y-4">
                  <li>
                    <strong>Values & Beliefs:</strong> These principles are the fundamental factors that build up an organization’s identity. They define what the organization stands for and how they influence the decision making, employee behavior, and interactions between them. These principles also include teamwork, 
                    innovation, respect and responsibilities.      
                  </li>
                  <li>
                    <strong>Ways to improve?</strong> Develop and promote a culture of feedback where employees can share their experiences and suggest changes. Regularly reviewing and updating norms and practices can be healthy and beneficial for both the 
                    organizational goals and employees.
                  </li>
                  <li>
                    <strong>Communication Style:</strong> How we talk, speak, interact verbally and physically in the workplace, the way we share information among other employees and what kind of language, tone, levels of formality we use in emails, meetings, messages and every interactions, it all falls under our workplace communication. The various 
                    communication styles reflect an organization’s culture and values. 
                  </li>
                  <li>
                    <strong>Ways to improve?</strong> A proper and open communication channel should be encouraged with regular check-ins, meetings, and feedbacks. The managers and leaders especially should be the effective role models to promote the desired communication style.  
                  </li>
                  <li>
                    <strong>Leadership Style:</strong> Leaders are essentially the ones managing teams and influencing the workplace atmosphere. This includes behaviors, attitudes, and strategies. Leadership style determines decisions, goals, and team interactions, significantly 
                    impacting the organization&apos;s culture and affecting productivity.
                  </li>
                  <li>
                    <strong>Ways to improve?</strong> There should be training programs for leaders focused on emotional intelligence, behaviour and adaptability encouraging them to seek feedback and input from their
                    teams and engage in supportive mentoring.
                  </li>
                  <li>
                    <strong>Work Environment:</strong> The physical and emotional atmosphere of the workplace is extremely important because it is not only crucial for the employee performance and their well being but is also an essential factor to retain them. This mostly includes a variety of elements like the office space, design, equipment, accessibilities, designated rooms for different activities, the arrangement of furniture, and of course the emotional aspects like how the employees interact with and treat each other. All of these together create an environment 
                    that can significantly influence productivity and job satisfaction.
                  </li>
                  <li>
                    <strong>Ways to improve?</strong> Furniture and workspaces that don’t create any discomfort for the employees should be focused on while also keeping in mind the air quality and proper lighting. Hygiene is very essential so break rooms or washrooms should be properly set up to avoid any employee inconvenience. 
                    On the emotional side, creating a healthy and friendly work environment with open communication and transparency that encourages employees to share their ideas and feedback without fear is the main aspect to be focused on which leads to building trust.  
                  </li>
                  <li>
                    <strong>Recognition and Rewards:</strong> Refers to the practice of recognizing good performance and granting rewards within an organization to acknowledge and celebrate employee achievements, contributions, and milestones This aspect of workplace is essential for boosting morale, fostering engagement, and encouraging a positive work environment. When employees feel valued for their efforts, 
                    it enhances their motivation, loyalty, and overall job satisfaction.
                  </li>
                  <li>
                    <strong>Ways to improve?</strong>  Implement a recognition program that highlights both individual and team achievements and performance. Take into
                    account what kind of recognition the employees value and seek the most.
                  </li>
                  <li>
                  By focusing on these components and actively seeking to improve them, organizations can cultivate a positive workplace culture that enhances employee engagement, satisfaction, and overall performance.
                  </li>
                </ul>
              </blockquote>
              <p className="text-Blue font-bold mt-6 text-center">- Wafa Fazal Ahmed</p>
            </section>
          )}

          {id === "3" && (
           <section>
           <blockquote className="text-black space-y-4">
             <p className="text-lg pl-4">
             Is staying in Pakistan for work worth it? Would you get a better life and job opportunities abroad?<br />
             </p>
             <p className="text-base pl-6">
             These are the questions that plague the mind of many Pakistanis especially the current mixture of Gen Z and millennials. Deciding between the two is not an easy task. While staying home can offer comfortability, familiarity, cultural belonging, close bonds of family and friends, exploring career growth and job opportunities in other countries can open doors to new experiences, skills, and potentially higher salaries. Each option has its pros and cons, and what’s best often depends on personal goals, industry demands, and 
 the overall economic scene. Let’s discuss the factors to consider when faced with these choices.
             </p>

             <h2 className="text-xl font-semibold mt-6">Embracing Life in Pakistan: Finding Your Place in the Heart of Home</h2>
             <li><h4 className="font-bold mt-2">Affordability and Savings Potential:</h4></li>
             <p className="text-base pl-6">
             Many cities in Pakistan offer a cost of living that is generally cheaper than in many countries in other 
 continents. Necessities like housing, food, and transportation are typically more affordable, making it 
 easier to maintain a comfortable lifestyle. These lower expenses not only allow people to enjoy daily life without constantly worrying about their finances but also create opportunities for saving money. People in Pakistan can take advantage of that fact by doing investments and saving their incomes. This leads to financial security and gives 
 the person the ability to invest in future goals, like travel, education, buying a house or a car.  
             </p>
             <li><h4 className="font-bold mt-2">Cultural Familiarity:</h4></li>
 <p className="text-base pl-6">
 It is not surprising that many people choose to stay in their home country due to the strong familial bonds and friendships which provide them with the essential emotional support and connections that might require and crave abroad. Also working in a familiar place with similar cultural ties allows for a better understanding of local norms and practices, languages, traditions and lifestyle, making communication smoother and work relationships easier.
 This cultural comfort and familiarity creates a sense of belonging and community.
 </p>
 <li><h4 className="font-bold mt-2">Growing Economy:</h4></li>
 <p className="text-base pl-6">
 Pakistan’s economy is on the rise, creating tons of new job prospects, especially in fields like IT, finance, education and healthcare. Plus, there’s also a lot of potential in the startup scene especially in cities like Karachi, Lahore, Islamabad, Peshawar. This economic growth encourages entrepreneurship and innovation. As a result, individuals interested in launching their own businesses can find a supportive environment that supports their ideas and ambitions, 
 making it an exciting time to chase their career dreams and turn their ideas into reality. 
 </p>
 <h2 className="text-xl font-semibold mt-6">The Adventure of Working Abroad:</h2>


             <ul className="list-disc list-inside space-y-4">
               <li>
                 <strong>Higher Salaries and Career Growth:</strong> If you&apos;re thinking about working abroad, you would definitely find yourself earning way more than you would in Pakistan. Many countries offer not just higher salaries but also attractive benefits, which can really improve your quality of life. Plus, you’ll have access to reputable and effective training and professional development programs that can help you pick up new skills and advance your career faster.      
               </li>
               <li>
                 <strong>Multicultural experience:</strong> Living and working in another country opens your eyes to new cultures, ideas, and work environments, giving you a fresh perspective on life and work. You also get to experience the way people interact with one another and might help you to pick up a language or two on the way. It can also help you to build a professional network that is global and it can bring about more future opportunities and collaborations. 
               </li>
               <li>
                 <strong>Quality Education and Skill Development:</strong> Studying abroad gives you access to top international universities / institutions that provide high-quality education and training, boosting your qualifications and skills. Plus, you get to expand your experience with different working methodologies and technologies, which can really enhance your skill set. 
               </li>
               <li>
                 <strong>Increased Quality of Life:</strong> One of the biggest advantages of living in a well-developed country is the quality of life, which far exceeds that of Pakistan. 
 Many countries abroad focus on work-life balance, providing flexible work arrangements and benefits that enhance your overall quality of life. 
 Other than that, there is also access to improved social services like healthcare, education, and tons of sightseeing destinations 
 that can really boost your well-being and provide leisure. 
               </li>
             </ul>
           </blockquote>
           <p className="text-Blue font-bold mt-6 text-center">- Wafa Fazal Ahmed</p>
         </section>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-600">Blog post not found.</p>
      )}
    </div>
  );
};

export default BlogPage;
