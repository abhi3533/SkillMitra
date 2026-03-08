import { Link } from "react-router-dom";

interface SkillMitraLogoProps {
  darkText?: boolean;
  height?: number;
  linkTo?: string;
  className?: string;
  showTagline?: boolean;
}

const SkillMitraLogo = ({
  darkText = true,
  height = 36,
  linkTo = "/",
  className = "",
  showTagline = false,
}: SkillMitraLogoProps) => {
  const capColor = darkText ? "#1A56DB" : "#FFFFFF";
  const skillColor = darkText ? "#0F172A" : "#FFFFFF";
  const mitraColor = darkText ? "#1A56DB" : "#BFDBFE";
  const taglineColor = darkText ? "#64748B" : "rgba(255,255,255,0.5)";

  const fontSize = height * 0.55;
  const capSize = height * 0.65;
  const taglineSize = height * 0.22;

  const logo = (
    <span className={`inline-flex items-center gap-1.5 ${className}`} style={{ height }}>
      {/* Graduation Cap SVG */}
      <svg
        width={capSize}
        height={capSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"
          fill={capColor}
        />
      </svg>
      {/* Text */}
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontSize,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <span style={{ color: skillColor }}>Skill</span>
          <span style={{ color: mitraColor }}>Mitra</span>
        </span>
        {showTagline && (
          <span
            style={{
              fontSize: taglineSize,
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: taglineColor,
              marginTop: 2,
            }}
          >
            LEARN. GROW. SUCCEED.
          </span>
        )}
      </span>
    </span>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center">
        {logo}
      </Link>
    );
  }

  return logo;
};

export default SkillMitraLogo;
