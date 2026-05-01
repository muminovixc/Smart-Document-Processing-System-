"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Upload,
  FileText,
  Search,
  AlertTriangle,
  Filter,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import MetricCard from "@/components/list/MetricCard";
import DetailPanel from "@/components/list/DetailPanel";
import DocumentsTable from "@/components/list/DocumentsTable";

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
                  textDecoration: "none",
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
              </div>
            </div>
          </div>

          <DocumentsTable
            docs={docs}
            filtered={filtered}
            loading={loading}
            setSelectedDoc={setSelectedDoc}
            counts={counts}
            currencyTotals={currencyTotals}
          />
        </div>
      </div>

      {selectedDoc && (
        <DetailPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}
