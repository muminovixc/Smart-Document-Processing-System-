import Link from "next/link";

export default function NavHeader() {
  return (
    <nav className="nav-header">
      <div className="nav-content">
        <div className="logo">SmartDocs AI</div>
        <Link href="/list" className="nav-list-link">
          View Document List
          <span className="arrow">→</span>
        </Link>
      </div>
    </nav>
  );
}
