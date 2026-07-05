import { useState } from "react";
import type { CreateReviewInput } from "../reviews.types";
import { createReview } from "../api/fetchReviews";

interface ReviewFormProps {
  productId: string;
  onCreated?: () => void;
}

export function ReviewForm({ productId, onCreated }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const input: CreateReviewInput = { rating, comment, authorName };

    try {
      await createReview(productId, input);
      setComment("");
      setAuthorName("");
      setRating(5);
      onCreated?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Nombre (opcional)
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
      </label>
      <label>
        Calificación
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label>
        Comentario
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Enviando…" : "Publicar reseña"}
      </button>
    </form>
  );
}
