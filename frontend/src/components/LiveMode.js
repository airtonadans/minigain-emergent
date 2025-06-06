import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from './UI/Card';
import { Dialog } from './UI/Dialog';
import { Button } from './UI/Button';
import { Settings, HelpCircle, Trash2 } from './UI/Icons';
import { formatCurrency, formatNumber } from '../utils/helpers';

// Este é um esqueleto básico. Você precisará preencher com a lógica de estado e API.
export const LiveMode = ({ symbol }) => {
  const [stats, setStats] = useState({ balance: 0, profit: 0, winrate: 0 });
  const [trades, setTrades] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Exemplo de como buscar dados
  useEffect(() => {
    // axios.get(`/api/live/${symbol}/stats`).then(res => setStats(res.data));
    // axios.get(`/api/live/${symbol}/trades`).then(res => setTrades(res.data));
  }, [symbol]);

  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.result > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Live Mode: {symbol}</h1>
        <div>
          <Button onClick={() => setIsSettingsOpen(true)} variant="secondary">
            <Settings size={16} /> Configurações
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Card title="Saldo Atual" value={formatCurrency(stats.balance)} color="text-blue-600" />
        <Card title="Lucro/Prejuízo (Dia)" value={formatCurrency(stats.profit)} color={stats.profit >= 0 ? 'text-green-600' : 'text-red-600'} />
        <Card title="Taxa de Acerto" value={`${formatNumber(winRate)}%`} />
        <Card title="Operações Hoje" value={totalTrades.toString()} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Histórico de Operações</h2>
        {/* Aqui viria a sua tabela de trades */}
        <div className="bg-white p-4 rounded-lg shadow-md">
           <p>Tabela de trades em tempo real...</p>
        </div>
      </div>
      
      <Dialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Configurações do Live Mode">
        <p>Aqui você pode adicionar as configurações específicas do modo live, como parâmetros de robô, etc.</p>
      </Dialog>
    </div>
  );
};
