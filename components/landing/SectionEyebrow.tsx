'use client';
import React from 'react';

interface SectionEyebrowProps {
  children: React.ReactNode;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
}

const SectionEyebrow: React.FC<SectionEyebrowProps> = ({ children, align = 'center', tone = 'light' }) => {
  const alignCls = align === 'center' ? 'justify-center' : 'justify-start';
  const toneCls =
    tone === 'dark'
      ? 'text-primary/90'
      : 'text-teal-accent dark:text-primary';
  return (
    <div className={`flex items-center gap-2.5 ${alignCls}`}>
      <span className={`h-px w-6 ${tone === 'dark' ? 'bg-primary/50' : 'bg-teal-accent/40 dark:bg-primary/40'}`} />
      <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${toneCls}`}>
        {children}
      </span>
      <span className={`h-px w-6 ${tone === 'dark' ? 'bg-primary/50' : 'bg-teal-accent/40 dark:bg-primary/40'}`} />
    </div>
  );
};

export default SectionEyebrow;
