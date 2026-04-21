'use client';

import React from 'react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: '#13ec5b',
        border: 'none',
        padding: '8px 14px',
        borderRadius: 8,
        fontWeight: 900,
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      🖨 Imprimer
    </button>
  );
}
