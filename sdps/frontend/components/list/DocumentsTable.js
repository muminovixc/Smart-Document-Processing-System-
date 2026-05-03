import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import FileIcon from "@/components/list/FileIcon";
import StatusBadge from "@/components/list/StatusBadge";

export default function DocumentsTable({
  docs,
  filtered,
  loading,
  setSelectedDoc,
  counts,
  currencyTotals,
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "0.5px solid #E8E7E2",
        overflow: "hidden",
      }}
    >
     
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr style={{ borderBottom: "0.5px solid #F0EFE9" }}>
            {[
              "Document",
              "Type",
              "Supplier",
              "Doc №",
              "Issue date",
              "Amount",
              "Issues",
              "Status",
              "",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 16px",
                  textAlign: "left",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#bbb",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={9}
                style={{
                  textAlign: "center",
                  padding: "48px",
                  color: "#bbb",
                  fontSize: 13,
                }}
              >
                Loading documents...
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                style={{
                  textAlign: "center",
                  padding: "48px",
                  color: "#bbb",
                  fontSize: 13,
                }}
              >
                {docs.length === 0
                  ? "No documents yet — upload your first file"
                  : "No documents match your filter"}
              </td>
            </tr>
          ) : (
            filtered.map((doc) => (
              <tr
                key={doc.id}
                className="doc-row"
                onClick={() => setSelectedDoc(doc)}
                style={{
                  borderBottom: "0.5px solid #F8F7F4",
                  cursor: "pointer",
                  transition: "background 0.1s",
                }}
              >
                <td style={{ padding: "12px 16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <FileIcon ext={doc.ext} />
                    <span
                      style={{
                        fontWeight: 500,
                        color: "#1a1a1a",
                        fontSize: 13,
                      }}
                    >
                      {doc.name}
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    color: "#888",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.type}
                </td>
                <td style={{ padding: "12px 16px", color: "#555" }}>
                  {doc.supplier || (
                    <span style={{ color: "#E24B4A", fontSize: 12 }}>
                      Missing
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#888",
                      background: "#F5F4F0",
                      padding: "2px 7px",
                      borderRadius: 5,
                    }}
                  >
                    {doc.docNumber}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    color: "#888",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.issueDate || "—"}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.currency === "EUR"
                    ? "€"
                    : doc.currency === "USD"
                      ? "$"
                      : doc.currency === "BAM"
                        ? "KM"
                        : ""}{" "}
                  {doc.amount != null
                    ? doc.amount.toLocaleString("en", {
                        minimumFractionDigits: 2,
                      })
                    : "—"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {doc.issues.length === 0 ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: "#3B6D11",
                      }}
                    >
                      <CheckCircle2 size={12} /> Clean
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#FCEBEB",
                        color: "#A32D2D",
                        padding: "3px 9px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      <AlertTriangle size={10} />
                      {doc.issues.length} issue
                      {doc.issues.length > 1 ? "s" : ""}
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <StatusBadge status={doc.status} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button
                    className="review-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDoc(doc);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "5px 10px",
                      borderRadius: 7,
                      background: "transparent",
                      border: "1px solid #e8e8e8",
                      fontSize: 11,
                      color: "#888",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                  >
                    <Eye size={11} /> Review
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div
        style={{
          padding: "12px 20px",
          borderTop: "0.5px solid #F0EFE9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "#bbb" }}>
          Showing {filtered.length} of {counts.all} documents
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(currencyTotals).map(([cur, total]) => (
          ))}
        </div>
      </div>
    </div>
  );
}
