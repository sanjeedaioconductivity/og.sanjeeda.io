// import React from 'react'

// export const page = () => {
//   return (
//     <div>page</div>
//   )
// }
"use client";
import React, { useState } from "react";

const Header1 = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
    return (
        <div className=" min-h-screen py-10">
          <div className="max-w-4xl mx-auto bg-white shadow-md rounded-md p-8 mt-16">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-black">Saad Ahsan (PMP)</h1>
              <p className="text-black">
                <strong>Phone:</strong> +92332-368-2212
              </p>
              <p className="text-Blue">
                <strong className="text-black">Email:</strong> xaadahsan1@gmail.com
              </p>
              <p className="text-black">
                <strong>Address:</strong> Flat # D9/6 Afnan Duplex Houses Gulistan-e-Johar
              </p>
           
              <p className="text-black">PMP Certified | Experienced Professional - E-commerce platforms | Startups | X-foodpanda | SalesForce Digital marketing | Web analytics tools | SQL | Jira | Trello | Asana | UI/UX design | Wireframing | SEO toolsAction oriented | Dynamic | Team Player | Master’s in Project Management | Service Design Expertise</p>
            </div>
    
            {/* Profile Section */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-Blue border-b pb-2 mb-4 text-center">Profile</h2>
              <p className="text-black">
              Expert at enhancing search and findability, optimizing delivery fees, and automating tasks,
              <br/>Qualified Project Management Professional: PMP from PMI and Master’s in Project Management,
              <br/>Proven track record in Project Management, data analysis, E-commerce & salesforce management
              </p>
            </section>
    
            {/* Experience Section */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-Blue border-b pb-2 mb-2 text-center ">Career Summary</h2>
              
     
      <table className="w-full border-collapse border border-black">
        <thead>
          <tr className="bg-Blue">
            <th className="border border-black px-4 py-2 text-white text-left">Organization</th>
            <th className="border border-black px-4 py-2 text-white text-left">Position</th>
            <th className="border border-black px-4 py-2 text-white text-left">From</th>
            <th className="border border-black px-4 py-2 text-white  text-left">To</th>
          </tr>
        </thead> 
        <thead>
          <tr className="bg-white">
            <th className="border border-black px-4 py-2 text-left">FoodPanda</th>
            <th className="border border-black px-4 py-2 text-left">Content Associate</th>
            <th className="border border-black px-4 py-2 text-left">April 2019</th>
            <th className="border border-black px-4 py-2 text-left">June 2023</th>
          </tr>
        </thead> 
        <thead>
          <tr className="bg-white">
            <th className="border border-black px-4 py-2 text-left">Apexchat (Now Breakthru)</th>
            <th className="border border-black px-4 py-2 text-left">Territory Manager</th>
            <th className="border border-black px-4 py-2 text-left">March 2017</th>
            <th className="border border-black px-4 py-2 text-left">April 2019</th>
          </tr>
        </thead> 
        <thead>
          <tr className="bg-white">
            <th className="border border-black px-4 py-2 text-left">Pinnacle Enterprises</th>
            <th className="border border-black px-4 py-2 text-left">Customer Service Representative</th>
            <th className="border border-black px-4 py-2 text-left">Dec 2015</th>
            <th className="border border-black px-4 py-2 text-left">Feb 2017</th>
          </tr>
        </thead> 
      </table>
   
            </section>
            <section className="mb-8">
          <div className="flex justify-between items-center">
           
            <button
              onClick={toggleDropdown}
              className="bg-white text-Blue font-bold text-xl text-center px-8 py-2 rounded-md shadow-md hover:bg-Red w-full hover:text-white"
            >
             
              {isDropdownOpen ? "Hide Details" : "Professional & Academic Qualification"}
              
            </button>
            
          </div>

          {isDropdownOpen && (
            <table className="w-full border-collapse border border-black mt-4">
              <thead>
                <tr className="bg-Blue">
                  <th className="border border-black px-4 py-2 text-left text-white">Qualification</th>
                  <th className="border border-black px-4 py-2 text-left text-white">Institution</th>
                  <th className="border border-black px-4 py-2 text-left text-white">GPA</th>
                  <th className="border border-black px-4 py-2 text-left text-white">YearOfCompletion</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-white">
                  <td className="border border-black px-4 py-2">MS Project Management</td>
                  <td className="border border-black px-4 py-2">Bahria University</td>
                  <td className="border border-black px-4 py-2">2.94</td>
                  <td className="border border-black px-4 py-2">2024</td>
                </tr>
                <tr className="hover:bg-white ">
                  <td className="border border-black px-4 py-2">BS Geo-physics</td>
                  <td className="border border-black px-4 py-2">Bahria University, Karachi</td>
                  <td className="border border-black px-4 py-2">2.88</td>
                  <td className="border border-black px-4 py-2">2019</td>
                </tr>
               
              </tbody>
            </table>
          )}
        </section>
        <section className="mb-8">
          <div className="flex justify-between items-center">
            <button
              onClick={toggleDropdown}
              className="bg-white font-bold text-xl text-Blue px-4 py-2 rounded-md shadow-md hover:bg-Red hover:text-white w-full"
            >
              {isDropdownOpen ? "Hide Details" : "Projects"}
            </button>
          </div>

          {isDropdownOpen && (
            <table className="w-full border-collapse border border-black mt-4">
              <thead>
                <tr className="bg-Blue">
                  <th className="border border-black px-4 py-2 text-left text-white"> project</th>
                  <th className="border border-black px-4 py-2 text-left text-white">details</th>
                  <th className="border border-black px-4 py-2 text-left text-white">sponsor</th>
                  
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-4 py-2">Image Pakistan | Alupak | Zainab Chottani | Tahra | Salitex | Dreams | Ngents | Chyll | Noorma Kamal | Wardha Saleem | ZC International | Little Pineapple | Lamour | TMI | Sumaira Khanani | Online Bazaa | Umsha | Amna Arshad | Neeks Closet | Top Stone | Sunday Linen Usha | Zuri by Zainab | Asra Jofa | Nainpreet | Nomi Ansari</td>
                  <td className="border border-black px-4 py-2">Strategic Project Planning and Execution,Payment Methods and Legal Compliance ERP System Implementation,CRM Integration for Customer Support,Enhanced Brand Identity and Customer Experience,Advanced Digital Marketing Integration,Technical Proficiency and Domain Management,Streamlined Data Migration and Quality Assurance,Cross-functional Collaboration</td>
                  <td className="border border-black px-4 py-2">Siar Digital</td>
                  
                </tr>
                <tr>
                  <td className="border border-black px-4 py-2">Lal’ Delivery App | Asim Jofa Mobile App | Search and Findability Enhancement | Optimization of Delivery Fee and Time-based Pricing | Automation and Task Reduction | Menu Updates and Creation using foodpanda Backend Portal</td>
                  <td className="border border-black px-4 py-2">Enhanced search functionality and algorithms,
                 Aligned customer demands with services,Improved search and findability features,Optimized delivery fee and time-based pricing,
                 Automated manual tasks and processes,   Enhanced UI/UX for better customer experience,
                 Updated and created menus in the foodpanda portal,
                 Managed deals and promotions in the backend portal,
                 Conducted menu audits for accuracy and consistency,
                 Collaborated with vendors for menu updates</td>
                  <td className="border border-black px-4 py-2">foodpanda</td>
                 
                </tr>
                <tr className="hover:bg-white">
                  <td className="border border-black px-4 py-2">Mississauga Dolphins social media campaign</td>
                  <td className="border border-black px-4 py-2"></td>
                  <td className="border border-black px-4 py-2">Personal Projects</td>
                 
                </tr>
               
              </tbody>
            </table>
          )}
        </section>
        <section className="mb-8">
          <div className="flex justify-between items-center">
            {/* <h2 className="text-xl font-bold text-border-black border-b pb-2">Competence</h2> */}
            <button
              onClick={toggleDropdown}
              className="bg-white font-bold text-xl text-Blue px-4 py-2 rounded-md shadow-md hover:bg-Red hover:text-white w-full"
            >
              {isDropdownOpen ? "Hide Details" : "Competence"}
            </button>
          </div>

          {isDropdownOpen && (
            <table className="w-full border-collapse border border-black mt-4">
              <thead>
                <tr className="bg-Blue">
                  <th className="border border-black px-4 py-2 text-left text-white">Skills</th>
                  <th className="border border-black px-4 py-2 text-left text-white">Abilities</th>
                  <th className="border border-black px-4 py-2 text-left text-white">Knowledge</th>
                 
                </tr>
              </thead>
              <tbody>
                <tr >
                  <td className="border border-black px-4 py-2">Data Analysis</td>
                  <td className="border border-black px-4 py-2">Diversity management</td>
                  <td className="border border-black px-4 py-2">Project Management</td>
                  
                </tr>
                <tr className="hover:bg-white">
                  <td className="border border-black px-4 py-2">Salesforce</td>
                  <td className="border border-black px-4 py-2">Conflict management</td>
                  <td className="border border-black px-4 py-2">E-commerce Platforms</td>
                 
                </tr>
                <tr className="hover:bg-white">
                  <td className="border border-black px-4 py-2">Creative Designing</td>
                  <td className="border border-black px-4 py-2">Simplifying complexities</td>
                  <td className="border border-black px-4 py-2">Digital Marketing</td>
                 
                </tr>
                <tr className="hover:bg-white">
                  <td className="border border-black px-4 py-2">WordPress websites</td>
                  <td className="border border-black px-4 py-2">Strategic thinking</td>
                  <td className="border border-black px-4 py-2">Salesforce Management</td>
                 
                </tr>
                <tr className="hover:bg-white">
                  <td className="border border-black px-4 py-2">Critical thinking</td>
                  <td className="border border-black px-4 py-2">Logical & empirical</td>
                  <td className="border border-black px-4 py-2">Data Analysis</td>
                 
                </tr>
                <tr className="hover:bg-white">
                  <td className="border border-black px-4 py-2">Project Management</td>
                  <td className="border border-black px-4 py-2">Stakeholder management</td>
                  <td className="border border-black px-4 py-2">UI/UX Design</td>
                 
                </tr>
                <tr className="hover:bg-white">
                  <td className="border border-black px-4 py-2">Team management</td>
                  <td className="border border-black px-4 py-2">Self-driven</td>
                  <td className="border border-black px-4 py-2">Agile Tools (Jira, Asana, Trello)</td>
                 
                </tr>
               
               
              </tbody>
            </table>
          )}
        </section>
        <section className="mb-8">
          <div className="flex justify-between items-center">
            {/* <h2 className="text-xl font-bold text-border-black border-b pb-2">awardsAchievements</h2> */}
            <button
              onClick={toggleDropdown}
              className="bg-white font-bold text-xl text-Blue px-4 py-2 rounded-md shadow-md hover:bg-Red hover:text-white w-full"
            >
              {isDropdownOpen ? "Hide Details" : "AwardsAchievements"}
            </button>
          </div>

          {isDropdownOpen && (
            <table className="w-full border-collapse border border-black mt-4">
              <thead>
                <tr className="bg-Blue">
                  <th className="border border-black px-4 py-2 text-left text-white">Qualification</th>
                  <th className="border border-black px-4 py-2 text-left text-white">Institution</th>
                  <th className="border border-black px-4 py-2 text-left text-white">GPA</th>
                  <th className="border border-black px-4 py-2 text-left text-white">YearOfCompletion</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-white">
                  <td className="border border-black
                  px-4 py-2">MS Project Management</td>
                  <td className="border border-black px-4 py-2">Bahria University</td>
                  <td className="border  border-black px-4 py-2">2.94</td>
                  <td className="border border-black px-4 py-2">2024</td>
                </tr>
                <tr className="hover:bg-white">
                  <td className="border border-black px-4 py-2">BS Geo-physics</td>
                  <td className="border border-black px-4 py-2">Bahria University, Karachi</td>
                  <td className="border border-black px-4 py-2">2.88</td>
                  <td className="border border-black px-4 py-2">2019</td>
                </tr>
               
              </tbody>
            </table>
          )}
        </section>
        </div>
        </div>
      );
}

export default Header1