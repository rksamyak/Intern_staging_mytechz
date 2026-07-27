"use client";

const proficiencyOptions = [
  "Native",
  "Fluent",
  "Professional",
  "Intermediate",
  "Basic",
];

export default function LanguageSection({
  languages,
  setLanguages,
}) {
  const addLanguage = () => {
    setLanguages([
      ...languages,
      {
        language: "",
        proficiency: "Basic",
      },
    ]);
  };

  const updateLanguage = (index, field, value) => {
    const updated = [...languages];
    updated[index][field] = value;
    setLanguages(updated);
  };

  const removeLanguage = (index) => {
    const updated = languages.filter((_, i) => i !== index);
    setLanguages(updated);
  };

  return (
    <div>
      <h2>Languages</h2>

      {languages.map((item, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "8px",
          }}
        >
          <label>Language</label>

          <input
            type="text"
            placeholder="English"
            value={item.language}
            onChange={(e) =>
              updateLanguage(index, "language", e.target.value)
            }
          />

          <br />
          <br />

          <label>Proficiency</label>

          <select
            value={item.proficiency}
            onChange={(e) =>
              updateLanguage(index, "proficiency", e.target.value)
            }
          >
            {proficiencyOptions.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>

          <br />
          <br />

          <button onClick={() => removeLanguage(index)}>
            Remove
          </button>
        </div>
      ))}

      <button onClick={addLanguage}>
        + Add Language
      </button>
    </div>
  );
}