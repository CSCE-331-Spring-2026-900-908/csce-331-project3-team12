"use client";

import { useState } from "react";

type MenuItem = {
  name: string;
  price: number;
  category?: string;
};

type Props = {
  menu: MenuItem[];
  onSelectDrink: (item: MenuItem, suggestedToppings: string[]) => void;
};

export default function HelpMeChoose({ menu, onSelectDrink }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [result, setResult] = useState<MenuItem | null>(null);

  const questions = [
    {
      key: "flavor",
      question: "What flavor do you prefer?",
      options: ["Sweet", "Fruity", "Strong tea", "Coffee-like", "Not sure"],
    },
    {
      key: "sweetness",
      question: "Sweetness level?",
      options: ["Low sugar", "Medium", "Very sweet"],
    },
    {
      key: "toppings",
      question: "Do you want toppings?",
      options: ["Yes", "No"],
    },
  ];

  function handleAnswer(value: string) {
    const updated = { ...answers, [questions[step].key]: value };
    setAnswers(updated);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      generateRecommendation(updated);
    }
  }

  function pickRandom(list: MenuItem[]) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function generateRecommendation(ans: any) {
    let pool: MenuItem[] = [];

    // Flavor logic
    switch (ans.flavor) {
      case "Fruity":
        pool = menu.filter(m =>
          ["Fruit Tea"].includes(m.category || "") ||
          m.name.includes("Mango") ||
          m.name.includes("Strawberry") ||
          m.name.includes("Peach")
        );
        break;

      case "Strong tea":
        pool = menu.filter(m =>
          m.category === "Matcha" ||
          m.name.includes("Oolong") ||
          m.name.includes("Earl Grey")
        );
        break;

      case "Sweet":
        pool = menu.filter(m =>
          m.name.includes("Brown Sugar") ||
          m.name.includes("Taro") ||
          m.name.includes("Strawberry") ||
          m.name.includes("Wintermelon")
        );
        break;

      case "Coffee-like":
        pool = menu.filter(m =>
          m.name.includes("Coffee")
        );
        break;

      case "Not sure":
        pool = menu.filter(m =>
          m.name.includes("Brown Sugar") ||
          m.name.includes("Mango") ||
          m.name.includes("Taro")
        );
        break;
    }

    // 🎯 Sweetness adjustment
    if (ans.sweetness === "Low sugar") {
      pool = pool.filter(m =>
        !m.name.includes("Brown Sugar") &&
        !m.name.includes("Slush")
      );
    }

    if (ans.sweetness === "Very sweet") {
      const sweetBoost = menu.filter(m =>
        m.name.includes("Brown Sugar") ||
        m.name.includes("Taro") ||
        m.name.includes("Slush")
      );
      pool = [...pool, ...sweetBoost];
    }

    if (pool.length === 0) pool = menu;

    const chosen = pickRandom(pool);

    // 🧋 Topping suggestion
    let toppings: string[] = [];

    if (ans.toppings === "Yes") {
      if (ans.flavor === "Fruity") {
        toppings = ["mangoPopping"];
      } else if (ans.flavor === "Sweet") {
        toppings = ["tapiocaPearls"];
      } else {
        toppings = ["tapiocaPearls"];
      }
    }

    setResult(chosen);

    // 🔥 send back to kiosk
    onSelectDrink(chosen, toppings);
  }

  function reset() {
    setOpen(false);
    setStep(0);
    setAnswers({});
    setResult(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#7c3aed",
          color: "#fff",
          borderRadius: 999,
          padding: "16px 22px",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          zIndex: 50,
        }}
      >
        🧋 Help Me Choose
      </button>

      {open && (
        <div
          onClick={reset}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: 28,
              borderRadius: 20,
              width: 360,
              textAlign: "center",
            }}
          >
            {!result ? (
              <>
                <h2>{questions[step].question}</h2>

                {questions[step].options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid #ddd",
                      cursor: "pointer",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </>
            ) : (
              <>
                <h2>We recommend:</h2>
                <p style={{ fontWeight: 700 }}>{result.name}</p>
                <p style={{ color: "#16a34a" }}>
                  Opening customization…
                </p>

                <button onClick={reset} style={{ marginTop: 16 }}>
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}