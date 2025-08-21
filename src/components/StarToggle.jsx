// src/components/StarToggle.jsx
export default function StarToggle({ checked, onChange, label, imgOn, imgOff }) {
  const base = import.meta.env.BASE_URL;

  // fallback: mantiene el comportamiento actual con las estrellas
  const defaultOn  = `${base}assets/star-on.png`;
  const defaultOff = `${base}assets/star-off.png`;

  const src = checked
    ? (imgOn  ?? defaultOn)
    : (imgOff ?? defaultOff);

  const handleKey = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange?.(!checked);
    }
  };

  return (
    <button
      type="button"
      className={`star-btn ${checked ? "is-on" : "is-off"}`}
      aria-pressed={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      onKeyDown={handleKey}
      style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
    >
      <img
        src={src}
        alt={checked ? "Completed" : "Not completed"}
        draggable="false"
        style={{ width: 44, height: 44, objectFit: "contain" }}
      />
    </button>
  );
}
