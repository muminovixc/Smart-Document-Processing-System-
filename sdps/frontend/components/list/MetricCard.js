export default function MetricCard({ label, value, sub, valueColor }) {
  return (
    <div
      style={{
        background: "#F8F7F4",
        borderRadius: 10,
        padding: "14px 18px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#888",
          fontWeight: 500,
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: valueColor || "#1a1a1a",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}
