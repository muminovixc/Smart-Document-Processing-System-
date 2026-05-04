export default function DocumentCard({ doc, onView }) {
  return (
    <div className={`doc-card ${doc.status}`}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {doc.original_filename}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            ID: {doc.id} • {new Date(doc.created_at).toLocaleDateString()}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          <span className={`status-tag status-${doc.status}`}>
            {doc.status.replace("_", " ")}
          </span>
          <button
            className="view-btn"
            onClick={() => onView(doc)}
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              cursor: "pointer",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            View Document
          </button>
        </div>
      </div>

      {doc.status !== "uploaded" && (
        <div
          style={{
            marginTop: 15,
            paddingTop: 15,
            borderTop: "1px solid #eee",
          }}
        >
          <div className="data-row">
            <span>
              Supplier: <strong>{doc.supplier_name || "N/A"}</strong>
            </span>
            <span>
              Tax:{" "}
              <strong>
                {doc.tax_amount ?? doc.tax ?? "—"} {doc.currency || ""}
              </strong>
            </span>
          </div>
          <div className="data-row" style={{ marginTop: 8 }}>
            <span />
            <span>
              Total:{" "}
              <strong>
                {doc.total_amount} {doc.currency}
              </strong>
            </span>
          </div>

          {doc.validation_errors && (
            <div className="error-list">
              {JSON.parse(doc.validation_errors).map((err, i) => (
                <div key={i} className="error-item">
                  Warning: {err}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
