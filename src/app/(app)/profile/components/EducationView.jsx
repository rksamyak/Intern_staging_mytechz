
export default function EducationView({ educations }) {
  return (
    <div>
      <h2>Education</h2>

      {educations.map((edu, index) => (
        <div key={index}>
          <h3>{edu.degree}</h3>

          <p>{edu.institution}</p>

          <p>{edu.field_of_study}</p>

          <p>
            {edu.start_month} {edu.start_year} -
            {edu.currently_studying
              ? " Present"
              : ` ${edu.end_month} ${edu.end_year}`}
          </p>

          <p>CGPA: {edu.cgpa}</p>

          <p>{edu.description}</p>
        </div>
      ))}
    </div>
  );
}