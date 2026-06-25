'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  reasonRequired?: boolean;
  confirmLabel: string;
  confirmColor?: 'red' | 'amber' | 'indigo';
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function ReasonModal({
  title, description, reasonRequired = true, confirmLabel,
  confirmColor = 'red', onConfirm, onCancel,
}: Props) {
  const [reason, setReason] = useState('');
  const [error,  setError]  = useState('');

  const colors = {
    red:    'bg-red-600 hover:bg-red-700',
    amber:  'bg-amber-600 hover:bg-amber-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
  };

  const handleConfirm = () => {
    if (reasonRequired && !reason.trim()) {
      setError('A reason is required.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-500 mb-4">{description}</p>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Reason {reasonRequired && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={reason}
            onChange={e => { setReason(e.target.value); setError(''); }}
            rows={3}
            placeholder="Explain why..."
            className={`w-full text-sm border rounded-lg px-3 py-2.5 outline-none focus:ring-2 transition-all resize-none ${
              error ? 'border-red-400 bg-red-50 focus:ring-red-100' : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-500'
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${colors[confirmColor]}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
