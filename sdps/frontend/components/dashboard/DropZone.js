export default function DropZone({
  dragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  fileInputRef,
  onFileChange,
}) {
  return (
    <div
      className={`drop-zone ${dragging ? "dragging" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        multiple
        hidden
        onChange={onFileChange}
      />
      <div className="icon-wrapper">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#666"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
      </div>
      <p style={{ fontWeight: 600 }}>Click or drag files here</p>
    </div>
  );
}
