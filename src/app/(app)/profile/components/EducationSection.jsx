'use client';

import { useState } from 'react';

const emptyEducation = {
  degree: "",
  institution: "",
  field_of_study: "",
  start_month: "",
  start_year: "",
  end_month: "",
  end_year: "",
  currently_studying: false,
  cgpa: "",
  description: ""
};

export default function EducationSection() {
  const [educations, setEducations] = useState([{ ...emptyEducation }]);
  const [isEditing, setIsEditing] = useState(true);

  const addEducation = () => {
    setEducations([...educations, { ...emptyEducation }]);
  };

  const removeEducation = (index) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  return (
    
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">

      {/* Heading */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
          Education
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Add your educational qualifications.
        </p>
      </div>
      
      {/* Education Cards */}
      {educations.map((education, index) => (
        <div
          key={index}
          className="mt-6 rounded-lg border border-gray-200 p-5"
        >

          {/* Degree */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">
              Degree <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              placeholder="Bachelor of Engineering"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
            />
          </div>

          {/* Institution */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">
              Institution <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              placeholder="XYZ College"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
            />
          </div>

          {/* Field of Study */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">
              Field of Study <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              placeholder="Computer Science"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
            />
          </div>

          {/* Start & End Date */}
          <div className="grid grid-cols-2 gap-4">

            {/* Start Date */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Start Date
              </label>

              <div className="grid grid-cols-2 gap-2">
                <select className="rounded-xl border border-gray-300 px-4 py-2.5">
                  <option>Month</option>
                  {/* Paste your month options here */}
                </select>

                <select className="rounded-xl border border-gray-300 px-4 py-2.5">
                  <option>Year</option>
                  {Array.from({ length: 50 }, (_, i) => {
                    const year = new Date().getFullYear() + 5 - i;
                    return (
                      <option key={year}>{year}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                End Date
              </label>

              <div className="grid grid-cols-2 gap-2">
                <select className="rounded-xl border border-gray-300 px-4 py-2.5">
                  <option>Month</option>
                  {/* Paste your month options here */}
                </select>

                <select className="rounded-xl border border-gray-300 px-4 py-2.5">
                  <option>Year</option>
                  {Array.from({ length: 50 }, (_, i) => {
                    const year = new Date().getFullYear() + 5 - i;
                    return (
                      <option key={year}>{year}</option>
                    );
                  })}
                </select>
              </div>
            </div>

          </div>

          {/* Checkbox */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <input
                id={`currently_studying_${index}`}
                type="checkbox"
              />

              <label htmlFor={`currently_studying_${index}`}>
                I am currently studying here
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-5 flex items-center justify-between">

            <button
              type="button"
              onClick={addEducation}
              className="rounded-lg border border-blue-600 px-4 py-2 text-blue-600"
            >
              + Add Education
            </button>

            {educations.length > 1 && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="rounded-lg border border-red-500 px-4 py-2 text-red-600"
              >
                Remove Education
              </button>
            )}

          </div>

        </div>
      ))}

    </div>
  );
}