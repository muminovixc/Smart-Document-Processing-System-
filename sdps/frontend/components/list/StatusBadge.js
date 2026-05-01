const STATUS_CONFIG = {
  uploaded: {
    label: "Uploaded",
    color: "#185FA5",
    bg: "#E6F1FB",
    dot: "#378ADD",
  },
  needs_review: {
    label: "Needs Review",
    color: "#854F0B",
    bg: "#FAEEDA",
    dot: "#EF9F27",
  },
  validated: {
    label: "Validated",
    color: "#3B6D11",
    bg: "#EAF3DE",
    dot: "#639922",
  },
  rejected: {
    label: "Rejected",
    color: "#A32D2D",
    bg: "#FCEBEB",
    dot: "#E24B4A",
  },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.uploaded;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}
