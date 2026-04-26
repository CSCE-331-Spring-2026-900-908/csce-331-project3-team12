type SizeLabel = "small" | "medium" | "large";

export interface InventoryOrderItem {
  name: string;
  size: string;
  toppings?: string[];
  quantity?: number;
}

const SIZE_MULTIPLIER: Record<SizeLabel, number> = {
  small: 0.85,
  medium: 1,
  large: 1.2,
};

const TOPPING_UNITS_PER_SIZE: Record<SizeLabel, number> = {
  small: 1,
  medium: 2,
  large: 3,
};

function normalizeSize(size: string): SizeLabel {
  const value = size.toLowerCase();
  if (value.includes("small")) return "small";
  if (value.includes("large")) return "large";
  return "medium";
}

function addUsage(usage: Record<string, number>, ingredient: string, amount: number) {
  usage[ingredient] = (usage[ingredient] ?? 0) + amount;
}

function addScaledUsage(
  usage: Record<string, number>,
  ingredient: string,
  baseAmount: number,
  scale: number,
  quantity: number
) {
  addUsage(usage, ingredient, Math.round(baseAmount * scale * quantity));
}

function maybeIncludeFlavorIngredient(drinkName: string, usage: Record<string, number>, scale: number, qty: number) {
  const name = drinkName.toLowerCase();
  if (name.includes("green")) addScaledUsage(usage, "greenTea", 45, scale, qty);
  if (name.includes("black")) addScaledUsage(usage, "blackTea", 45, scale, qty);
  if (name.includes("oolong")) addScaledUsage(usage, "oolongTea", 45, scale, qty);
  if (name.includes("earl grey")) addScaledUsage(usage, "earlGreyTea", 45, scale, qty);
  if (name.includes("matcha")) addScaledUsage(usage, "matcha", 25, scale, qty);
  if (name.includes("taro")) addScaledUsage(usage, "taro", 25, scale, qty);
  if (name.includes("coffee")) addScaledUsage(usage, "coffee", 20, scale, qty);
  if (name.includes("thai")) addScaledUsage(usage, "thai", 25, scale, qty);
  if (name.includes("strawberry")) addScaledUsage(usage, "strawberry", 20, scale, qty);
  if (name.includes("mango")) addScaledUsage(usage, "mango", 20, scale, qty);
  if (name.includes("passion")) addScaledUsage(usage, "passionfruit", 20, scale, qty);
  if (name.includes("peach")) addScaledUsage(usage, "peach", 20, scale, qty);
  if (name.includes("caramel")) addScaledUsage(usage, "caramel", 20, scale, qty);
  if (name.includes("wintermelon")) addScaledUsage(usage, "wintermelon", 20, scale, qty);
  if (name.includes("brown sugar")) addScaledUsage(usage, "sugar", 18, scale, qty);
  if (name.includes("oreo")) addScaledUsage(usage, "oreoCrumbs", 12, scale, qty);
}

export function computeInventoryUsage(items: InventoryOrderItem[]): Record<string, number> {
  const usage: Record<string, number> = {};

  for (const item of items) {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const size = normalizeSize(item.size);
    const scale = SIZE_MULTIPLIER[size];
    const drinkName = item.name ?? "";

    // Every drink consumes a cup + straw.
    addUsage(usage, size === "small" ? "smallCup" : size === "large" ? "largeCup" : "mediumCup", qty);
    addUsage(usage, size === "large" ? "strawLarge" : "strawRegular", qty);

    // Core base materials for most drinks.
    addScaledUsage(usage, "sugar", 12, scale, qty);
    addScaledUsage(usage, "milk", 35, scale, qty);

    maybeIncludeFlavorIngredient(drinkName, usage, scale, qty);

    if (drinkName.toLowerCase().includes("slush")) {
      addScaledUsage(usage, "milk", 10, scale, qty);
    }

    if (drinkName.toLowerCase().includes("pearl")) {
      addScaledUsage(usage, "tapiocaPearls", 18, scale, qty);
    }

    for (const topping of item.toppings ?? []) {
      addUsage(usage, topping, TOPPING_UNITS_PER_SIZE[size] * qty);
    }
  }

  return usage;
}
