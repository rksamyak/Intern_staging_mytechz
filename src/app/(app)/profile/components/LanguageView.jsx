export default function LanguageView({ languages }) {
  return (
    <div>
      <h2>Languages</h2>

      {languages.length === 0 ? (
        <p>No languages added.</p>
      ) : (
        languages.map((item, index) => (
          <div key={index}>
            <strong>{item.language}</strong>

            <p>{item.proficiency}</p>

            <hr />
          </div>
        ))
      )}
    </div>
  );
}