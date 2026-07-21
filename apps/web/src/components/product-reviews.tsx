'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface ReviewData {
  averageRating: number | null;
  reviewCount: number;
  distribution: Record<number, number>;
  items: { id: string; rating: number; body: string | null; buyerName: string; createdAt: string }[];
}

export function ProductReviews({ productId }: { productId: string }) {
  const { token, user } = useAuth();
  // POST /reviews is buyer-only. Showing the form to anyone else guarantees a
  // rejected submission, so only customers get it.
  const canReview = Boolean(token) && user?.role === 'buyer';
  const [data, setData] = useState<ReviewData | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<ReviewData>(`/reviews/product/${productId}`).then(setData).catch(() => setData(null));
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setMessage('Sign in to leave a review after your order is delivered.');
      return;
    }
    try {
      await apiFetch('/reviews', {
        method: 'POST',
        token,
        body: JSON.stringify({ productId, rating, body: body || undefined }),
      });
      setBody('');
      setMessage('Thank you for your review.');
      load();
    } catch {
      setMessage('You can review this product after a delivered order.');
    }
  }

  if (!data) return null;

  return (
    <section className="mt-12">
      <h2 className="font-outfit text-lg font-bold mb-4">Reviews</h2>
      {data.averageRating != null && (
        <p className="text-sm mb-4">
          <span className="text-amber font-bold text-lg">{data.averageRating}</span>
          <span className="text-gray"> / 5 - {data.reviewCount} reviews</span>
        </p>
      )}
      {canReview && (
      <form onSubmit={submitReview} className="card p-4 mb-6 space-y-3">
        <p className="text-sm font-semibold">Write a review</p>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="input max-w-[120px]"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} stars
            </option>
          ))}
        </select>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Optional comment"
          className="input min-h-[80px]"
        />
        <button type="submit" className="btn btn-blue btn-sm">
          Submit review
        </button>
        {message && <p className="text-xs text-gray">{message}</p>}
      </form>
      )}
      <div className="space-y-3">
        {data.items.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold">{r.buyerName}</span>
              <span className="text-amber">{'*'.repeat(r.rating)}</span>
            </div>
            {r.body && <p className="text-sm text-gray">{r.body}</p>}
          </div>
        ))}
        {data.items.length === 0 && (
          <p className="text-sm text-gray">No reviews yet. Be the first after delivery.</p>
        )}
      </div>
    </section>
  );
}
