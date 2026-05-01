"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  Search,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Filter,
  RefreshCw,
  Eye,
} from "lucide-react";
import Link from "next/link";

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

const EXT_CONFIG = {
  pdf: { label: "PDF", bg: "#FAECE7", color: "#993C1D", Icon: FileText },
  png: { label: "IMG", bg: "#EEEDFE", color: "#534AB7", Icon: Image },
  jpg: { label: "IMG", bg: "#EEEDFE", color: "#534AB7", Icon: Image },
  jpeg: { label: "IMG", bg: "#EEEDFE", color: "#534AB7", Icon: Image },
  csv: { label: "CSV", bg: "#EAF3DE", color: "#3B6D11", Icon: FileSpreadsheet },
  txt: { label: "TXT", bg: "#E6F1FB", color: "#185FA5", Icon: FileText },
};

// ── Map DB document → UI shape ────────────────────────────────────────────────
function mapDoc(doc) {
  const ext = doc.file_type?.toLowerCase() || "pdf";
  const issues = (() => {
    try {
      return doc.validation_errors ? JSON.parse(doc.validation_errors) : [];
    } catch {
      return [];
    }
  })();

  return {
    id: doc.id,
    name: doc.original_filename,
    ext,
    type:
      doc.doc_type === "purchase_order"
        ? "Purchase Order"
        : doc.doc_type === "invoice"
          ? "Invoice"
          : "Unknown",
    supplier: doc.supplier_name || null,
    docNumber: doc.doc_number || "—",
    issueDate: doc.issue_date || null,
    dueDate: doc.due_date || null,
    amount: doc.total_amount || 0,
    currency: doc.currency || "—",
    issues,
    status: doc.status,
  };
}

// ── Sub-components (identical to original) ────────────────────────────────────
function StatusBadge({ status }) {
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

function FileIcon({ ext }) {
  const cfg = EXT_CONFIG[ext] || EXT_CONFIG.txt;
  const { Icon } = cfg;
  return (
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        flexShrink: 0,
        background: cfg.bg,
        color: cfg.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={15} strokeWidth={2} />
    </span>
  );
}

function MetricCard({ label, value, sub, valueColor }) {
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

function DetailPanel({ doc, onClose }) {
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

        <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
          <button
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 8,
              background: "#1a1a1a",
              color: "#fff",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Open review screen
          </button>
          <button
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              background: "#fff",
              color: "#555",
              border: "1px solid #e0e0e0",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const TABS = [
  { key: "all", label: "All" },
  { key: "uploaded", label: "Uploaded" },
  { key: "needs_review", label: "Needs review" },
  { key: "validated", label: "Validated" },
  { key: "rejected", label: "Rejected" },
];

export default function Dashboard() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/documents/list");
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setDocs(data.map(mapDoc));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const counts = useMemo(
    () => ({
      all: docs.length,
      uploaded: docs.filter((d) => d.status === "uploaded").length,
      needs_review: docs.filter((d) => d.status === "needs_review").length,
      validated: docs.filter((d) => d.status === "validated").length,
      rejected: docs.filter((d) => d.status === "rejected").length,
    }),
    [docs],
  );

  const totalIssues = useMemo(
    () => docs.reduce((sum, d) => sum + d.issues.length, 0),
    [docs],
  );

  const filtered = useMemo(
    () =>
      docs.filter((d) => {
        if (filter !== "all" && d.status !== filter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            d.name.toLowerCase().includes(q) ||
            d.supplier?.toLowerCase().includes(q) ||
            d.docNumber.toLowerCase().includes(q) ||
            d.type.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [docs, filter, search],
  );

  const currencyTotals = useMemo(() => {
    const totals = {};
    docs.forEach((d) => {
      if (!d.currency || d.currency === "—") return;
      totals[d.currency] = (totals[d.currency] || 0) + (d.amount || 0);
    });
    return totals;
  }, [docs]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F4F0",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        padding: "0 0 60px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
        tr.doc-row:hover { background: #F0EFE9 !important; }
        .tab-btn { transition: all 0.12s; }
        .tab-btn:hover { opacity: 0.8; }
        .review-action:hover { background: #f0f0f0 !important; }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "0.5px solid #E8E7E2",
          padding: "0 40px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: "#1a1a1a",
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={14} color="#fff" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
                SmartDocs
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={fetchDocs}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid #e0e0e0",
                  background: "#fff",
                  fontSize: 12,
                  color: "#555",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 16px",
                  borderRadius: 8,
                  background: "#1a1a1a",
                  color: "#fff",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  textDecoration: "none", // Dodaj ovo da ukloniš podvlačenje linka
                }}
              >
                <Upload size={13} /> Upload
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px 0" }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#1a1a1a",
              margin: 0,
            }}
          >
            Document processing
          </h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
            {loading
              ? "Loading..."
              : `${counts.all} documents — ${totalIssues} validation issues detected`}
          </p>
        </div>

        {/* Metrics */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <MetricCard
            label="Total"
            value={loading ? "—" : counts.all}
            sub="from database"
          />
          <MetricCard
            label="Needs review"
            value={loading ? "—" : counts.needs_review}
            sub={`${totalIssues} issues total`}
            valueColor="#854F0B"
          />
          <MetricCard
            label="Validated"
            value={loading ? "—" : counts.validated}
            sub="clean pass"
            valueColor="#3B6D11"
          />
          <MetricCard
            label="Rejected"
            value={loading ? "—" : counts.rejected}
            sub="flagged"
            valueColor="#A32D2D"
          />
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              background: "#FCEBEB",
              border: "1px solid #F5C6C6",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#A32D2D",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={14} /> Failed to load documents: {error}
          </div>
        )}

        {/* Table card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            border: "0.5px solid #E8E7E2",
            overflow: "hidden",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "0.5px solid #F0EFE9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 4 }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className="tab-btn"
                  onClick={() => setFilter(t.key)}
                  style={{
                    padding: "5px 13px",
                    borderRadius: 20,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: filter === t.key ? "#1a1a1a" : "transparent",
                    color: filter === t.key ? "#fff" : "#888",
                  }}
                >
                  {t.label}
                  <span
                    style={{
                      marginLeft: 5,
                      fontSize: 10,
                      color:
                        filter === t.key ? "rgba(255,255,255,0.6)" : "#bbb",
                    }}
                  >
                    {counts[t.key]}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={13}
                  color="#bbb"
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  style={{
                    paddingLeft: 30,
                    paddingRight: 12,
                    paddingTop: 6,
                    paddingBottom: 6,
                    borderRadius: 8,
                    border: "1px solid #e8e8e8",
                    background: "#fafafa",
                    fontSize: 12,
                    color: "#333",
                    width: 180,
                    outline: "none",
                  }}
                />
              </div>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e8e8e8",
                  background: "#fafafa",
                  fontSize: 12,
                  color: "#888",
                  cursor: "pointer",
                }}
              >
                <Filter size={11} /> Filter
              </button>
            </div>
          </div>

          {/* Table */}
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

          {/* Footer */}
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
                <span
                  key={cur}
                  style={{
                    fontSize: 11,
                    background: "#F5F4F0",
                    padding: "3px 9px",
                    borderRadius: 6,
                    color: "#666",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <strong>{cur}</strong>{" "}
                  {cur === "EUR" ? "€" : cur === "USD" ? "$" : "KM"}
                  {total.toLocaleString("en", { minimumFractionDigits: 2 })}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedDoc && (
        <DetailPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}
