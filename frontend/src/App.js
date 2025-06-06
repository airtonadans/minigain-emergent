import React, { useState } from 'react';
import { LiveMode } from './components/LiveMode';
import { BacktestMode } from './components/BacktestMode';
import { ReplayMode } from './components/ReplayMode';
import { Button } from './components/UI/Button';
import { BarChart3, Bot, History } from 'lucide-react';

// Componente para a tela inicial de seleção de modo
const ScreenSelector = ({ onSelect }) => (
  <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-100 p-4">
    <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-gray-800">MiniGain</h1>
        <p className="text-lg text-gray-600 mt-2">Sua plataforma de Backtest, Replay e Operações</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div 
            onClick={() => onSelect('live')}
            className="bg-white p-8 rounded-lg shadow-lg text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
        >
            <Bot size={48} className="mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-semibold">Live Mode</h2>
            <p className="text-gray-500 mt-2">Opere em tempo real no simulador.</p>
        </div>
        <div 
            onClick={() => onSelect('backtest')}
            className="bg-white p-8 rounded-lg shadow-lg text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
        >
            <BarChart3 size={48} className="mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-semibold">Backtest</h2>
            <p className="text-gray-500 mt-2">Teste suas estratégias em dados históricos.</p>
        </div>
        <div 
            onClick={() => onSelect('replay')}
            className="bg-white p-8 rounded-lg shadow-lg text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
        >
            <History size={48} className="mx-auto text-purple-600 mb-4" />
            <h2 className="text-2xl font-semibold">Replay</h2>
            <p className="text-gray-500 mt-2">Reassista o mercado em qualquer data.</p>
        </div>
    </div>
  </div>
);


function App() {
  // Estado para controlar qual modo está ativo: 'live', 'backtest', 'replay', ou null (tela de seleção)
  const [mode, setMode] = useState(null); 
  
  // Exemplo de ativo. Isso pode vir de uma seleção do usuário no futuro.
  const symbol = "MINIGAIN"; 

  // Função para renderizar o conteúdo principal baseado no estado 'mode'
  const renderContent = () => {
    switch (mode) {
      case 'live':
        // A função 'onBack' não é necessária aqui pois o modo live é o principal
        return <LiveMode symbol={symbol} />;
      case 'backtest':
        // Passa a função para que o componente 'BacktestMode' possa voltar para a tela de seleção
        return <BacktestMode onBack={() => setMode(null)} />;
      case 'replay':
         // Passa a função para que o componente 'ReplayMode' possa voltar para a tela de seleção
        return <ReplayMode symbol={symbol} onBack={() => setMode(null)} />;
      default:
        // Se nenhum modo estiver selecionado, mostra a tela de seleção
        return <ScreenSelector onSelect={setMode} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {renderContent()}
    </div>
  );
}

export default App;
