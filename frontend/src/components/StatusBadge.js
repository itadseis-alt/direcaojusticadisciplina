import React from 'react';

const statusConfig = {
  processado: {
    label: 'Processado',
    bgColor: 'bg-[#DCFCE7]',
    textColor: 'text-[#166534]',
    borderColor: 'border-[#166534]'
  },
  arquivado: {
    label: 'Arquivado',
    bgColor: 'bg-[#F4F4F5]',
    textColor: 'text-[#3F3F46]',
    borderColor: 'border-[#3F3F46]'
  },
  pendente: {
    label: 'Pendente',
    bgColor: 'bg-[#FFEDD5]',
    textColor: 'text-[#9A3412]',
    borderColor: 'border-[#9A3412]'
  },
  anulado: {
    label: 'Anulado',
    bgColor: 'bg-[#FEE2E2]',
    textColor: 'text-[#991B1B]',
    borderColor: 'border-[#991B1B]'
  },
  em_processo: {
    label: 'Em Processo',
    bgColor: 'bg-[#DBEAFE]',
    textColor: 'text-[#1E40AF]',
    borderColor: 'border-[#1E40AF]'
  }
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pendente;

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider border rounded-none ${config.bgColor} ${config.textColor} ${config.borderColor}`}
      data-testid={`status-badge-${status}`}
    >
      {config.label}
    </span>
  );
}
