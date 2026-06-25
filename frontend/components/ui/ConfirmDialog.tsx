'use client';
import { AlertTriangle } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full"
        style={{ maxWidth: '420px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 44,
                height: 44,
                backgroundColor: danger ? '#FEE2E2' : '#FEF3C7',
              }}
            >
              <AlertTriangle
                size={20}
                color={danger ? '#DC2626' : '#D97706'}
              />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              {title}
            </h3>
          </div>

          {/* Message */}
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
            {message}
          </p>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              style={{
                padding: '8px 18px',
                fontSize: 14,
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: '8px 18px',
                fontSize: 14,
                borderRadius: 8,
                border: 'none',
                background: danger ? '#DC2626' : '#D97706',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}