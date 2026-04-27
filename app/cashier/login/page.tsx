"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CashierAuthSession = {
  sessionId: number;
  employeeId: number;
  name: string;
  loginTime: string;
};

const keypadValues = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Back"];

export default function CashierLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const maskedPin = useMemo(() => pin.replace(/./g, "•"), [pin]);

  function onKeyPress(value: string) {
    if (loading) return;

    if (value === "Clear") {
      setPin("");
      setError("");
      return;
    }

    if (value === "Back") {
      setPin((prev) => prev.slice(0, -1));
      setError("");
      return;
    }

    if (pin.length >= 10) return;
    setPin((prev) => prev + value);
    setError("");
  }

  async function handleLogin() {
    if (!pin) {
      setError("Enter a PIN to continue.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/cashier-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }

      const session: CashierAuthSession = {
        sessionId: Number(data.sessionId),
        employeeId: Number(data.employee.employeeId),
        name: String(data.employee.name),
        loginTime: String(data.loginTime),
      };

      localStorage.setItem("cashierAuth", JSON.stringify(session));
      router.push("/cashier");
    } catch {
      setError("Unable to login right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(130deg, #fff7ed 0%, #ffedd5 45%, #ffe4e6 100%)",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          borderRadius: 22,
          padding: 22,
          background: "#ffffff",
          boxShadow: "0 20px 45px rgba(180, 83, 9, 0.16)",
          border: "1px solid #fed7aa",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 30, color: "#9a3412", fontWeight: 800, textAlign: "center" }}>
          Cashier Login
        </h1>
        <p style={{ marginTop: 8, marginBottom: 18, textAlign: "center", color: "#78716c", fontSize: 15 }}>
          Enter your employee PIN on the touch keypad.
        </p>

        <div
          style={{
            minHeight: 70,
            borderRadius: 14,
            border: "2px solid #fdba74",
            background: "#fff7ed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            letterSpacing: 3,
            fontWeight: 700,
            color: "#7c2d12",
            marginBottom: 14,
            userSelect: "none",
          }}
        >
          {maskedPin || "_ _ _ _"}
        </div>

        {error && (
          <div style={{ marginBottom: 12, color: "#b91c1c", fontWeight: 600, textAlign: "center" }}>{error}</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {keypadValues.map((value) => (
            <button
              key={value}
              onClick={() => onKeyPress(value)}
              disabled={loading}
              style={{
                minHeight: 78,
                borderRadius: 14,
                border: "1px solid #fdba74",
                background: value === "Clear" ? "#fecaca" : value === "Back" ? "#dbeafe" : "#ffedd5",
                color: "#111827",
                fontSize: value.length > 1 ? 22 : 32,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {value === "Back" ? "⌫" : value}
            </button>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            marginTop: 14,
            width: "100%",
            minHeight: 64,
            borderRadius: 14,
            border: "none",
            background: loading ? "#cbd5e1" : "#ea580c",
            color: "white",
            fontSize: 24,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <button
          onClick={() => router.push("/")}
          disabled={loading}
          style={{
            marginTop: 10,
            width: "100%",
            minHeight: 48,
            borderRadius: 12,
            border: "1px solid #fdba74",
            background: "#fff",
            color: "#7c2d12",
            fontSize: 18,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Back to Portal
        </button>
      </div>
    </div>
  );
}
