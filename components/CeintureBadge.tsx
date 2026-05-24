const CEINTURE_CONFIG: Record<string, { label: string; bg: string; text: string; border?: string }> = {
  BLANCHE: { label: "Blanche", bg: "#ffffff", text: "#1a1a1a", border: "#e5e5e5" },
  BLEUE: { label: "Bleue", bg: "#1d4ed8", text: "#ffffff" },
  VIOLETTE: { label: "Violette", bg: "#7c3aed", text: "#ffffff" },
  MARRON: { label: "Marron", bg: "#92400e", text: "#ffffff" },
  NOIRE: { label: "Noire", bg: "#111111", text: "#ffffff" },
};

interface CeintureBadgeProps {
  ceinture: string;
  size?: "sm" | "md";
}

export default function CeintureBadge({ ceinture, size = "md" }: CeintureBadgeProps) {
  const config = CEINTURE_CONFIG[ceinture] || CEINTURE_CONFIG.BLANCHE;
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-block rounded-full font-medium ${padding}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: config.border ? `1px solid ${config.border}` : undefined,
      }}
    >
      {config.label}
    </span>
  );
}
