import { FileText, Image, FileSpreadsheet } from "lucide-react";

const EXT_CONFIG = {
  pdf: { label: "PDF", bg: "#FAECE7", color: "#993C1D", Icon: FileText },
  png: { label: "IMG", bg: "#EEEDFE", color: "#534AB7", Icon: Image },
  jpg: { label: "IMG", bg: "#EEEDFE", color: "#534AB7", Icon: Image },
  jpeg: { label: "IMG", bg: "#EEEDFE", color: "#534AB7", Icon: Image },
  csv: { label: "CSV", bg: "#EAF3DE", color: "#3B6D11", Icon: FileSpreadsheet },
  txt: { label: "TXT", bg: "#E6F1FB", color: "#185FA5", Icon: FileText },
};

export default function FileIcon({ ext }) {
  const cfg = EXT_CONFIG[ext] || EXT_CONFIG.txt;
  const { Icon } = cfg;
  return (
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        flexShrink: 0,
        background: cfg.bg,
        color: cfg.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={15} strokeWidth={2} />
    </span>
  );
}
