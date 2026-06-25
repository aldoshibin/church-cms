'use client';
import { X } from 'lucide-react';
import React from 'react';

interface ModalProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  formId?: string;
  saving?: boolean;
  saveLabel?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  title, subtitle, icon, onClose, onSubmit, formId,
  saving, saveLabel = 'Save', children, maxWidth = 'max-w-lg'
}: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden`}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 ">
            {icon && (
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {onSubmit ? (
            <form id={formId} onSubmit={onSubmit} className="px-6 py-5 space-y-4">
              {children}
            </form>
          ) : (
            <div className="px-6 py-5 space-y-4">{children}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form={formId} disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{saveLabel}ing...</>
            ) : (
              <span className="px-4">{saveLabel}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// Shared field components for use inside modals
export const inp = [
  'w-full bg-white text-gray-900 text-sm border border-gray-200 rounded-xl',
  'px-3 py-2.5 outline-none transition-all placeholder-gray-400',
  'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 hover:border-gray-300',
].join(' ');

export const errInp = [
  'w-full bg-red-50 text-gray-900 text-sm border border-red-400 rounded-xl',
  'px-3 py-2.5 outline-none transition-all placeholder-red-300',
  'focus:border-red-500 focus:ring-2 focus:ring-red-100',
].join(' ');

export function FLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

export function FField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <FLabel required={required}>{label}</FLabel>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function FInput({ error, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <input className={`${error ? errInp : inp} ${className}`} {...props} />;
}

export function FSelect({ error, className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string; children: React.ReactNode }) {
  return <select className={`${error ? errInp : inp} ${className}`} {...props}>{children}</select>;
}

export function FTextarea({ error, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return <textarea className={`${error ? errInp : inp} resize-none ${className}`} {...props} />;
}

export function FGrid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return <div className={`grid grid-cols-${cols} gap-4`}>{children}</div>;
}