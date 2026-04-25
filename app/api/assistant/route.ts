export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, menu, toppings } = await req.json();

  const menuText = (menu as { name: string; price: number }[])
    .map(item => `- ${item.name}: $${item.price.toFixed(2)}`)
    .join('\n');

  const toppingText = (toppings as string[]).length
    ? (toppings as string[]).map((t: string) => `- ${t} (+$0.50)`).join('\n')
    : 'None available';

  const systemPrompt = `You are a friendly boba tea shop assistant named Boba Bot. Help customers with menu questions, recommendations, and ordering guidance.

Available drinks:
${menuText}

Available toppings (add-ons):
${toppingText}

Sizes: Small, Medium (+$0.50), Large (+$1.00)
Sugar levels: 0%, 25%, 50%, 75%, 100%
Ice levels: No Ice, Less Ice, Regular Ice, Extra Ice

Keep responses short and friendly (2-3 sentences max). If a customer wants to order something, tell them to tap the item on the menu to customize it.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(messages as { role: 'user' | 'assistant'; content: string }[]),
      ],
      max_tokens: 150,
    });

    const reply = completion.choices[0].message.content ?? "Sorry, I couldn't process that.";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error('[assistant]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
