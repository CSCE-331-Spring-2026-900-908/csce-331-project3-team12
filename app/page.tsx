"use client";

import { useRouter } from "next/navigation";

export default function Portal() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-center">
      
      <h1 className="text-3xl font-semibold mb-8 text-gray-800">
        Boba POS Portal
      </h1>

      <div className="flex flex-col gap-4 w-64">
        
        <button
          onClick={() => router.push("/manager")}
          className="bg-white p-3 rounded shadow hover:bg-gray-100 transition"
        >
          Manager View
        </button>

        <button
          onClick={() => router.push("/cashier")}
          className="bg-white p-3 rounded shadow hover:bg-gray-100 transition"
        >
          Cashier View
        </button>

        <button
          onClick={() => router.push("/customer")}
          className="bg-white p-3 rounded shadow hover:bg-gray-100 transition"
        >
          Customer Kiosk
        </button>

        <button
          onClick={() => router.push("/menu_board")}
          className="bg-black text-white p-3 rounded shadow hover:bg-gray-900 transition"
        >
          Menu Board
        </button>

        <button
          onClick={() => router.push("/kitchen")}
          className="bg-white p-3 rounded shadow hover:bg-gray-100 transition"
        >
          Kitchen Display
        </button>

      </div>
    </div>
  );
}
