// Initials on a colour picked from the name, so each person keeps the same colour.
const COLORS = ["#0D8ABC", "#7C3AED", "#DB2777", "#EA580C", "#16A34A", "#0891B2", "#CA8A04", "#DC2626", "#4F46E5", "#059669"];

export default function Avatar({ name, className = "w-6 h-6 text-[10px]" }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span
      title={name}
      style={{ background: COLORS[Math.abs(h) % COLORS.length] }}
      className={`${className} shrink-0 inline-flex items-center justify-center rounded-full font-bold text-white`}
    >
      {initials}
    </span>
  );
}
