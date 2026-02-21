import { useRef } from 'react';

// ─── Star-rating sub-component ────────────────────────────────────────────────
function StarRating({ value, onChange, disabled }) {
  const labels = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Critical'];

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">
        Severity rating <span className="text-[#1e3b8a] font-semibold">*</span>
      </span>
      <div className="flex gap-1" role="radiogroup" aria-label="Severity rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} – ${labels[star]}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            className={[
              'group flex flex-col items-center gap-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b8a]',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            ].join(' ')}
          >
            <span
              className={[
                'material-symbols-outlined text-2xl transition-colors',
                value >= star ? 'text-amber-400' : 'text-gray-300',
                !disabled && value < star ? 'group-hover:text-amber-300' : '',
              ].join(' ')}
              aria-hidden="true"
            >
              star
            </span>
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs text-gray-500">{labels[value]}</p>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
/**
 * VerifyModal — lets an authenticated user verify an issue.
 *
 * Props:
 *  onClose   () => void
 *  onSubmit  () => void  (async, managed by useIssueFeed)
 *  form      { comment: string, rating: number, image: File|null }
 *  setForm   (updater) => void
 *  loading   boolean
 *  error     string
 */
export default function VerifyModal({
  onClose,
  onSubmit,
  form,
  setForm,
  loading = false,
  error   = '',
}) {
  const fileRef = useRef(null);

  const MAX_COMMENT = 1000;
  const remaining   = MAX_COMMENT - (form?.comment?.length ?? 0);

  function handleCommentChange(e) {
    const val = e.target.value.slice(0, MAX_COMMENT);
    setForm((prev) => ({ ...prev, comment: val }));
  }

  function handleRatingChange(rating) {
    setForm((prev) => ({ ...prev, rating }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, image: file }));
    // Reset input so the same file can be re-selected after clearing
    e.target.value = '';
  }

  function clearImage() {
    setForm((prev) => ({ ...prev, image: null }));
  }

  const canSubmit = !loading && form?.comment?.trim().length > 0;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
      aria-hidden="true"
    >
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-modal-title"
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1e3b8a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">verified</span>
            <h2 id="verify-modal-title" className="text-base font-semibold">
              Verify this Issue
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close verification dialog"
            onClick={onClose}
            disabled={loading}
            className="text-blue-200 hover:text-white transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {/* Star rating */}
          <StarRating
            value={form?.rating ?? 3}
            onChange={handleRatingChange}
            disabled={loading}
          />

          {/* Comment */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="verify-comment"
              className="text-sm font-medium text-gray-700"
            >
              Verification comment{' '}
              <span className="text-[#1e3b8a] font-semibold">*</span>
            </label>
            <textarea
              id="verify-comment"
              rows={4}
              value={form?.comment ?? ''}
              onChange={handleCommentChange}
              disabled={loading}
              placeholder="Describe what you observed at the location…"
              className={[
                'w-full rounded-lg border px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-[#1e3b8a] resize-none',
                'disabled:bg-gray-50 disabled:cursor-not-allowed',
                form?.comment?.trim().length === 0 && error ? 'border-red-400' : 'border-gray-300',
              ].join(' ')}
              aria-required="true"
              aria-describedby="comment-chars"
            />
            <p
              id="comment-chars"
              className={[
                'text-xs text-right',
                remaining < 50 ? 'text-orange-500' : 'text-gray-400',
              ].join(' ')}
            >
              {remaining} characters remaining
            </p>
          </div>

          {/* Optional image */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              Photo evidence{' '}
              <span className="text-xs font-normal text-gray-400">(optional)</span>
            </span>

            {form?.image ? (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <span
                  className="material-symbols-outlined text-lg text-[#1e3b8a]"
                  aria-hidden="true"
                >
                  image
                </span>
                <span className="flex-1 truncate text-sm text-gray-700">
                  {form.image.name}
                </span>
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={clearImage}
                  disabled={loading}
                  className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    cancel
                  </span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className={[
                  'flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300',
                  'px-4 py-3 text-sm text-gray-500 hover:border-[#1e3b8a] hover:text-[#1e3b8a]',
                  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b8a]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                ].join(' ')}
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  add_photo_alternate
                </span>
                Attach a photo
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                error
              </span>
              {error}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={[
              'rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700',
              'hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b8a]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={[
              'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white',
              'bg-[#1e3b8a] hover:bg-[#162d6e] transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3b8a]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            {loading ? (
              <>
                <span
                  className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                  aria-hidden="true"
                />
                Submitting…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  verified
                </span>
                Submit Verification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
