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
  const [dragging, setDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null); // Stanje za modal
  const fileInputRef = useRef(null);

  const API_BASE_URL = "http://localhost:8000";

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDbDocuments(data);
      }
    } catch (err) {
      console.error("Error fetching documents");
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelection = (selectedFiles) => {
    setFiles(Array.from(selectedFiles));
  };

  const uploadAll = async () => {
    setUploading(true);
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
    setUploading(false);
    fetchDocuments();
  };

  // Helper funkcija za prikaz dokumenta
  const renderPreviewContent = (doc) => {
    // 1. Dobijamo samo ime fajla (npr. "moj_dokument.pdf")
    // Koristimo regex [/\\] da splitujemo i po forward slash i po backslash (bitno za Windows)
    const fileName = doc.file_path.split(/[/\\]/).pop();

    // 2. KORISTIMO URL BACKENDA, A NE PUTANJU FOLDERA
    // Browseru treba adresa servera, a server zna da "/static" mapira na tvoj folder na disku
    const fileUrl = `http://localhost:8000/static/${fileName}`;

    const isPDF = doc.original_filename.toLowerCase().endsWith(".pdf");
    //
    if (isPDF) {
      console.log("Prikazujem PDF sa URL: " + fileUrl);
      return (
        <embed
          src={fileUrl}
          type="application/pdf"
          width="100%"
          height="600px"
        />
      );
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

        {files.length > 0 && (
          <button
            className="process-btn"
            onClick={uploadAll}
            disabled={uploading}
          >
            {uploading ? "Processing..." : `Process ${files.length} documents`}
          </button>
        )}

        <DocumentGrid
          dbDocuments={dbDocuments}
          onView={(doc) => setPreviewDoc(doc)}
        />
      </main>
    </div>
  );
}
