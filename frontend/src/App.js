import React, { useState, useEffect } from 'react';
import { 
  PortfolioScreen, 
  AssetScreen, 
  ReplayMode, 
  BacktestMode, 
  LiveMode, 
  AuditScreen 
} from './components';
import TradingEngine from './services/TradingEngine';
import { Settings, PieChart, FileText, Home } from 'lucide-react';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('portfolio');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [mode, setMode] = useState(null);

  useEffect(() => {
    // Carrega dados salvos do Trading Engine
    TradingEngine.loadFromStorage();
  }, []);

  const handleAssetSelect = (symbol) => {
    setSelectedAsset(symbol);
    setCurrentScreen('asset');
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setCurrentScreen(selectedMode);
  };

  const handleBack = () => {
    if (currentScreen === 'replay' || currentScreen === 'backtest' || currentScreen === 'live') {
      setCurrentScreen('asset');
    } else if (currentScreen === 'asset') {
      setCurrentScreen('portfolio');
      setSelectedAsset(null);
    } else {
      setCurrentScreen('portfolio');
    }
  };

  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-40">
      <div className="flex items-center justify-around py-3">
        <button
          onClick={() => {
            setCurrentScreen('portfolio');
            setSelectedAsset(null);
            setMode(null);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
            currentScreen === 'portfolio' ? 'text-blue-400 bg-blue-600/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">Portfólios</span>
        </button>

        <button
          onClick={() => setCurrentScreen('audit')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
            currentScreen === 'audit' ? 'text-blue-400 bg-blue-600/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs">Auditoria</span>
        </button>

        <button
          onClick={() => setCurrentScreen('settings')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
            currentScreen === 'settings' ? 'text-blue-400 bg-blue-600/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs">Configurações</span>
        </button>
      </div>
    </div>
  );

  const SettingsScreen = () => (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setCurrentScreen('portfolio')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Voltar
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-gray-400">Parâmetros e ajustes do sistema</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Configurações de Trading</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Saldo Inicial (R$)</label>
            <input
              type="number"
              defaultValue={TradingEngine.getBalance()}
              onChange={(e) => TradingEngine.setBalance(parseFloat(e.target.value) || 50000)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Tamanho do Contrato</label>
            <input
              type="number"
              defaultValue={1}
              onChange={(e) => TradingEngine.setContractSize(parseInt(e.target.value) || 1)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
            />
          </div>

          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja resetar todos os dados?')) {
                  TradingEngine.resetAccount();
                  alert('Conta resetada com sucesso!');
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Resetar Conta
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Informações da API</h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Twelve Data (Tempo Real):</span>
            <span className="text-green-400">Conectado</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Polygon.io (Histórico):</span>
            <span className="text-green-400">Conectado</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Sobre o Aplicativo</h2>
        
        <div className="space-y-2 text-sm text-gray-400">
          <p><strong className="text-white">Versão:</strong> 1.0.0</p>
          <p><strong className="text-white">Modo:</strong> Simulação (Dinheiro Virtual)</p>
          <p><strong className="text-white">Idioma:</strong> Português (Brasil)</p>
          <p><strong className="text-white">Desenvolvido por:</strong> Trading Simulator</p>
        </div>
      </div>
    </div>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'portfolio':
        return <PortfolioScreen onAssetSelect={handleAssetSelect} />;
      
      case 'asset':
        return (
          <AssetScreen 
            symbol={selectedAsset} 
            onBack={handleBack}
            onModeSelect={handleModeSelect}
          />
        );
      
      case 'replay':
        return (
          <ReplayMode 
            symbol={selectedAsset} 
            onBack={handleBack}
          />
        );
      
      case 'backtest':
        return (
          <BacktestMode 
            symbol={selectedAsset} 
            onBack={handleBack}
          />
        );
      
      case 'live':
        return (
          <LiveMode 
            symbol={selectedAsset} 
            onBack={handleBack}
          />
        );
      
      case 'audit':
        return <AuditScreen onBack={handleBack} />;
      
      case 'settings':
        return <SettingsScreen />;
      
      default:
        return <PortfolioScreen onAssetSelect={handleAssetSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header fixo */}
      <div className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Profit Mobile</h1>
              <p className="text-xs text-gray-400">Simulador de Trading</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-400">Conectado</span>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="pt-20 pb-20 px-4 max-w-6xl mx-auto">
        {renderCurrentScreen()}
      </div>

      {/* Navegação inferior */}
      <BottomNavigation />
    </div>
  );
}

export default App;
