"use client";
import { useState, useEffect, useRef } from "react";
import "@/stylesheet/landingPage.css";
import NavHeader from "@/components/dashboard/NavHeader";
import PreviewModal from "@/components/dashboard/PreviewModal";
import DropZone from "@/components/dashboard/DropZone";
import DocumentGrid from "@/components/dashboard/DocumentGrid";
import TitleSection from "@/components/dashboard/TitleSection";

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [dbDocuments, setDbDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewContent, setPreviewContent] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const fileInputRef = useRef(null);

  const API_BASE_URL =
    "https://smart-document-processing-system-xsp7.onrender.com";

  const fetchDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDbDocuments(data);
      }
    } catch (err) {
      console.error("Error fetching documents");
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadPreviewContent = async () => {
      if (!previewDoc) {
        setPreviewContent("");
        setPreviewLoading(false);
        setPreviewError("");
        return;
      }

      const ext = previewDoc.original_filename.toLowerCase().split(".").pop();
      if (ext !== "txt" && ext !== "csv") {
        setPreviewContent("");
        setPreviewLoading(false);
        setPreviewError("");
        return;
      }

      setPreviewLoading(true);
      setPreviewError("");
      setPreviewContent("");

      const fileUrl = `${API_BASE_URL}/documents/${previewDoc.id}/file`;

      try {
        const res = await fetch(fileUrl);
        if (!res.ok) {
          throw new Error(`Unable to load file: ${res.status}`);
        }
        const text = await res.text();
        setPreviewContent(text);
      } catch (err) {
        console.error(err);
        setPreviewError("Unable to load preview content.");
      } finally {
        setPreviewLoading(false);
      }
    };

    loadPreviewContent();
  }, [previewDoc]);

  const handleFileSelection = (selectedFiles) => {
    setFiles(Array.from(selectedFiles));
  };

  const uploadAll = async () => {
    setUploading(true);
    setValidationMessage("Uploading and validating documents...");

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        await fetch(`${API_BASE_URL}/documents/upload`, {
          method: "POST",
          body: formData,
        });
      } catch (err) {
        console.error("Upload failed for " + file.name);
      }
    }

    setFiles([]);
    setValidationMessage("Validation complete. Refreshing document list...");
    await fetchDocuments();
    setValidationMessage("");
    setUploading(false);
  };

  // Helper funkcija za prikaz dokumenta
  const renderPreviewContent = (doc) => {
    const fileUrl = `${API_BASE_URL}/documents/${doc.id}/file`;
    const ext = doc.original_filename.toLowerCase().split(".").pop();

    if (ext === "pdf") {
      return (
        <embed
          src={fileUrl}
          type="application/pdf"
          width="100%"
          height="600px"
        />
      );
    }

    if (ext === "txt" || ext === "csv") {
      if (previewLoading) {
        return <div>Loading preview...</div>;
      }
      if (previewError) {
        return <div>{previewError}</div>;
      }
      if (previewContent) {
        if (ext === "csv") {
          const rows = previewContent
            .split("\n")
            .filter(Boolean)
            .map((row) => row.split(","));
          return (
            <div className="text-preview">
              <table className="csv-preview-table">
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return <pre className="text-preview">{previewContent}</pre>;
      }

      return <div>No preview available yet.</div>;
    }

    return (
      <img
        src={fileUrl}
        alt="Document Preview"
        style={{
          maxWidth: "100%",
          borderRadius: "8px",
          display: "block",
          margin: "0 auto",
        }}
        onError={(e) => {
          console.error("Greška pri učitavanju slike sa:", fileUrl);
          e.target.onerror = null;
          e.target.src = "https://placehold.co/600x400?text=File+Not+Found";
        }}
      />
    );
  };

  return (
    <div className="upload-container">
      {previewDoc && (
        <PreviewModal
          previewDoc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          renderPreviewContent={renderPreviewContent}
        />
      )}

      <NavHeader />

      <main className="main-layout">
        <TitleSection />

        <div
          style={{
            margin: "20px 0",
            padding: "14px 18px",
            borderRadius: 12,
            background: "#f9f3d7",
            border: "1px solid #f1d78a",
            color: "#6f5500",
            fontSize: 14,
          }}
        >
          Please wait 5-10 seconds and refresh the page if the backend server is
          still starting.
        </div>

        <DropZone
          dragging={dragging}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFileSelection(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current.click()}
          fileInputRef={fileInputRef}
          onFileChange={(e) => handleFileSelection(e.target.files)}
        />

        {isLoadingDocuments && (
          <div
            style={{
              margin: "10px 0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "3px solid #b8d0ff",
                borderTop: "3px solid #1a3d8f",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          </div>
        )}

        {files.length > 0 && (
          <button
            className="process-btn"
            onClick={uploadAll}
            disabled={uploading}
          >
            {uploading
              ? "Uploading and validating..."
              : `Process ${files.length} documents`}
          </button>
        )}

        {(uploading || validationMessage) && (
          <div className="upload-status">
            <span className="upload-status-dot" />
            <span>{validationMessage || "Validating documents..."}</span>
          </div>
        )}

        <DocumentGrid
          dbDocuments={dbDocuments}
          onView={(doc) => setPreviewDoc(doc)}
        />
      </main>
    </div>
  );
}
