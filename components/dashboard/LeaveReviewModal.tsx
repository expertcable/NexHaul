"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Star, X, Loader2, CheckCircle2, ShieldCheck, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitRating } from "@/lib/actions/ratings";

interface LeaveReviewModalProps {
  loadId: string;
  truckerId: string;
  truckerName: string;
  corridor: string;
  existingRating?: {
    score: number;
    review?: string | null;
  } | null;
}

export function LeaveReviewModal({
  loadId,
  truckerId,
  truckerName,
  corridor,
  existingRating,
}: LeaveReviewModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [score, setScore] = useState<number>(existingRating?.score || 5);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [review, setReview] = useState(existingRating?.review || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await submitRating({
        loadId,
        truckerId,
        score,
        review,
      });

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-lg my-auto rounded-3xl border border-cyan-500/30 bg-[#0E131F] p-7 text-white shadow-2xl shadow-cyan-950/40 overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/15 p-2.5 text-cyan-400 border border-cyan-500/30 shadow-sm">
              <Star className="h-6 w-6 text-cyan-400 fill-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Rate Carrier Experience
              </h3>
              <p className="text-xs text-slate-400">
                {corridor} • <span className="text-cyan-400 font-semibold">{truckerName}</span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-9 w-9 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Modal Body */}
        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h4 className="text-xl font-bold text-white">Review Submitted!</h4>
            <p className="text-sm text-slate-400">Thank you for helping verify reliable carriers in the NexHaul network.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Star Rating Selector */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#07090E] border border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Overall Delivery Rating
              </span>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverScore !== null ? hoverScore : score) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setScore(star)}
                      onMouseEnter={() => setHoverScore(star)}
                      onMouseLeave={() => setHoverScore(null)}
                      className="p-1.5 focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          active
                            ? "text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                            : "text-slate-600 hover:text-slate-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-sm font-extrabold text-cyan-300">
                {score === 5 && "★★★★★ Exceptional (5/5)"}
                {score === 4 && "★★★★☆ Very Good (4/5)"}
                {score === 3 && "★★★☆☆ Average Service (3/5)"}
                {score === 2 && "★★☆☆☆ Below Expectations (2/5)"}
                {score === 1 && "★☆☆☆☆ Poor Experience (1/5)"}
              </span>
            </div>

            {/* Review Comment Textarea */}
            <div className="space-y-2">
              <label htmlFor="reviewText" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                <span>Written Feedback (Optional)</span>
              </label>
              <textarea
                id="reviewText"
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="e.g. Prompt pickup in Pune, pristine refrigeration maintenance, arrived 2 hours ahead of schedule in Kochi."
                className="w-full p-3.5 rounded-xl bg-[#07090E] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-600 shadow-inner resize-none"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="border-white/10 bg-[#07090E] hover:bg-white/5 text-slate-300 rounded-xl h-11 px-5 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Review...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 fill-white" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        className="h-8 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
      >
        <Star className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" />
        <span>{existingRating ? `Rated ★ ${existingRating.score}` : "Rate Carrier"}</span>
      </Button>

      {isOpen && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
