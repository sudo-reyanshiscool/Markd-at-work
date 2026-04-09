"use client";

import { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-[var(--card-shadow)] border border-slate-100 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", ...props }: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20",
  };
  return (
    <button {...props} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 cursor-pointer ${styles[variant]} ${props.className ?? ""}`}>
      {children}
    </button>
  );
}

export function Input({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>}
      <input {...props} className={`w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white placeholder:text-slate-400 ${props.className ?? ""}`} />
    </div>
  );
}

export function Select({ label, children, ...props }: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>}
      <select {...props} className={`w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white ${props.className ?? ""}`}>
        {children}
      </select>
    </div>
  );
}

export function Badge({ children, color = "gray" }: { children: ReactNode; color?: "gray" | "blue" | "green" | "red" | "amber" | "violet" }) {
  const colors = {
    gray: "bg-slate-50 text-slate-600 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colors[color]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <div className="text-center py-12">
      {icon ?? (
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
