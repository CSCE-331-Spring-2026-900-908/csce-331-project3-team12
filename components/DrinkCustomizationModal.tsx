// components/DrinkCustomizationModal.tsx
"use client";

import { useState, useEffect } from "react";

interface OrderItem {
  name: string;
  size: string;
  sugar: string;
  ice: string;
  toppings: string[];
  price: number;
  quantity: number;
}

interface DrinkCustomizationModalProps {
  flavor: string;
  onClose: () => void;
  onAddToCart: (order: OrderItem) => void;
}

const SIZE_OPTIONS = [
  { label: "Small ($4.67)", value: "Small", price: 4.67 },
  { label: "Medium ($5.50)", value: "Medium", price: 5.50 },
  { label: "Large ($6.32)", value: "Large", price: 6.32 },
];

const ICE_OPTIONS = ["No Ice", "Less Ice", "Regular", "Extra Ice"];
const SUGAR_OPTIONS = ["0%", "25%", "50%", "75%", "100%", "125%"];

const BASE_RECIPE_ML = {
  teaBase: 120,
  milkOrFruitMix: 80,
  sweetener: 20,
  ice: 120,
};

const SIZE_RECIPE_MULTIPLIER: Record<string, number> = {
  Small: 0.85,
  Medium: 1,
  Large: 1.2,
};

function recipeForSize(size: string) {
  const factor = SIZE_RECIPE_MULTIPLIER[size] ?? 1;
  return {
    teaBase: Math.round(BASE_RECIPE_ML.teaBase * factor),
    milkOrFruitMix: Math.round(BASE_RECIPE_ML.milkOrFruitMix * factor),
    sweetener: Math.round(BASE_RECIPE_ML.sweetener * factor),
    ice: Math.round(BASE_RECIPE_ML.ice * factor),
  };
}

export default function DrinkCustomizationModal({
  flavor,
  onClose,
  onAddToCart,
}: DrinkCustomizationModalProps) {
  const [size, setSize] = useState("Small");
  const [ice, setIce] = useState("Regular");
  const [sugar, setSugar] = useState("100%");
  const [toppings, setToppings] = useState<string[]>([]);
  const [availableToppings, setAvailableToppings] = useState<string[]>([]);
  const [total, setTotal] = useState(4.67);
  const [quantity, setQuantity] = useState(1);
  const currentRecipe = recipeForSize(size);

  useEffect(() => {
    // fetch toppings from API
    fetch("/api/toppings")
      .then((res) => res.json())
      .then((data: { ingredientname: string }[]) => {
  const names = data.map((d) => d.ingredientname);
  setAvailableToppings(names);
})
      .catch(() => setAvailableToppings(["Boba Pearls", "Grass Jelly", "Pudding"]));
  }, []);

  useEffect(() => {
    let price = SIZE_OPTIONS.find((s) => s.value === size)?.price || 4.67;
    price += toppings.length * 0.5; // $0.50 per topping
    setTotal(price);
  }, [size, toppings]);

  const toggleTopping = (topping: string) => {
    if (toppings.includes(topping)) {
      setToppings(toppings.filter((t) => t !== topping));
    } else {
      setToppings([...toppings, topping]);
    }
  };

  const handleAdd = () => {
    onAddToCart({
      name: flavor,
      size,
      sugar,
      ice,
      toppings,
      price: total,
      quantity,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-[90%] max-w-3xl max-h-[90%] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Customize {flavor}</h2>

        {/* Size */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Size</h3>
          <div className="flex gap-2">
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSize(s.value)}
                className={`px-4 py-2 rounded ${
                  size === s.value ? "bg-orange-400 text-white" : "bg-yellow-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ice */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Ice</h3>
          <div className="flex gap-2 flex-wrap">
            {ICE_OPTIONS.map((i) => (
              <button
                key={i}
                onClick={() => setIce(i)}
                className={`px-4 py-2 rounded ${
                  ice === i ? "bg-orange-400 text-white" : "bg-yellow-300"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Sugar */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Sugar</h3>
          <div className="flex gap-2 flex-wrap">
            {SUGAR_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSugar(s)}
                className={`px-4 py-2 rounded ${
                  sugar === s ? "bg-orange-400 text-white" : "bg-yellow-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Toppings */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Toppings</h3>
          <div className="flex gap-2 flex-wrap">
           {availableToppings.map((t, i) => (
  <button
    key={`${t}-${i}`}
                onClick={() => toggleTopping(t)}
                className={`px-4 py-2 rounded ${
                  toppings.includes(t) ? "bg-orange-400 text-white" : "bg-yellow-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="mb-4 font-bold text-xl">Total: ${total.toFixed(2)}</div>

        {/* Recipe guidance by selected cup size */}
        <div className="mb-5 rounded-md border border-purple-200 bg-purple-50 p-4">
          <h3 className="mb-2 font-semibold text-purple-900">Recipe for {size} cup</h3>
          <div className="grid gap-1 text-sm text-purple-800">
            <div>Tea base: {currentRecipe.teaBase} ml</div>
            <div>Milk/Fruit mix: {currentRecipe.milkOrFruitMix} ml</div>
            <div>Sweetener: {currentRecipe.sweetener} ml</div>
            <div>Ice: {currentRecipe.ice} ml</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded bg-orange-400 text-white"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}