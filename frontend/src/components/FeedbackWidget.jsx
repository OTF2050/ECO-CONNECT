import React, { useState } from 'react';
import { API_BASE } from '../config';

/**
 * FeedbackWidget — Star-rating + comment feedback form.
 *
 * Ported from MOE CO-POILT's FeedbackWidget pattern.
 * Displayed after a completed booking or request action.
 *
 * Props:
 *   referenceId  – booking/tour/request ID to attach feedback to
 *   referenceType – 'booking' | 'tour' | 'request'
 *   userName?   – pre-fill name field
 *   onDone?     – called when user submits (or skips)
 */
export default function FeedbackWidget({ referenceId, referenceType = 'booking', userName = '', onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState(userName);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    if (rating < 1) { setError('Please select a star rating.'); return; }
    if (!name.trim()) { setError('Please enter your name.'); return; }
    setSubmitting(true);
    try {
      // POST to the feedback endpoint — backend will persist it
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference_id: referenceId,
          reference_type: referenceType,
          name: name.trim(),
          rating,
          comment: comment.trim(),
        }),
      });
      if (!res.ok) throw new Error('Could not submit feedback');
      setSubmitted(true);
      if (onDone) setTimeout(onDone, 2500);
    } catch (e) {
      setError(e.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '24px 20px',
        background: 'rgba(4,120,87,0.07)',
        border: '1px solid rgba(4,120,87,0.25)',
        borderRadius: 14,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(4,120,87,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div style={{ fontWeight: 700, color: '#047857', fontSize: 14 }}>Thank you for your feedback!</div>
        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Your rating helps us improve Eco Connect.</div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e6e1d4',
      borderRadius: 14, padding: '18px 20px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 10px 26px rgba(28,40,35,0.07)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Rate your experience
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14, lineHeight: 1.5 }}>
        Your feedback helps us improve the Eco Connect service.
      </p>

      {/* Star row */}
      <div
        role="radiogroup"
        aria-label="Star rating"
        style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center' }}
      >
        {[1, 2, 3, 4, 5].map(n => (
          <span
            key={n}
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{
              fontSize: 26, cursor: 'pointer',
              color: (hover || rating) >= n ? '#d97706' : '#d6cdb8',
              transition: 'color 0.15s, transform 0.1s',
              transform: (hover || rating) >= n ? 'scale(1.15)' : 'scale(1)',
              userSelect: 'none',
            }}
          >
            ★
          </span>
        ))}
        {rating > 0 && (
          <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 4 }}>{rating}/5</span>
        )}
      </div>

      {/* Name */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10.5, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>
          Your Name
        </label>
        <input
          type="text"
          value={name}
          maxLength={120}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#faf8f2',
            border: '1px solid #e6e1d4',
            borderRadius: 9, padding: '8px 11px',
            fontSize: 12, color: '#16241f', outline: 'none',
          }}
        />
      </div>

      {/* Comment */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10.5, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>
          Comments (optional)
        </label>
        <textarea
          rows={3}
          maxLength={2000}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tell us about your experience…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#faf8f2',
            border: '1px solid #e6e1d4',
            borderRadius: 9, padding: '8px 11px',
            fontSize: 12, color: '#16241f', outline: 'none',
            resize: 'vertical', fontFamily: 'inherit',
          }}
        />
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: 11.5, marginBottom: 10 }}>⚠ {error}</p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={submit}
          disabled={submitting}
          style={{
            flex: 1,
            background: '#0f7a54',
            border: 'none', borderRadius: 10,
            padding: '10px 0', fontSize: 12, fontWeight: 700,
            color: '#fff', cursor: 'pointer',
            opacity: submitting ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </button>
        {onDone && (
          <button
            onClick={onDone}
            style={{
              padding: '10px 14px', fontSize: 11.5,
              background: '#ece8dd',
              border: '1px solid #e6e1d4',
              borderRadius: 10, color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
