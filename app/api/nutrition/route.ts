export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

type SizeLabel = "Small" | "Medium" | "Large";

const SIZE_MULTIPLIER: Record<SizeLabel, number> = {
  Small: 0.85,
  Medium: 1,
  Large: 1.2,
};

type NutrientMap = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
};

function normalizeDrinkQuery(input: string) {
  return input
    .replace(/\btea\b/gi, "")
    .replace(/\bmilk\b/gi, "")
    .replace(/\bslush\b/gi, "")
    .replace(/\bmatcha\b/gi, "matcha")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNutrients(food: any): NutrientMap {
  const defaults: NutrientMap = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0,
    fiber: 0,
    sodium: 0,
  };

  const nutrients = Array.isArray(food?.foodNutrients) ? food.foodNutrients : [];
  for (const n of nutrients) {
    const name = String(n.nutrientName ?? "").toLowerCase();
    const value = Number(n.value ?? 0);
    if (!Number.isFinite(value)) continue;
    if (name.includes("energy")) defaults.calories = value;
    if (name.includes("protein")) defaults.protein = value;
    if (name.includes("carbohydrate")) defaults.carbs = value;
    if (name.includes("total lipid") || name === "fat") defaults.fat = value;
    if (name.includes("sugars")) defaults.sugar = value;
    if (name.includes("fiber")) defaults.fiber = value;
    if (name.includes("sodium")) defaults.sodium = value;
  }
  return defaults;
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query")?.trim();
    const sizeParam = (req.nextUrl.searchParams.get("size") ?? "Medium") as SizeLabel;
    const size = sizeParam in SIZE_MULTIPLIER ? sizeParam : "Medium";

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
    const normalized = normalizeDrinkQuery(query) || query;
    const searchQuery = `${normalized} bubble tea`;

    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: searchQuery,
        pageSize: 1,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `USDA API error: ${text}` }, { status: 502 });
    }

    const data = await res.json();
    const food = data?.foods?.[0];
    if (!food) {
      return NextResponse.json({ found: false, query: searchQuery });
    }

    const mult = SIZE_MULTIPLIER[size];
    const base = extractNutrients(food);
    const nutrition = {
      calories: Math.round(base.calories * mult),
      protein: Number((base.protein * mult).toFixed(1)),
      carbs: Number((base.carbs * mult).toFixed(1)),
      fat: Number((base.fat * mult).toFixed(1)),
      sugar: Number((base.sugar * mult).toFixed(1)),
      fiber: Number((base.fiber * mult).toFixed(1)),
      sodium: Math.round(base.sodium * mult),
    };

    return NextResponse.json({
      found: true,
      source: "USDA FoodData Central",
      matchedFood: food.description,
      size,
      nutrition,
    });
  } catch (error) {
    console.error("[nutrition GET]", error);
    return NextResponse.json({ error: "Failed to fetch nutrition data" }, { status: 500 });
  }
}
