import React, { useState, useEffect } from 'react';
import { Button } from './UI/Button';
import { Card } from './UI/Card';
import { ChevronLeft, Play, Pause, Square } from './UI/Icons';
import { formatCurrency } from '../utils/helpers';

export const ReplayMode = ({ symbol, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Lógica de controle do replay
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentDate(prevDate => new Date(prevDate.getTime() + 1000 * 60 * replaySpeed)); // Avança 1 minuto (simulado)
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, replaySpeed]);


  return (
    <div className="p-4 space-y-4">
       <div className="flex justify-between items-center">
        <Button onClick={onBack} variant="secondary">
          <ChevronLeft size={16} /> Voltar para Seleção
        </Button>
        <h1 className="text-2xl font-bold">Replay: {symbol}</h1>
        <div className="text-lg">{currentDate.toLocaleString('pt-BR')}</div>
      </div>

      {/* Aqui viria o seu gráfico principal do Replay */}
       <div className="bg-gray-200 h-96 rounded-lg shadow-inner flex items-center justify-center">
          <p className="text-gray-500">Gráfico do Replay de Mercado</p>
       </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
        <div className="flex gap-4">
          <Button onClick={() => setIsPlaying(!isPlaying)} variant="primary">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pausar' : 'Iniciar'}
          </Button>
           <Button onClick={() => { setIsPlaying(false); /* Lógica para resetar */ }} variant="danger">
            <Square size={16} /> Parar
          </Button>
        </div>
        <div className="flex items-center gap-2">
           <label>Velocidade:</label>
           <select value={replaySpeed} onChange={(e) => setReplaySpeed(Number(e.target.value))} className="border p-2 rounded-md">
              <option value={1}>1x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card title="Resultado (Aberto)" value={formatCurrency(0)} />
         <Card title="Posição" value="Nenhuma" />
      </div>
    </div>
  );
};
            
