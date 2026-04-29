'use client'
import { useState, useRef, useCallback } from 'react';
import '@/stylesheet/landingPage.css';

export default function UploadPage() {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState({}); // Čuva ID iz baze i status
    const fileInputRef = useRef(null);

    const onFilesAdded = useCallback((newFiles) => {
        const fileList = Array.from(newFiles);
        setFiles(prev => [...prev, ...fileList]);
        
        // Inicijalni status za svaki fajl
        fileList.forEach(f => {
            setUploadResults(prev => ({ ...prev, [f.name]: { status: 'idle' } }));
        });
    }, []);

    const uploadAll = async () => {
        setUploading(true);

        for (const file of files) {
            if (uploadResults[file.name]?.status === 'done') continue;

            setUploadResults(prev => ({ ...prev, [file.name]: { status: 'uploading' } }));

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('http://localhost:8000/api/documents/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    setUploadResults(prev => ({ 
                        ...prev, 
                        [file.name]: { status: 'done', id: data.id } 
                    }));
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                setUploadResults(prev => ({ 
                    ...prev, 
                    [file.name]: { status: 'error' } 
                }));
            }
        }
        setUploading(false);
    };

    return (
        <div className="upload-container">
            <nav className="nav-header">
                <div className="nav-content">
                    <div className="logo">SmartDocs</div>
                </div>
            </nav>

            <main className="main-layout">
                <div className="title-section">
                    <h1>Sistem za ekstrakciju podataka</h1>
                    <p>Postavite fakture ili narudžbenice za automatsku validaciju</p>
                </div>

                <div 
                    className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); onFilesAdded(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        multiple 
                        hidden 
                        onChange={(e) => onFilesAdded(e.target.files)} 
                    />
                    <div className="icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                    </div>
                    <p style={{fontWeight: 600}}>Klikni ili prevuci fajlove ovdje</p>
                    <p style={{fontSize: 13, color: '#aaa', marginTop: 4}}>PDF, PNG, JPG (Max 20MB)</p>
                </div>

                <div className="file-list">
                    {files.map((file, index) => (
                        <div key={index} className="file-card">
                            <div className="type-badge">
                                {file.name.split('.').pop().toUpperCase()}
                            </div>
                            <div className="file-details">
                                <span className="file-name">{file.name}</span>
                                <span className="file-meta">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <div className="file-status">
                                {uploadResults[file.name]?.status === 'uploading' && <div className="loader" style={{borderColor: '#1a1a1a', borderTopColor: 'transparent'}}></div>}
                                {uploadResults[file.name]?.status === 'done' && <span className="status-tag status-done">Spremljeno u bazu</span>}
                                {uploadResults[file.name]?.status === 'error' && <span className="status-tag status-error">Greška</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {files.length > 0 && (
                    <button 
                        className="process-btn" 
                        onClick={uploadAll} 
                        disabled={uploading}
                    >
                        {uploading ? (
                            <><span className="loader"></span> Procesiranje...</>
                        ) : (
                            `Spremi ${files.length} dokumenata u bazu`
                        )}
                    </button>
                )}
            </main>
        </div>
    );
}