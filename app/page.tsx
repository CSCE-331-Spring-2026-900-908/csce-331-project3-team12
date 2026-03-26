"use client";

import { useRouter } from "next/navigation";

export default function Portal() {
  const router = useRouter();

  const views = [
    { name: "Manager", path: "/manager", icon: "📊", desc: "Manage store data" },
    { name: "Cashier", path: "/cashier", icon: "💳", desc: "Process orders" },
    { name: "Customer", path: "/customer", icon: "🧋", desc: "Self-order kiosk" },
    { name: "Menu Board", path: "/menu-board", icon: "📺", desc: "Display menu" },
    { name: "Kitchen", path: "/kitchen", icon: "👨‍🍳", desc: "Track orders" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-100 flex flex-col items-center justify-center">
      
      <h1 className="text-4xl font-bold mb-10 text-gray-800">
        Boba POS Portal
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4">
        {views.map((view) => (
          <div
            key={view.name}
            onClick={() => router.push(view.path)}
            className="cursor-pointer bg-white rounded-2xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <div className="text-3xl mb-2">{view.icon}</div>
            <h2 className="text-xl font-semibold">{view.name}</h2>
            <p className="text-gray-500">{view.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}