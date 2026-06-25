'use client';
import React from 'react';

// ─── Base styles ────────────────────────────────────────────────────────────
const baseInput = [
  'w-full',
  'bg-white',
  'text-gray-900',
  'text-sm',
  'border',
  'rounded-lg',
  'px-3',
  'py-2',
  'outline-none',
  'transition-colors',
  'placeholder-gray-400',
  'focus:ring-2',
  'focus:ring-indigo-500',
  'focus:border-indigo-500',
  'disabled:bg-gray-50',
  'disabled:text-gray-400',
  'disabled:cursor-not-allowed',
].join(' ');

const okBorder   = 'border-gray-300';
const errBorder  = 'border-red-400 bg-red-50';

// ─── Field wrapper ───────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
export function Field({ label, required, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}
export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`${baseInput} ${error ? errBorder : okBorder} ${className}`}
    />
  );
}

// ─── Textarea ────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}
export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`${baseInput} ${error ? errBorder : okBorder} resize-none ${className}`}
    />
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  children: React.ReactNode;
}
export function Select({ error, className = '', children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`${baseInput} ${error ? errBorder : okBorder} ${className}`}
    >
      {children}
    </select>
  );
}

// ─── Checkbox ────────────────────────────────────────────────────────────────
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export function Checkbox({ label, id, ...props }: CheckboxProps) {
  const uid = id || label.replace(/\s+/g, '_').toLowerCase();
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={uid}
        {...props}
        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
      />
      <label htmlFor={uid} className="text-sm text-gray-700 cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}