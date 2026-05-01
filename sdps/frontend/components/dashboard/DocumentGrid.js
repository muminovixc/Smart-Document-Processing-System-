import DocumentCard from "@/components/dashboard/DocumentCard";

export default function DocumentGrid({ dbDocuments, onView }) {
  return (
    <section className="dashboard-section">
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Recent Documents</h2>
      <div className="document-grid">
        {dbDocuments.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onView={onView} />
        ))}
      </div>
    </section>
  );
}
