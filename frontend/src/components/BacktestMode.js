import React, { useState } from 'react';
import { Card } from './UI/Card';
import { Button } from './UI/Button';
import { History, Calendar } from './UI/Icons';
import { formatCurrency, formatNumber, calculateDrawdown } from '../utils/helpers';

export const BacktestMode = ({ onBack }) => {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunBacktest = () => {
    setIsLoading(true);
    // Simulação de chamada de API
    setTimeout(() => {
      const mockTrades = [
        { result: 150 }, { result: -50 }, { result: 200 }, { result: -75 }, { result: 300 }
      ];
      const totalResult = mockTrades.reduce((sum, t) => sum + t.result, 0);
      const winningTrades = mockTrades.filter(t => t.result > 0).length;
      const winRate = (winningTrades / mockTrades.length) * 100;
      const maxDrawdown = calculateDrawdown(mockTrades);
      
      setResults({
        totalResult,
        winRate,
        totalTrades: mockTrades.length,
        maxDrawdown,
        profitFactor: totalResult / (maxDrawdown || 1),
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Backtest</h1>
        <Button onClick={onBack} variant="secondary">
          <History size={16} /> Voltar
        </Button>
      </div>

      {/* Formulário de configuração do Backtest */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
         <h2 className="text-lg font-semibold">Configurar Backtest</h2>
         {/* Adicione seus campos de data, ativo, estratégia etc. aqui */}
         <div><label>Ativo:</label> <input defaultValue="MINIGAIN" className="border p-1 rounded-md"/></div>
         <div><label>Período:</label> <input type="date" className="border p-1 rounded-md"/> a <input type="date" className="border p-1 rounded-md"/></div>
         <Button onClick={handleRunBacktest} disabled={isLoading}>
           {isLoading ? 'Executando...' : 'Executar Backtest'}
         </Button>
      </div>

      {results && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Resultados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card title="Resultado Total" value={formatCurrency(results.totalResult)} color={results.totalResult > 0 ? 'text-green-600' : 'text-red-600'} />
            <Card title="Taxa de Acerto" value={`${formatNumber(results.winRate)}%`} />
            <Card title="Total de Trades" value={results.totalTrades.toString()} />
            <Card title="Drawdown Máximo" value={formatCurrency(results.maxDrawdown)} color="text-red-600" />
            <Card title="Fator de Lucro" value={formatNumber(results.profitFactor)} />
          </div>
          {/* Aqui viria o gráfico de resultados */}
        </div>
      )}
    </div>
  );
};
