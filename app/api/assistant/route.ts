export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, menu, toppings } = await req.json();

  const menuText = (menu as { name: string; price: number }[])
    .map(item => `- ${item.name}: $${item.price.toFixed(2)}`)
    .join('\n');

  const toppingList = (toppings as string[]).length
    ? (toppings as string[]).join(', ')
    : 'none';

  const systemPrompt = `You are a friendly boba tea shop assistant named Boba Bot. Help customers with menu questions, recommendations, and adding items to their order.

Available drinks (use exact names):
${menuText}

Available toppings (use exact names): ${toppingList}

Sizes (use exact keys): sizeSmall (+$0.00), sizeMedium (+$0.50), sizeLarge (+$1.00)
Sugar levels (use exact values): 0%, 25%, 50%, 75%, 100%
Ice levels (use exact keys): iceNoIce, iceLess, iceRegular, iceExtra

ALWAYS respond with valid JSON in this exact format:
{
  "reply": "<your friendly response>",
  "action": null
}

OR when adding an item to cart:
{
  "reply": "<confirm what you added, mention size/sugar/ice>",
  "action": {
    "type": "add_to_cart",
    "item": {
      "name": "<exact drink name from menu>",
      "size": "<size key>",
      "sugar": "<sugar value>",
      "ice": "<ice key>",
      "toppings": ["<exact topping name>"]
    }
  }
}

Rules:
- If size/sugar/ice not specified, default to sizeMedium, 75%, iceRegular
- Only add toppings the customer explicitly requests
- Only use drink names that exist in the menu above
- Keep replies short and friendly (2 sentences max)`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(messages as { role: 'user' | 'assistant'; content: string }[]),
      ],
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content
      ?? '{"reply":"Sorry, something went wrong.","action":null}';
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      reply:  parsed.reply  ?? "Sorry, I couldn't process that.",
      action: parsed.action ?? null,
    });
  } catch (e) {
    console.error('[assistant]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
