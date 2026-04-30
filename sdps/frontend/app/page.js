'use client'
import { useState, useEffect, useRef } from 'react';
import '@/stylesheet/landingPage.css';

export default function UploadPage() {
    const [files, setFiles] = useState([]);
    const [dbDocuments, setDbDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null); // Stanje za modal
    const fileInputRef = useRef(null);

    const API_BASE_URL = 'http://localhost:8000';

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
            formData.append('file', file);
            try {
                await fetch(`${API_BASE_URL}/documents/upload`, {
                    method: 'POST',
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
    
    const isPDF = doc.original_filename.toLowerCase().endsWith('.pdf');

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
            style={{ maxWidth: '100%', borderRadius: '8px', display: 'block', margin: '0 auto' }} 
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
            {/* MODAL ZA PREGLED */}
            {previewDoc && (
                <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{previewDoc.original_filename}</h3>
                            <button className="close-btn" onClick={() => setPreviewDoc(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {renderPreviewContent(previewDoc)}
                        </div>
                    </div>
                </div>
            )}

            <nav className="nav-header">
                <div className="nav-content">
                    <div className="logo">SmartDocs AI</div>
                </div>
            </nav>

            <main className="main-layout">
                <section className="title-section">
                    <h1>Data Extraction System</h1>
                    <p>Upload invoices or purchase orders for validation</p>
                </section>

                <div 
                    className={`drop-zone ${dragging ? 'dragging' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileSelection(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        multiple 
                        hidden 
                        onChange={(e) => handleFileSelection(e.target.files)} 
                    />
                    <div className="icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                    </div>
                    <p style={{fontWeight: 600}}>Click or drag files here</p>
                </div>

                {files.length > 0 && (
                    <button className="process-btn" onClick={uploadAll} disabled={uploading}>
                        {uploading ? "Processing..." : `Process ${files.length} documents`}
                    </button>
                )}

                <section className="dashboard-section">
                    <h2 style={{fontSize: 20, fontWeight: 700}}>Recent Documents</h2>
                    <div className="document-grid">
                        {dbDocuments.map(doc => (
                            <div key={doc.id} className={`doc-card ${doc.status}`}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                    <div>
                                        <div style={{fontWeight: 600, fontSize: 15}}>{doc.original_filename}</div>
                                        <div style={{fontSize: 12, color: '#888'}}>ID: {doc.id} • {new Date(doc.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px'}}>
                                        <span className={`status-tag status-${doc.status}`}>{doc.status.replace('_', ' ')}</span>
                                        {/* DUGME ZA PREVIEW */}
                                        <button 
                                            className="view-btn" 
                                            onClick={() => setPreviewDoc(doc)}
                                            style={{padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd'}}
                                        >
                                            View Document
                                        </button>
                                    </div>
                                </div>

                                {doc.status !== 'uploaded' && (
                                    <div style={{marginTop: 15, paddingTop: 15, borderTop: '1px solid #eee'}}>
                                        <div className="data-row">
                                            <span>Supplier: <strong>{doc.supplier_name || 'N/A'}</strong></span>
                                            <span>Total: <strong>{doc.total_amount} {doc.currency}</strong></span>
                                        </div>
                                        
                                        {doc.validation_errors && (
                                            <div className="error-list">
                                                {JSON.parse(doc.validation_errors).map((err, i) => (
                                                    <div key={i} className="error-item">Warning: {err}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}