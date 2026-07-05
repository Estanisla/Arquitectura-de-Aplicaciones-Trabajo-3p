import { useEffect, useState } from "react";
import type { Review } from "../reviews.types";
import { fetchReviews } from "../api/fetchReviews";

interface ReviewListProps {
  productId: string;
}

export function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchReviews(productId)
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) return <p>Cargando reseñas…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (reviews.length === 0) return <p>Aún no hay reseñas para este producto.</p>;

  return (
    <ul>
      {reviews.map((review) => (
        <li key={review.id}>
          <strong>{review.authorName ?? "Anónimo"}</strong> — {review.rating}/5
          <p>{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}
