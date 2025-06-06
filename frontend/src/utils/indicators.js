// Indicadores técnicos para análise
export class TechnicalIndicators {
  
  // ===== MÉDIAS MÓVEIS =====
  static sma(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  static ema(data, period) {
    const result = [];
    const multiplier = 2 / (period + 1);
    
    // Primeira EMA é a SMA
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
      result.push(ema);
    }
    
    return result;
  }

  static dema(data, period) {
    const ema1 = this.ema(data, period);
    const ema2 = this.ema(ema1, period);
    
    const result = [];
    for (let i = 0; i < ema1.length && i < ema2.length; i++) {
      result.push((2 * ema1[i]) - ema2[i]);
    }
    
    return result;
  }

  // ===== RSI =====
  static rsi(data, period = 14) {
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGains = this.sma(gains, period);
    const avgLosses = this.sma(losses, period);
    
    const result = [];
    for (let i = 0; i < avgGains.length; i++) {
      const rs = avgGains[i] / avgLosses[i];
      const rsi = 100 - (100 / (1 + rs));
      result.push(rsi);
    }
    
    return result;
  }

  // ===== MACD =====
  static macd(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const emaFast = this.ema(data, fastPeriod);
    const emaSlow = this.ema(data, slowPeriod);
    
    // Ajusta arrays para mesmo tamanho
    const startIndex = slowPeriod - fastPeriod;
    const macdLine = [];
    
    for (let i = startIndex; i < emaFast.length; i++) {
      macdLine.push(emaFast[i] - emaSlow[i - startIndex]);
    }
    
    const signalLine = this.ema(macdLine, signalPeriod);
    const histogram = [];
    
    const signalStartIndex = signalPeriod - 1;
    for (let i = signalStartIndex; i < macdLine.length; i++) {
      histogram.push(macdLine[i] - signalLine[i - signalStartIndex]);
    }
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  }

  // ===== ATR (Average True Range) =====
  static atr(highs, lows, closes, period = 14) {
    const trueRanges = [];
    
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    return this.sma(trueRanges, period);
  }

  // ===== STOP ATR =====
  static stopATR(highs, lows, closes, period = 14, multiplier = 2) {
    const atrValues = this.atr(highs, lows, closes, period);
    const result = [];
    
    for (let i = 0; i < atrValues.length; i++) {
      const dataIndex = i + period; // Ajuste pelo período do ATR
      if (dataIndex < closes.length) {
        const stopDistance = atrValues[i] * multiplier;
        result.push({
          stopLoss: closes[dataIndex] - stopDistance,
          stopGain: closes[dataIndex] + stopDistance,
          atr: atrValues[i]
        });
      }
    }
    
    return result;
  }

  // ===== BOLLINGER BANDS =====
  static bollingerBands(data, period = 20, stdDev = 2) {
    const smaValues = this.sma(data, period);
    const result = [];
    
    for (let i = 0; i < smaValues.length; i++) {
      const dataSlice = data.slice(i, i + period);
      const mean = smaValues[i];
      
      // Calcula desvio padrão
      const variance = dataSlice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      result.push({
        middle: mean,
        upper: mean + (standardDeviation * stdDev),
        lower: mean - (standardDeviation * stdDev)
      });
    }
    
    return result;
  }

  // ===== VOLUME INDICATORS =====
  static volumeMA(volumes, period = 20) {
    return this.sma(volumes, period);
  }

  // ===== PRICE ACTION PATTERNS =====
  static detectDoji(candles, threshold = 0.1) {
    return candles.map(candle => {
      const bodySize = Math.abs(candle.close - candle.open);
      const range = candle.high - candle.low;
      const bodyRatio = bodySize / range;
      
      return {
        isDoji: bodyRatio < threshold,
        strength: 1 - bodyRatio
      };
    });
  }

  static detectHammer(candles) {
    return candles.map(candle => {
      const body = Math.abs(candle.close - candle.open);
      const upperShadow = candle.high - Math.max(candle.open, candle.close);
      const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
      
      const isHammer = lowerShadow > (body * 2) && upperShadow < (body * 0.5);
      
      return {
        isHammer,
        type: candle.close > candle.open ? 'bullish_hammer' : 'bearish_hammer'
      };
    });
  }

  // ===== CÁLCULO DE TODOS OS INDICADORES =====
  static calculateAll(candles, config = {}) {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);
    
    const indicators = {
      sma20: this.sma(closes, config.sma20Period || 20),
      sma50: this.sma(closes, config.sma50Period || 50),
      ema20: this.ema(closes, config.ema20Period || 20),
      dema: this.dema(closes, config.demaPeriod || 21),
      rsi: this.rsi(closes, config.rsiPeriod || 14),
      macd: this.macd(closes, config.macdFast || 12, config.macdSlow || 26, config.macdSignal || 9),
      atr: this.atr(highs, lows, closes, config.atrPeriod || 14),
      stopATR: this.stopATR(highs, lows, closes, config.atrPeriod || 14, config.atrMultiplier || 2),
      bollingerBands: this.bollingerBands(closes, config.bbPeriod || 20, config.bbStdDev || 2),
      volumeMA: this.volumeMA(volumes, config.volumePeriod || 20),
      doji: this.detectDoji(candles),
      hammer: this.detectHammer(candles)
    };
    
    return indicators;
  }
}