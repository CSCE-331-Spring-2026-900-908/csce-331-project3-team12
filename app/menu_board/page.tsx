"use client";

import Link from "next/link";

export default function MenuBoard() {
  return (
    <div style={{ width: "100%", height: "100vh", padding: 0, margin: 0, position: "relative" }}>
      <Link
        href="/"
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 10,
          background: "#ffffff",
          color: "#111827",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          padding: "8px 12px",
          textDecoration: "none",
          fontWeight: 600,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        Back to Portal
      </Link>
      <iframe
        src="/bobba_shop_menu.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          margin: 0,
          padding: 0,
        }}
        title="Bobba Shop Menu"
      />
    </div>
  );
}