// Serviço de dados para APIs de trading
class DataService {
  constructor() {
    this.twelveDataKey = process.env.REACT_APP_TWELVE_KEY;
    this.polygonKey = process.env.REACT_APP_POLYGON_KEY;
    this.baseUrlTwelve = 'https://api.twelvedata.com';
    this.baseUrlPolygon = 'https://api.polygon.io';
  }

  // ===== TWELVE DATA (Tempo Real) =====
  async getRealTimeQuote(symbol) {
    try {
      const response = await fetch(
        `${this.baseUrlTwelve}/quote?symbol=${symbol}&apikey=${this.twelveDataKey}`
      );
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      return {
        symbol: data.symbol,
        price: parseFloat(data.close),
        change: parseFloat(data.change),
        changePercent: parseFloat(data.percent_change),
        volume: parseInt(data.volume),
        timestamp: data.datetime
      };
    } catch (error) {
      console.error('Erro ao buscar cotação em tempo real:', error);
      throw error;
    }
  }

  async getRealTimeQuotes(symbols) {
    try {
      const symbolsStr = symbols.join(',');
      const response = await fetch(
        `${this.baseUrlTwelve}/quote?symbol=${symbolsStr}&apikey=${this.twelveDataKey}`
      );
      const data = await response.json();
      
      // Se múltiplos símbolos, retorna objeto com cada símbolo
      if (Array.isArray(symbols) && symbols.length > 1) {
        return Object.keys(data).map(symbol => ({
          symbol,
          price: parseFloat(data[symbol].close),
          change: parseFloat(data[symbol].change),
          changePercent: parseFloat(data[symbol].percent_change),
          volume: parseInt(data[symbol].volume),
          timestamp: data[symbol].datetime
        }));
      }
      
      return [this.parseQuoteData(data)];
    } catch (error) {
      console.error('Erro ao buscar múltiplas cotações:', error);
      throw error;
    }
  }

  // ===== POLYGON.IO (Dados Históricos) =====
  async getHistoricalData(symbol, from, to, timespan = 'minute', multiplier = 1) {
    try {
      const response = await fetch(
        `${this.baseUrlPolygon}/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apikey=${this.polygonKey}`
      );
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(data.error || 'Erro ao buscar dados históricos');
      }
      
      return data.results.map(candle => ({
        timestamp: candle.t,
        date: new Date(candle.t),
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
        volume: candle.v
      }));
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      throw error;
    }
  }

  async getIntradayData(symbol, date, timespan = 'minute') {
    try {
      const response = await fetch(
        `${this.baseUrlPolygon}/v2/aggs/ticker/${symbol}/range/1/${timespan}/${date}/${date}?adjusted=true&sort=asc&limit=50000&apikey=${this.polygonKey}`
      );
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(data.error || 'Erro ao buscar dados intraday');
      }
      
      return data.results.map(candle => ({
        timestamp: candle.t,
        date: new Date(candle.t),
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
        volume: candle.v
      }));
    } catch (error) {
      console.error('Erro ao buscar dados intraday:', error);
      throw error;
    }
  }

  // ===== MOCK DATA PARA DESENVOLVIMENTO =====
  generateMockCandles(symbol, count = 100) {
    const candles = [];
    let basePrice = 100;
    let currentTime = Date.now() - (count * 60000); // 1 minuto atrás para cada vela
    
    for (let i = 0; i < count; i++) {
      const open = basePrice + (Math.random() - 0.5) * 2;
      const close = open + (Math.random() - 0.5) * 3;
      const high = Math.max(open, close) + Math.random() * 1;
      const low = Math.min(open, close) - Math.random() * 1;
      
      candles.push({
        timestamp: currentTime,
        date: new Date(currentTime),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000)
      });
      
      basePrice = close;
      currentTime += 60000; // Próximo minuto
    }
    
    return candles;
  }

  generateMockQuote(symbol) {
    const price = 100 + Math.random() * 50;
    const change = (Math.random() - 0.5) * 5;
    
    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat((change / price * 100).toFixed(2)),
      volume: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString()
    };
  }

  // ===== WEBSOCKET SIMULADO =====
  createMockWebSocket(symbol, callback) {
    const interval = setInterval(() => {
      const quote = this.generateMockQuote(symbol);
      callback(quote);
    }, 2000); // Atualiza a cada 2 segundos

    return {
      close: () => clearInterval(interval)
    };
  }
}

export default new DataService();