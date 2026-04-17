"use client";

import { useEffect, useState } from "react";
import DrinkCustomizationModal from "../../components/DrinkCustomizationModal";

// Menu item type
interface MenuItem {
  name: string;
  price: number;
}

// Categories
const categories = ["Milk Tea", "Fruit Tea", "Matcha", "Slush"];

export default function HomePage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  interface OrderItem {
    name: string;
    size: string;
    sugar: string;
    ice: string;
    toppings: string[];
    price: number;
    quantity: number;
  }
  const [orderList, setOrderList] = useState<OrderItem[]>([]); 
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null); // for modal

  // Fetch menu from API
  useEffect(() => {
    async function fetchMenu() {
      const res = await fetch("/api/menu");
      const data: MenuItem[] = await res.json();
      setMenu(data);
    }
    fetchMenu();
  }, []);

  const filteredMenu = menu.filter((item) =>
    item.name.toLowerCase().includes(activeCategory.toLowerCase().split(" ")[0])
  );

  function handleAddToOrder(order: OrderItem) {
    setOrderList((prev) => [...prev, order]);
  }

  function removeFromOrder(index: number) {
    setOrderList((prev) => prev.filter((_, i) => i !== index));
  }
  
  function increaseQty(index: number) {
    setOrderList(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function decreaseQty(index: number) {
    setOrderList(prev =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  }

  const subtotal = orderList.reduce((sum, item) => sum + (item.price*item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Left: Menu */}
      <div style={{ flex: 1, padding: 20, background: "#f4f4f4" }}>
        {/* Category tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "10px 20px",
                background: activeCategory === cat ? "#fde067" : "#d1d1d1",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 150px)", gap: 15 }}>
          {filteredMenu.map((item) => (
            <button
              key={item.name}
              onClick={() => setSelectedDrink(item.name)} // open customization modal
              style={{
                height: 120,
                padding: 10,
                borderRadius: 16,
                border: "1px solid #d1d1d1",
                background: "#fde067",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                fontWeight: "bold",
              }}
            >
              {item.name}
              <span style={{ fontWeight: "normal", marginTop: 5 }}>${item.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Order Panel */}
      <div
        style={{
          width: 320,
          padding: 20,
          background: "#fde067",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2>Current Order ({orderList.length} items)</h2>
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 20 }}>
          {orderList.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fff",
                padding: 8,
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: "bold" }}>
                  {item.name} × {item.quantity}
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {item.size} · {item.sugar} sugar · {item.ice}
                </div>

                {item.toppings.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {item.toppings.map((t, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: "#777" }}>
                        • {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => decreaseQty(i)}>➖</button>
                <button onClick={() => increaseQty(i)}>➕</button>
                <button onClick={() => removeFromOrder(i)}>❌</button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ marginBottom: 20 }}>
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>Tax (8%): ${tax.toFixed(2)}</p>
          <p style={{ fontWeight: "bold", fontSize: 18 }}>Total: ${total.toFixed(2)}</p>
        </div>

        <button
  onClick={async () => {
    if (orderList.length === 0) return alert("No items in order.");
    try {
      const res = await fetch("/api/submitOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderList }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      alert(`Order submitted! Order ID: ${data.orderID}, Total: $${data.total.toFixed(2)}`);
      setOrderList([]);
    } catch (err) {
      console.error(err);
      alert("Failed to submit order: " + err);
    }
  }}
  style={{
    padding: 12,
    background: "#7b3ff2",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    cursor: "pointer",
  }}
>
  Complete Order
</button>
      </div>

      {/* Drink Customization Modal */}
      {selectedDrink && (
        <DrinkCustomizationModal
          flavor={selectedDrink}
          onClose={() => setSelectedDrink(null)}
          onAddToCart={handleAddToOrder}
        />
      )}
    </div>
  );
}