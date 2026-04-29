'use client'

import { useState, useMemo } from "react";
import {
  Upload, FileText, Image, FileSpreadsheet, Search,
  AlertTriangle, CheckCircle2, Clock, XCircle,
  ChevronRight, MoreHorizontal, TrendingUp, Filter,
  RefreshCw, Eye
} from "lucide-react";

const DOCS = [
  { id: 1, name: "invoice_1.pdf", ext: "pdf", type: "Invoice", supplier: "Company 0", docNumber: "INV-1000", issueDate: "2024-01-15", dueDate: "2024-02-15", amount: 800.0, currency: "EUR", issues: ["Math error: 645+129=774, total=800", "Subtotal mismatch"], status: "needs_review" },
  { id: 2, name: "invoice_2.pdf", ext: "pdf", type: "Invoice", supplier: "Company 1", docNumber: "INV-1001", issueDate: "2024-01-18", dueDate: "2024-02-18", amount: 1240.0, currency: "EUR", issues: [], status: "validated" },
  { id: 3, name: "po_1.pdf", ext: "pdf", type: "Purchase Order", supplier: "Buyer 0", docNumber: "PO-2000", issueDate: "2024-01-20", dueDate: "2024-02-20", amount: 3500.0, currency: "USD", issues: [], status: "validated" },
  { id: 4, name: "img_6.png", ext: "img", type: "Invoice", supplier: "Img 5", docNumber: "INV-3205", issueDate: "2024-01-22", dueDate: null, amount: 439.0, currency: "EUR", issues: ["Missing due date", "OCR confidence low"], status: "needs_review" },
  { id: 5, name: "invoice_3.csv", ext: "csv", type: "Invoice", supplier: "Acme Corp", docNumber: "INV-1002", issueDate: "2024-01-23", dueDate: "2024-02-23", amount: 2100.0, currency: "USD", issues: [], status: "uploaded" },
  { id: 6, name: "po_2.pdf", ext: "pdf", type: "Purchase Order", supplier: "Buyer 1", docNumber: "PO-2000", issueDate: "2024-01-24", dueDate: "2024-02-24", amount: 980.0, currency: "EUR", issues: ["Duplicate doc number: PO-2000"], status: "rejected" },
  { id: 7, name: "invoice_4.pdf", ext: "pdf", type: "Invoice", supplier: "Tech Ltd", docNumber: "INV-1003", issueDate: "2024-01-25", dueDate: "2024-02-25", amount: 560.0, currency: "BAM", issues: [], status: "validated" },
  { id: 8, name: "img_3.png", ext: "img", type: "Invoice", supplier: null, docNumber: "INV-3100", issueDate: "2024-01-26", dueDate: "2024-02-26", amount: 220.0, currency: "EUR", issues: ["Missing supplier name"], status: "needs_review" },
  { id: 9, name: "data_export.csv", ext: "csv", type: "Purchase Order", supplier: "Global Inc", docNumber: "PO-2001", issueDate: "2024-01-27", dueDate: "2024-02-27", amount: 4400.0, currency: "USD", issues: [], status: "uploaded" },
  { id: 10, name: "invoice_5.txt", ext: "txt", type: "Invoice", supplier: "FastShip", docNumber: "INV-1004", issueDate: "2024-03-10", dueDate: "2024-01-01", amount: 315.0, currency: "EUR", issues: ["Due date before issue date"], status: "needs_review" },
  { id: 11, name: "po_3.pdf", ext: "pdf", type: "Purchase Order", supplier: "Buyer 2", docNumber: "PO-2002", issueDate: "2024-01-29", dueDate: "2024-03-01", amount: 7200.0, currency: "EUR", issues: [], status: "validated" },
  { id: 12, name: "invoice_6.pdf", ext: "pdf", type: "Invoice", supplier: "Company 5", docNumber: "INV-1005", issueDate: "2024-01-29", dueDate: "2024-02-28", amount: 1890.0, currency: "BAM", issues: ["Line item qty×price mismatch"], status: "needs_review" },
];

const STATUS_CONFIG = {
  uploaded:     { label: "Uploaded",     color: "#185FA5", bg: "#E6F1FB", dot: "#378ADD" },
  needs_review: { label: "Needs Review", color: "#854F0B", bg: "#FAEEDA", dot: "#EF9F27" },
  validated:    { label: "Validated",    color: "#3B6D11", bg: "#EAF3DE", dot: "#639922" },
  rejected:     { label: "Rejected",     color: "#A32D2D", bg: "#FCEBEB", dot: "#E24B4A" },
};

const EXT_CONFIG = {
  pdf: { label: "PDF", bg: "#FAECE7", color: "#993C1D", Icon: FileText },
  img: { label: "IMG", bg: "#EEEDFE", color: "#534AB7", Icon: Image },
  csv: { label: "CSV", bg: "#EAF3DE", color: "#3B6D11", Icon: FileSpreadsheet },
  txt: { label: "TXT", bg: "#E6F1FB", color: "#185FA5", Icon: FileText },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
      letterSpacing: "0.02em"
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function FileIcon({ ext }) {
  const cfg = EXT_CONFIG[ext] || EXT_CONFIG.txt;
  const { Icon } = cfg;
  return (
    <span style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: cfg.bg, color: cfg.color,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={15} strokeWidth={2} />
    </span>
  );
}

function MetricCard({ label, value, sub, valueColor }) {
  return (
    <div style={{
      background: "#F8F7F4", borderRadius: 10,
      padding: "14px 18px", flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: "#888", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: valueColor || "#1a1a1a", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function UploadZone({ onClose }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "32px 40px",
        width: 460, boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Upload documents</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>PDF, PNG, JPG, CSV, TXT — max 20MB</div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); }}
          style={{
            border: `2px dashed ${dragging ? "#378ADD" : "#ddd"}`,
            borderRadius: 12, padding: "36px 24px",
            textAlign: "center", background: dragging ? "#E6F1FB" : "#fafafa",
            transition: "all 0.15s", cursor: "pointer",
          }}
        >
          <Upload size={28} color={dragging ? "#185FA5" : "#bbb"} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "#555" }}>Drop files here</div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>or click to browse</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "8px 18px", borderRadius: 8, border: "1px solid #e0e0e0",
            background: "#fff", fontSize: 13, cursor: "pointer", color: "#555",
          }}>Cancel</button>
          <button style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>Process files</button>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ doc, onClose }) {
  if (!doc) return null;
  const cfg = STATUS_CONFIG[doc.status];
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
      display: "flex", justifyContent: "flex-end", zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        width: 420, height: "100%", background: "#fff",
        padding: "28px 28px", overflowY: "auto",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.08)",
        animation: "slideIn 0.2s ease",
      }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <FileIcon ext={doc.ext} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.name}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{doc.docNumber}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4 }}>✕</button>
        </div>

        <StatusBadge status={doc.status} />

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            ["Type", doc.type],
            ["Supplier", doc.supplier || "—"],
            ["Doc number", doc.docNumber],
            ["Issue date", doc.issueDate],
            ["Due date", doc.dueDate || "—"],
            ["Currency", doc.currency],
            ["Total amount", `${doc.currency === "EUR" ? "€" : doc.currency === "USD" ? "$" : "KM"} ${doc.amount.toLocaleString("en", { minimumFractionDigits: 2 })}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "0.5px solid #f0f0f0", paddingBottom: 10 }}>
              <span style={{ color: "#888" }}>{k}</span>
              <span style={{ fontWeight: 500, color: "#1a1a1a" }}>{v}</span>
            </div>
          ))}
        </div>

        {doc.issues.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#A32D2D", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Validation issues
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {doc.issues.map((issue, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  background: "#FCEBEB", borderRadius: 8, padding: "8px 12px",
                }}>
                  <AlertTriangle size={13} color="#E24B4A" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#A32D2D", lineHeight: 1.5 }}>{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
          <button style={{
            flex: 1, padding: "9px 0", borderRadius: 8,
            background: "#1a1a1a", color: "#fff", border: "none",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>Open review screen</button>
          <button style={{
            padding: "9px 14px", borderRadius: 8,
            background: "#fff", color: "#555",
            border: "1px solid #e0e0e0", fontSize: 13, cursor: "pointer",
          }}>
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const counts = useMemo(() => ({
    all: DOCS.length,
    uploaded: DOCS.filter(d => d.status === "uploaded").length,
    needs_review: DOCS.filter(d => d.status === "needs_review").length,
    validated: DOCS.filter(d => d.status === "validated").length,
    rejected: DOCS.filter(d => d.status === "rejected").length,
  }), []);

  const totalIssues = useMemo(() => DOCS.reduce((sum, d) => sum + d.issues.length, 0), []);

  const filtered = useMemo(() => {
    return DOCS.filter(d => {
      if (filter !== "all" && d.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) ||
          d.supplier?.toLowerCase().includes(q) ||
          d.docNumber.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filter, search]);

  const currencyTotals = useMemo(() => {
    const totals = {};
    DOCS.forEach(d => {
      if (!totals[d.currency]) totals[d.currency] = 0;
      totals[d.currency] += d.amount;
    });
    return totals;
  }, []);

  const TABS = [
    { key: "all", label: "All" },
    { key: "uploaded", label: "Uploaded" },
    { key: "needs_review", label: "Needs review" },
    { key: "validated", label: "Validated" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#F5F4F0",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      padding: "0 0 60px",
    }}>
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
      <div style={{
        background: "#fff", borderBottom: "0.5px solid #E8E7E2",
        padding: "0 40px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, background: "#1a1a1a", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={14} color="#fff" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>SmartDocs</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8,
                border: "1px solid #e0e0e0", background: "#fff",
                fontSize: 12, color: "#555", cursor: "pointer",
              }}>
                <RefreshCw size={12} /> Refresh
              </button>
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 16px", borderRadius: 8,
                  background: "#1a1a1a", color: "#fff",
                  border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                <Upload size={13} /> Upload
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px 0" }}>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>Document processing</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
            {counts.all} documents — {totalIssues} validation issues detected
          </p>
        </div>

        {/* Metrics */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <MetricCard label="Total" value={counts.all} sub="+3 today" />
          <MetricCard label="Needs review" value={counts.needs_review} sub={`${totalIssues} issues total`} valueColor="#854F0B" />
          <MetricCard label="Validated" value={counts.validated} sub="clean pass" valueColor="#3B6D11" />
          <MetricCard label="Rejected" value={counts.rejected} sub="1 duplicate" valueColor="#A32D2D" />
        </div>

        {/* Table card */}
        <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #E8E7E2", overflow: "hidden" }}>

          {/* Toolbar */}
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #F0EFE9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  className="tab-btn"
                  onClick={() => setFilter(t.key)}
                  style={{
                    padding: "5px 13px", borderRadius: 20, border: "none",
                    fontSize: 12, fontWeight: 500, cursor: "pointer",
                    background: filter === t.key ? "#1a1a1a" : "transparent",
                    color: filter === t.key ? "#fff" : "#888",
                  }}
                >
                  {t.label}
                  <span style={{
                    marginLeft: 5, fontSize: 10,
                    color: filter === t.key ? "rgba(255,255,255,0.6)" : "#bbb",
                  }}>
                    {counts[t.key]}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <Search size={13} color="#bbb" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  style={{
                    paddingLeft: 30, paddingRight: 12, paddingTop: 6, paddingBottom: 6,
                    borderRadius: 8, border: "1px solid #e8e8e8", background: "#fafafa",
                    fontSize: 12, color: "#333", width: 180, outline: "none",
                  }}
                />
              </div>
              <button style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 8,
                border: "1px solid #e8e8e8", background: "#fafafa",
                fontSize: 12, color: "#888", cursor: "pointer",
              }}>
                <Filter size={11} /> Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #F0EFE9" }}>
                {["Document", "Type", "Supplier", "Doc №", "Issue date", "Amount", "Issues", "Status", ""].map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontSize: 10, fontWeight: 600, color: "#bbb",
                    textTransform: "uppercase", letterSpacing: "0.07em",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#bbb", fontSize: 13 }}>
                    No documents found
                  </td>
                </tr>
              ) : filtered.map(doc => (
                <tr
                  key={doc.id}
                  className="doc-row"
                  onClick={() => setSelectedDoc(doc)}
                  style={{ borderBottom: "0.5px solid #F8F7F4", cursor: "pointer", transition: "background 0.1s" }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <FileIcon ext={doc.ext} />
                      <span style={{ fontWeight: 500, color: "#1a1a1a", fontSize: 13 }}>{doc.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#888", whiteSpace: "nowrap" }}>
                    {doc.type}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#555" }}>
                    {doc.supplier || <span style={{ color: "#E24B4A", fontSize: 12 }}>Missing</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "#888", background: "#F5F4F0", padding: "2px 7px", borderRadius: 5 }}>
                      {doc.docNumber}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#888", whiteSpace: "nowrap" }}>
                    {doc.issueDate}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {doc.currency === "EUR" ? "€" : doc.currency === "USD" ? "$" : "KM"}{" "}
                    {doc.amount.toLocaleString("en", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {doc.issues.length === 0 ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#3B6D11" }}>
                        <CheckCircle2 size={12} /> Clean
                      </span>
                    ) : (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "#FCEBEB", color: "#A32D2D",
                        padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                      }}>
                        <AlertTriangle size={10} />
                        {doc.issues.length} issue{doc.issues.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={doc.status} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      className="review-action"
                      onClick={e => { e.stopPropagation(); setSelectedDoc(doc); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "5px 10px", borderRadius: 7,
                        background: "transparent", border: "1px solid #e8e8e8",
                        fontSize: 11, color: "#888", cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                    >
                      <Eye size={11} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{
            padding: "12px 20px", borderTop: "0.5px solid #F0EFE9",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 12, color: "#bbb" }}>
              Showing {filtered.length} of {counts.all} documents
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(currencyTotals).map(([cur, total]) => (
                <span key={cur} style={{
                  fontSize: 11, background: "#F5F4F0",
                  padding: "3px 9px", borderRadius: 6, color: "#666",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  <strong>{cur}</strong> {cur === "EUR" ? "€" : cur === "USD" ? "$" : "KM"}
                  {total.toLocaleString("en", { minimumFractionDigits: 2 })}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showUpload && <UploadZone onClose={() => setShowUpload(false)} />}
      {selectedDoc && <DetailPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
    </div>
  );
}