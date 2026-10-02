"use client";
import React from 'react'

const CVUploadform = () => {
  return (
    <div
    className="flex items-center p-28 justify-center min-h-screen bg-cover "
    
  >
    <div className="bg-white shadow-darkBlue p-7 rounded-lg shadow-md w-full max-w-md">
      <form action="/submit" method="post" encType="multipart/form-data" className="space-y-1">
        <h2 className="text-2xl font-bold text-center mb-6 text-Red">CV Upload Form</h2>
        <div className="form-group">
          <label htmlFor="firstName" className="block font-semibold mb-1 text-Blue">
            First Name:
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-Blue"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName" className="block font-semibold mb-1 text-Blue">
            Last Name:
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-Blue"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email" className="block font-semibold mb-1 text-Blue">
            Email Address:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-Blue"
          />
        </div>
        <div className="form-group">
          <label htmlFor="jobDetails" className="block font-semibold mb-1 text-Blue">
            Job Details: (describe your output requirements)
          </label>
          <textarea
            id="jobDetails"
            name="jobDetails"
            className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-Blue"
          ></textarea>
        </div>
        <div className="form-group text-Blue">
          <label htmlFor="fileUpload" className="block font-semibold mb-1 text-Blue">
            Click to upload Files:
          </label>
          <input
            type="file"
            id="fileUpload"
            name="fileUpload"
            required
            className="w-full "
            
          />
        </div>
        <button
          type="submit"
          className="w-full bg-Blue text-white py-2 rounded-md hover:bg-Red transition-colors cursor-pointer"
        >
          Submit File
        </button>
        <div className="flex gap-4 justify-center mt-6">
    <i className="fab fa-google text-3xl text-Blue hover:text-Red transition-colors cursor-pointer"></i>
    <i className="fab fa-facebook text-3xl text-Blue hover:text-Blue transition-colors cursor-pointer"></i>
  </div>
      </form>
     
    </div>
  </div>

  )
}

export default CVUploadform