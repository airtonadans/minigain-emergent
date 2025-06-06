import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, CandlestickChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Play, Pause, Square, Settings, 
  Eye, BarChart3, Clock, DollarSign, Target, AlertCircle,
  ChevronRight, Plus, Minus, Calendar, Filter, Download
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import DataService from './services/DataService';
import TradingEngine from './services/TradingEngine';
import { TechnicalIndicators } from './utils/indicators';

// ===== COMPONENTES DE UI BASE =====
const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled, className = '' }) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-800'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', title, subtitle }) => (
  <div className={`bg-gray-800 rounded-xl border border-gray-700 shadow-lg ${className}`}>
    {title && (
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-gray-800 rounded-xl border border-gray-700 ${sizes[size]} w-full max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ===== COMPONENTE DE GRÁFICO CANDLESTICK =====
const CandlestickChart = ({ data, indicators = {}, height = 400 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Carregando dados do gráfico...</p>
      </div>
    );
  }

  // Prepara dados para o gráfico
  const chartData = data.map((candle, index) => ({
    ...candle,
    time: format(new Date(candle.timestamp), 'HH:mm', { locale: ptBR }),
    sma20: indicators.sma20?.[index],
    ema20: indicators.ema20?.[index],
    rsi: indicators.rsi?.[index]
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            domain={['dataMin - 1', 'dataMax + 1']}
          />
          
          {/* Linhas de indicadores */}
          {indicators.sma20 && (
            <Line 
              type="monotone" 
              dataKey="sma20" 
              stroke="#F59E0B" 
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          )}
          {indicators.ema20 && (
            <Line 
              type="monotone" 
              dataKey="ema20" 
              stroke="#8B5CF6" 
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          )}
          
          {/* Candlesticks customizados via renderização */}
          <Bar 
            dataKey="high" 
            fill="transparent"
            shape={(props) => <CandlestickShape {...props} />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Componente customizado para desenhar candlesticks
const CandlestickShape = ({ x, y, width, height, payload }) => {
  if (!payload) return null;
  
  const { open, high, low, close } = payload;
  const isGreen = close > open;
  const color = isGreen ? '#10B981' : '#EF4444';
  
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const bodyHeight = Math.abs(close - open);
  
  return (
    <g>
      {/* Sombra (wick) */}
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      {/* Corpo da vela */}
      <rect
        x={x + width * 0.2}
        y={y + (height * (1 - (bodyTop - low) / (high - low)))}
        width={width * 0.6}
        height={Math.max(1, height * (bodyHeight / (high - low)))}
        fill={isGreen ? color : 'transparent'}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// ===== TELA INICIAL - PORTFÓLIOS =====
export const PortfolioScreen = ({ onAssetSelect }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultAssets = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 
    'NVDA', 'META', 'NFLX', 'AMD', 'BABA'
  ];

  useEffect(() => {
    loadPortfolio();
    const interval = setInterval(loadPortfolio, 60000); // Atualiza a cada 60s
    return () => clearInterval(interval);
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const quotes = await Promise.all(
        defaultAssets.map(async (symbol) => {
          try {
            return await DataService.getRealTimeQuote(symbol);
          } catch (error) {
            console.warn(`Erro ao carregar ${symbol}, usando dados mock`);
            return DataService.generateMockQuote(symbol);
          }
        })
      );
      setAssets(quotes);
    } catch (error) {
      console.error('Erro ao carregar portfólio:', error);
      // Fallback para dados mock
      setAssets(defaultAssets.map(symbol => DataService.generateMockQuote(symbol)));
    } finally {
      setLoading(false);
    }
  };

  const AssetCard = ({ asset }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gray-800 rounded-lg border border-gray-700 p-4 cursor-pointer hover:border-blue-500 transition-all"
      onClick={() => onAssetSelect(asset.symbol)}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white">{asset.symbol}</h3>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-white">
          R$ {asset.price.toFixed(2)}
        </span>
        <div className={`flex items-center gap-1 ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {asset.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-semibold">
            {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Mini gráfico */}
      <div className="h-12 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={generateMiniChart()}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={asset.change >= 0 ? '#10B981' : '#EF4444'} 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Vol: {(asset.volume / 1000000).toFixed(1)}M</span>
        <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
          Estratégia: DEMA
        </span>
      </div>
    </motion.div>
  );

  const generateMiniChart = () => {
    return Array.from({ length: 20 }, (_, i) => ({
      value: 100 + Math.sin(i / 3) * 10 + Math.random() * 5
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando portfólio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Portfólios</h1>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4" />
          Adicionar Ativo
        </Button>
      </div>

      {/* Resumo da conta */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="text-center">
          <p className="text-blue-100 mb-1">Saldo Total</p>
          <p className="text-3xl font-bold text-white mb-2">
            R$ {TradingEngine.getBalance().toLocaleString('pt-BR')}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="text-green-300">+R$ 2.456,78 hoje</span>
            <span className="text-green-300">+4.91%</span>
          </div>
        </div>
      </Card>

      {/* Lista de ativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((asset, index) => (
          <AssetCard key={index} asset={asset} />
        ))}
      </div>
    </div>
  );
};

// ===== MODO REPLAY =====
export const ReplayMode = ({ symbol, onBack }) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [candleData, setCandleData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [indicators, setIndicators] = useState({});
  const [selectedIndicators, setSelectedIndicators] = useState(['sma20', 'rsi']);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const intervalRef = useRef(null);

  useEffect(() => {
    if (symbol) {
      loadHistoricalData();
    }
  }, [symbol, selectedDate]);

  useEffect(() => {
    if (candleData.length > 0) {
      calculateIndicators();
    }
  }, [candleData, selectedIndicators]);

  useEffect(() => {
    if (isPlaying && currentIndex < candleData.length - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= candleData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, currentIndex, candleData.length]);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      // Tentar carregar dados reais do Polygon
      try {
        const data = await DataService.getIntradayData(symbol, selectedDate);
        setCandleData(data);
      } catch (error) {
        console.warn('Erro ao carregar dados reais, usando mock:', error);
        // Fallback para dados mock
        const mockData = DataService.generateMockCandles(symbol, 390); // 6.5 horas * 60 minutos
        setCandleData(mockData);
      }
      setCurrentIndex(0);
    } catch (error) {
      console.error('Erro ao carregar dados históricos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateIndicators = () => {
    if (candleData.length === 0) return;
    
    const allIndicators = TechnicalIndicators.calculateAll(candleData);
    
    // Filtra apenas os indicadores selecionados
    const filtered = {};
    selectedIndicators.forEach(indicator => {
      if (allIndicators[indicator]) {
        filtered[indicator] = allIndicators[indicator];
      }
    });
    
    setIndicators(filtered);
  };

  const handleTrade = async (type) => {
    if (currentIndex >= candleData.length) return;
    
    const currentPrice = candleData[currentIndex].close;
    const timestamp = candleData[currentIndex].timestamp;
    
    try {
      let order;
      if (type === 'BUY') {
        order = TradingEngine.buy(symbol, currentPrice, 1, timestamp);
      } else if (type === 'SELL') {
        order = TradingEngine.sell(symbol, currentPrice, 1, timestamp);
      } else if (type === 'CLOSE') {
        order = TradingEngine.closePosition(symbol, currentPrice, timestamp);
      }
      
      // Atualiza posições
      setPositions(TradingEngine.getCurrentPositions());
      
      // Feedback visual
      alert(`${type === 'BUY' ? 'Compra' : type === 'SELL' ? 'Venda' : 'Fechamento'} executado: R$ ${currentPrice.toFixed(2)}`);
      
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };

  const resetReplay = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
    setPositions([]);
  };

  // Dados visíveis até o índice atual
  const visibleData = candleData.slice(0, currentIndex + 1);
  const currentCandle = candleData[currentIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            ← Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Replay - {symbol}</h1>
            <p className="text-gray-400">Simulação Histórica</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
          />
          <Button variant="outline" onClick={loadHistoricalData}>
            <Calendar className="w-4 h-4" />
            Carregar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando dados históricos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Controles de Replay */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant={isPlaying ? "danger" : "success"}
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={currentIndex >= candleData.length - 1}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pausar' : 'Reproduzir'}
                </Button>
                
                <Button variant="secondary" onClick={resetReplay}>
                  <Square className="w-4 h-4" />
                  Reiniciar
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Velocidade:</span>
                  {[0.5, 1, 2, 4].map(s => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-1 rounded ${speed === s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <p className="text-white font-semibold">
                  {currentCandle ? format(new Date(currentCandle.timestamp), 'HH:mm:ss', { locale: ptBR }) : '--:--:--'}
                </p>
                <p className="text-gray-400 text-sm">
                  {currentIndex + 1} / {candleData.length}
                </p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(currentIndex / (candleData.length - 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </Card>

          {/* Informações da vela atual */}
          {currentCandle && (
            <Card>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Abertura</p>
                  <p className="text-white font-semibold">R$ {currentCandle.open.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Máxima</p>
                  <p className="text-green-400 font-semibold">R$ {currentCandle.high.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Mínima</p>
                  <p className="text-red-400 font-semibold">R$ {currentCandle.low.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Fechamento</p>
                  <p className="text-white font-semibold">R$ {currentCandle.close.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Volume</p>
                  <p className="text-white font-semibold">{(currentCandle.volume / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </Card>
          )}

          {/* Gráfico */}
          <Card title="Gráfico de Candlesticks">
            <CandlestickChart 
              data={visibleData} 
              indicators={indicators}
              height={400}
            />
          </Card>

          {/* Controles de Trading */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="success" 
              size="lg"
              onClick={() => handleTrade('BUY')}
              disabled={!currentCandle}
            >
              <TrendingUp className="w-5 h-5" />
              Comprar
            </Button>
            
            <Button 
              variant="danger" 
              size="lg"
              onClick={() => handleTrade('SELL')}
              disabled={!currentCandle}
            >
              <TrendingDown className="w-5 h-5" />
              Vender
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleTrade('CLOSE')}
              disabled={!currentCandle || positions.length === 0}
            >
              <Target className="w-5 h-5" />
              Fechar Posição
            </Button>
          </div>

          {/* Informações da conta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Saldo</p>
                <p className="text-2xl font-bold text-white">
                  R$ {TradingEngine.getBalance().toLocaleString('pt-BR')}
                </p>
              </div>
            </Card>
            
            <Card>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Posições</p>
                <p className="text-2xl font-bold text-white">{positions.length}</p>
              </div>
            </Card>
            
            <Card>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Trades</p>
                <p className="text-2xl font-bold text-white">{TradingEngine.getTradeHistory().length}</p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

// ===== MODO BACKTEST =====
export const BacktestMode = ({ symbol, onBack }) => {
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStrategy, setSelectedStrategy] = useState('DEMA_RSI');
  const [strategyParams, setStrategyParams] = useState({});
  const [backtestResult, setBacktestResult] = useState(null);
  const [candleData, setCandleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const strategies = [
    { 
      id: 'DEMA_RSI', 
      name: 'DEMA + RSI',
      description: 'Estratégia baseada em DEMA e RSI',
      params: {
        demaPeriod: { value: 21, min: 10, max: 50, label: 'Período DEMA' },
        rsiPeriod: { value: 14, min: 5, max: 30, label: 'Período RSI' },
        oversold: { value: 30, min: 20, max: 40, label: 'RSI Sobrevenda' },
        overbought: { value: 70, min: 60, max: 80, label: 'RSI Sobrecompra' }
      }
    },
    {
      id: 'MACD_SIGNAL',
      name: 'MACD Signal',
      description: 'Estratégia baseada em cruzamentos MACD',
      params: {
        fastPeriod: { value: 12, min: 8, max: 20, label: 'EMA Rápida' },
        slowPeriod: { value: 26, min: 20, max: 35, label: 'EMA Lenta' },
        signalPeriod: { value: 9, min: 5, max: 15, label: 'Linha de Sinal' }
      }
    }
  ];

// ===== TELA DO ATIVO =====
export const AssetScreen = ({ symbol, onBack, onModeSelect }) => {
  const [assetData, setAssetData] = useState(null);
  const [aiProfile, setAiProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssetData();
  }, [symbol]);

  const loadAssetData = async () => {
    try {
      setLoading(true);
      
      // Carrega cotação atual
      let quote;
      try {
        quote = await DataService.getRealTimeQuote(symbol);
      } catch (error) {
        quote = DataService.generateMockQuote(symbol);
      }
      
      setAssetData(quote);
      
      // Carrega perfil de IA (mock)
      setAiProfile(generateMockAIProfile(symbol));
      
    } catch (error) {
      console.error('Erro ao carregar dados do ativo:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockAIProfile = (symbol) => ({
    strategies: [
      { name: 'DEMA + RSI', winRate: 74, bestHours: '9h-11h', drawdown: 10 },
      { name: 'MACD + Price Action', winRate: 70, bestHours: '13h-18h', drawdown: 9 },
      { name: 'SMA + Volume', winRate: 65, bestHours: '14h-16h', drawdown: 12 }
    ],
    tags: ['Alta Volatilidade', 'Scalping', 'Alta Liquidez'],
    bestHours: generateHeatmapData(),
    weekdayPerformance: {
      segunda: 68, terça: 72, quarta: 75, quinta: 71, sexta: 69
    }
  });

  const generateHeatmapData = () => {
    const hours = [];
    for (let h = 9; h <= 17; h++) {
      hours.push({
        hour: `${h}h`,
        performance: Math.floor(Math.random() * 40) + 40 // 40-80%
      });
    }
    return hours;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          ← Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{symbol}</h1>
          <p className="text-gray-400">Análise e Trading</p>
        </div>
      </div>

      {/* Preço atual */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-white">
              R$ {assetData?.price.toFixed(2)}
            </p>
            <div className={`flex items-center gap-2 ${assetData?.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {assetData?.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="font-semibold">
                {assetData?.change >= 0 ? '+' : ''}{assetData?.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-400">
            <p>Volume: {(assetData?.volume / 1000000).toFixed(1)}M</p>
            <p>{format(new Date(), 'HH:mm:ss', { locale: ptBR })}</p>
          </div>
        </div>
      </Card>

      {/* Modos de Trading */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-blue-500 transition-all" 
              onClick={() => onModeSelect('replay')}>
          <div className="text-center">
            <Play className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="font-bold text-white mb-2">Modo Replay</h3>
            <p className="text-gray-400 text-sm">Simule trades com dados históricos</p>
          </div>
        </Card>

        <Card className="cursor-pointer hover:border-green-500 transition-all"
              onClick={() => onModeSelect('backtest')}>
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="font-bold text-white mb-2">Modo Backtest</h3>
            <p className="text-gray-400 text-sm">Teste estratégias automatizadas</p>
          </div>
        </Card>

        <Card className="cursor-pointer hover:border-red-500 transition-all"
              onClick={() => onModeSelect('live')}>
          <div className="text-center">
            <Target className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-white mb-2">Tempo Real</h3>
            <p className="text-gray-400 text-sm">Trade com cotações em tempo real</p>
          </div>
        </Card>
      </div>

      {/* Perfil de IA */}
      <Card title="Perfil de Inteligência" subtitle="Análise automática baseada em histórico">
        <div className="space-y-4">
          {/* Estratégias recomendadas */}
          <div>
            <h4 className="font-semibold text-white mb-3">Estratégias Recomendadas</h4>
            <div className="space-y-2">
              {aiProfile?.strategies.map((strategy, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-white">{strategy.name}</p>
                    <p className="text-sm text-gray-400">{strategy.bestHours} • DD: {strategy.drawdown}%</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">{strategy.winRate}%</p>
                    <p className="text-xs text-gray-400">Win Rate</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags do ativo */}
          <div>
            <h4 className="font-semibold text-white mb-3">Características</h4>
            <div className="flex flex-wrap gap-2">
              {aiProfile?.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Heatmap de performance */}
          <div>
            <h4 className="font-semibold text-white mb-3">Melhores Horários</h4>
            <div className="grid grid-cols-9 gap-1">
              {aiProfile?.bestHours.map((hour, index) => (
                <div key={index} className="text-center">
                  <div 
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold mb-1 ${
                      hour.performance > 70 ? 'bg-green-600 text-white' :
                      hour.performance > 60 ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}
                  >
                    {hour.performance}
                  </div>
                  <p className="text-xs text-gray-400">{hour.hour}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};