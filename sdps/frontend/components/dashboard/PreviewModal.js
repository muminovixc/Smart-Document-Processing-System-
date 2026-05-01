export default function PreviewModal({
  previewDoc,
  onClose,
  renderPreviewContent,
}) {
  if (!previewDoc) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{previewDoc.original_filename}</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">{renderPreviewContent(previewDoc)}</div>
      </div>
    </div>
  );
}
