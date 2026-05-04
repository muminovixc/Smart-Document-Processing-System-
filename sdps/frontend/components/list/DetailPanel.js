import { AlertTriangle, MoreHorizontal } from "lucide-react";
import FileIcon from "@/components/list/FileIcon";
import StatusBadge from "@/components/list/StatusBadge";

export default function DetailPanel({ doc, onClose }) {
  if (!doc) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 420,
          height: "100%",
          background: "#fff",
          padding: "28px 28px",
          overflowY: "auto",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.08)",
          animation: "slideIn 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <FileIcon ext={doc.ext} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.name}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>
                {doc.docNumber}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#aaa",
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        <StatusBadge status={doc.status} />

        <div
          style={{
            marginTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {[
            ["Type", doc.type],
            ["Supplier", doc.supplier || "—"],
            ["Doc number", doc.docNumber],
            ["Issue date", doc.issueDate || "—"],
            ["Due date", doc.dueDate || "—"],
            ["Currency", doc.currency],
            [
              "Tax amount",
              doc.tax_amount != null || doc.tax != null
                ? `${doc.currency === "EUR" ? "€" : doc.currency === "USD" ? "$" : "KM"} ${((doc.tax_amount ?? doc.tax) || 0).toLocaleString("en", { minimumFractionDigits: 2 })}`
                : "—",
            ],
            [
              "Total amount",
              doc.amount != null
                ? `${doc.currency === "EUR" ? "€" : doc.currency === "USD" ? "$" : "KM"} ${doc.amount.toLocaleString("en", { minimumFractionDigits: 2 })}`
                : "—",
            ],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                borderBottom: "0.5px solid #f0f0f0",
                paddingBottom: 10,
              }}
            >
              <span style={{ color: "#888" }}>{k}</span>
              <span style={{ fontWeight: 500, color: "#1a1a1a" }}>{v}</span>
            </div>
          ))}
        </div>

        {doc.issues.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#A32D2D",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Validation issues
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {doc.issues.map((issue, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    background: "#FCEBEB",
                    borderRadius: 8,
                    padding: "8px 12px",
                  }}
                >
                  <AlertTriangle
                    size={13}
                    color="#E24B4A"
                    style={{ marginTop: 1, flexShrink: 0 }}
                  />
                  <span
                    style={{ fontSize: 12, color: "#A32D2D", lineHeight: 1.5 }}
                  >
                    {issue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
