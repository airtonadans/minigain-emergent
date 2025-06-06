import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import DataService from './services/DataService';
import TradingEngine from './services/TradingEngine';
import { TechnicalIndicators } from './utils/indicators';
import { Button, Card, CandlestickChart } from './components';

export const LiveMode = ({ symbol, onBack }) => {
  const [currentPrice, setCurrentPrice] = useState(0);
  const [candleData, setCandleData] = useState([]);
  const [indicators, setIndicators] = useState({});
  const [positions, setPositions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  
  const wsRef = useRef(null);

  useEffect(() => {
    connectToLiveData();
    loadInitialCandles();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol]);

  useEffect(() => {
    setPositions(TradingEngine.getCurrentPositions());
    setOrderHistory(TradingEngine.getOrderHistory().slice(-10));
  }, []);

  const connectToLiveData = async () => {
    try {
      // Primeiro, obtém cotação atual
      try {
        const quote = await DataService.getRealTimeQuote(symbol);
        setCurrentPrice(quote.price);
      } catch (error) {
        const mockQuote = DataService.generateMockQuote(symbol);
        setCurrentPrice(mockQuote.price);
      }

      // Conecta WebSocket simulado
      wsRef.current = DataService.createMockWebSocket(symbol, (quote) => {
        setCurrentPrice(quote.price);
        updateCandleData(quote);
      });
      
      setIsConnected(true);
    } catch (error) {
      console.error('Erro ao conectar dados em tempo real:', error);
    }
  };

  const loadInitialCandles = async () => {
    try {
      // Carrega últimas velas para contexto
      const today = format(new Date(), 'yyyy-MM-dd');
      try {
        const data = await DataService.getIntradayData(symbol, today);
        setCandleData(data.slice(-100)); // Últimas 100 velas
      } catch (error) {
        const mockData = DataService.generateMockCandles(symbol, 100);
        setCandleData(mockData);
      }
    } catch (error) {
      console.error('Erro ao carregar velas iniciais:', error);
    }
  };

  const updateCandleData = (quote) => {
    setCandleData(prev => {
      const now = new Date();
      const lastCandle = prev[prev.length - 1];
      
      // Se é a mesma vela (mesmo minuto), atualiza
      if (lastCandle && format(new Date(lastCandle.timestamp), 'HH:mm') === format(now, 'HH:mm')) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...lastCandle,
          close: quote.price,
          high: Math.max(lastCandle.high, quote.price),
          low: Math.min(lastCandle.low, quote.price),
          volume: lastCandle.volume + (quote.volume || 1000)
        };
        return updated;
      } else {
        // Nova vela
        const newCandle = {
          timestamp: now.getTime(),
          date: now,
          open: quote.price,
          high: quote.price,
          low: quote.price,
          close: quote.price,
          volume: quote.volume || 1000
        };
        return [...prev.slice(-99), newCandle]; // Mantém últimas 100 velas
      }
    });
  };

  useEffect(() => {
    if (candleData.length > 20) {
      const newIndicators = TechnicalIndicators.calculateAll(candleData);
      setIndicators(newIndicators);
    }
  }, [candleData]);

  const handleTrade = async (type) => {
    if (!currentPrice) return;
    
    try {
      let order;
      if (type === 'BUY') {
        order = TradingEngine.buy(symbol, currentPrice);
      } else if (type === 'SELL') {
        order = TradingEngine.sell(symbol, currentPrice);
      } else if (type === 'CLOSE') {
        order = TradingEngine.closePosition(symbol, currentPrice);
      }
      
      // Atualiza estado
      setPositions(TradingEngine.getCurrentPositions());
      setOrderHistory(TradingEngine.getOrderHistory().slice(-10));
      
      // Feedback
      alert(`${type === 'BUY' ? 'Compra' : type === 'SELL' ? 'Venda' : 'Fechamento'} executado: R$ ${currentPrice.toFixed(2)}`);
      
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };

  const currentPosition = positions.find(p => p.symbol === symbol);
  const currentPnL = currentPosition ? (currentPrice - currentPosition.avgPrice) * currentPosition.quantity : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            ← Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Tempo Real - {symbol}</h1>
            <p className="text-gray-400">Trading ao Vivo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-gray-400 text-sm">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Preço atual */}
      <Card>
        <div className="text-center">
          <p className="text-4xl font-bold text-white mb-2">
            R$ {currentPrice.toFixed(2)}
          </p>
          <p className="text-gray-400">
            {format(new Date(), 'HH:mm:ss', { locale: ptBR })} • Tempo Real
          </p>
        </div>
      </Card>

      {/* Posição atual */}
      {currentPosition && (
        <Card title="Posição Atual">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Quantidade</p>
              <p className="text-white font-semibold">{currentPosition.quantity}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Preço Médio</p>
              <p className="text-white font-semibold">R$ {currentPosition.avgPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">P&L Atual</p>
              <p className={`font-semibold ${currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {currentPnL >= 0 ? '+' : ''}R$ {currentPnL.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">P&L %</p>
              <p className={`font-semibold ${currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {currentPnL >= 0 ? '+' : ''}{((currentPnL / (currentPosition.avgPrice * currentPosition.quantity)) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Gráfico em tempo real */}
      <Card title="Gráfico em Tempo Real">
        <CandlestickChart 
          data={candleData}
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
          disabled={!isConnected}
        >
          <TrendingUp className="w-5 h-5" />
          Comprar
        </Button>
        
        <Button 
          variant="danger" 
          size="lg"
          onClick={() => handleTrade('SELL')}
          disabled={!isConnected || !currentPosition}
        >
          <TrendingDown className="w-5 h-5" />
          Vender
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => handleTrade('CLOSE')}
          disabled={!isConnected || !currentPosition}
        >
          <Target className="w-5 h-5" />
          Fechar Posição
        </Button>
      </div>

      {/* Informações da conta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Saldo Disponível</p>
            <p className="text-2xl font-bold text-white">
              R$ {TradingEngine.getBalance().toLocaleString('pt-BR')}
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Posições Abertas</p>
            <p className="text-2xl font-bold text-white">{positions.length}</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Trades Hoje</p>
            <p className="text-2xl font-bold text-white">{orderHistory.length}</p>
          </div>
        </Card>
      </div>

      {/* Histórico recente */}
      {orderHistory.length > 0 && (
        <Card title="Histórico Recente">
          <div className="space-y-2">
            {orderHistory.map((order, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="text-white font-medium">
                    {order.type} • {order.quantity} {symbol}
                  </p>
                  <p className="text-gray-400 text-sm">
                    R$ {order.price.toFixed(2)} • {format(new Date(order.timestamp), 'HH:mm:ss', { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${order.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {order.type === 'BUY' ? '-' : '+'}R$ {(order.totalCost || order.totalRevenue || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};