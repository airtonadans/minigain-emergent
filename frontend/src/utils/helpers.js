import { format } from 'date-fns';

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
};

export const formatNumber = (num, precision = 2) => {
  if (typeof num !== 'number') return '0.00';
  return num.toFixed(precision);
};

export const formatCurrency = (num) => {
  if (typeof num !== 'number') return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const calculateDrawdown = (trades) => {
  let maxEquity = 0;
  let maxDrawdown = 0;
  let currentEquity = 0;

  trades.forEach(trade => {
    currentEquity += trade.result;
    if (currentEquity > maxEquity) {
      maxEquity = currentEquity;
    }
    const drawdown = maxEquity - currentEquity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return maxDrawdown;
};
