'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types/buyer';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function ShopAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [products, setProducts] = useState<BuyerProductListItemDTO[]>([]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await apiFetch<{
        reply: string;
        products: BuyerProductListItemDTO[];
      }>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(-8),
        }),
      });
      setMessages([...nextMessages, { role: 'assistant', content: res.reply }]);
      setProducts(res.products);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: 'Sorry, the assistant is unavailable. Try search instead.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 btn btn-primary shadow-lg px-5 py-3"
        aria-label="Open shopping assistant"
      >
        AI Shop
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(100vw-2rem,380px)] card shadow-xl flex flex-col max-h-[70vh]">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-outfit font-bold text-sm">Shopping assistant</h2>
            <button type="button" className="text-sm text-mn-mid hover:text-mn-ink" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.length === 0 && (
              <p className="text-gray">
                Ask for product ideas — e.g. &quot;wireless earbuds under $50&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? 'text-right' : ''}
              >
                <span
                  className={`inline-block px-3 py-2 rounded-lg max-w-[90%] whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-blue-light' : 'bg-gray-light'
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {products.length > 0 && (
              <ul className="space-y-2 pt-2 border-t">
                {products.map((p) => (
                  <li key={p.id}>
                    <Link href={`/shop/products/${p.id}`} className="text-blue font-medium hover:underline">
                      {p.title}
                    </Link>
                    <span className="text-gray"> — ${p.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <form onSubmit={send} className="p-3 border-t flex gap-2">
            <input
              className="input flex-1 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={loading}
            />
            <button type="submit" className="btn btn-blue btn-sm" disabled={loading}>
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
