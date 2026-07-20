import { Injectable } from '@nestjs/common';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { SemanticSearchService } from '../search/semantic-search.service';
import type { AssistantChatDto } from './dto/chat.dto';

@Injectable()
export class AssistantService {
  constructor(private readonly search: SemanticSearchService) {}

  async chat(dto: AssistantChatDto) {
    const { items, mode } = await this.search.search(dto.message, 6);
    const reply = await this.generateReply(dto.message, items, dto.history ?? []);

    return {
      reply,
      products: items,
      searchMode: mode,
    };
  }

  private async generateReply(
    message: string,
    products: BuyerProductListItemDTO[],
    history: AssistantChatDto['history'],
  ): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const productContext = products
      .map(
        (p, i) =>
          `${i + 1}. ${p.title} � $${p.price.toFixed(2)}${p.isMarketNestOfficial ? ' (MarketNest Official)' : ''}`,
      )
      .join('\n');

    if (!apiKey) {
      if (!products.length) {
        return 'I could not find matching products. Try different keywords or browse the shop home.';
      }
      return `Here are products that may match "${message}":\n\n${productContext}\n\nOpen any product to learn more. Seller details are never shown on MarketNest.`;
    }

    const system = `You are MarketNest shopping assistant for buyers. Recommend products from the list only. Never mention sellers, stores, or seller contact. Keep replies under 120 words. If no products match, suggest browsing categories.`;

    const userContent = `Customer: ${message}\n\nMatching products:\n${productContext || '(none)'}`;

    const messages = [
      { role: 'system' as const, content: system },
      ...(history ?? []).slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userContent },
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 220,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Assistant LLM failed: ${err}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0]?.message?.content?.trim() ?? 'Sorry, I could not generate a response.';
  }
}
