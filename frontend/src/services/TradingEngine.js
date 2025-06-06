// Motor de simulação de trading
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

class TradingEngine {
  constructor() {
    this.balance = 50000; // Saldo inicial de R$ 50.000
    this.positions = [];
    this.orders = [];
    this.tradeHistory = [];
    this.contractSize = 1;
    this.fees = 0.5; // Taxa por operação em %
  }

  // ===== CONFIGURAÇÕES =====
  setBalance(amount) {
    this.balance = amount;
    this.saveToStorage();
  }

  setContractSize(size) {
    this.contractSize = size;
    this.saveToStorage();
  }

  getBalance() {
    return this.balance;
  }

  getCurrentPositions() {
    return this.positions;
  }

  // ===== OPERAÇÕES DE TRADING =====
  buy(symbol, price, quantity = this.contractSize, timestamp = Date.now()) {
    const cost = price * quantity;
    const fee = cost * (this.fees / 100);
    const totalCost = cost + fee;

    if (totalCost > this.balance) {
      throw new Error('Saldo insuficiente para esta operação');
    }

    const order = {
      id: this.generateOrderId(),
      type: 'BUY',
      symbol,
      price,
      quantity,
      cost,
      fee,
      totalCost,
      timestamp,
      status: 'EXECUTED'
    };

    // Atualiza saldo
    this.balance -= totalCost;

    // Adiciona ou atualiza posição
    this.updatePosition(symbol, quantity, price);

    // Registra ordem e histórico
    this.orders.push(order);
    this.tradeHistory.push({
      ...order,
      action: 'COMPRA',
      description: `Compra de ${quantity} ${symbol} por R$ ${price.toFixed(2)}`
    });

    this.saveToStorage();
    return order;
  }

  sell(symbol, price, quantity = this.contractSize, timestamp = Date.now()) {
    const position = this.positions.find(p => p.symbol === symbol);
    
    if (!position || position.quantity < quantity) {
      throw new Error('Quantidade insuficiente para venda');
    }

    const revenue = price * quantity;
    const fee = revenue * (this.fees / 100);
    const totalRevenue = revenue - fee;

    const order = {
      id: this.generateOrderId(),
      type: 'SELL',
      symbol,
      price,
      quantity,
      revenue,
      fee,
      totalRevenue,
      timestamp,
      status: 'EXECUTED'
    };

    // Calcula P&L
    const avgBuyPrice = position.avgPrice;
    const profit = (price - avgBuyPrice) * quantity - fee;

    // Atualiza saldo
    this.balance += totalRevenue;

    // Atualiza posição
    this.updatePosition(symbol, -quantity, price);

    // Registra ordem e histórico
    this.orders.push(order);
    this.tradeHistory.push({
      ...order,
      action: 'VENDA',
      profit,
      description: `Venda de ${quantity} ${symbol} por R$ ${price.toFixed(2)}`,
      profitDescription: profit >= 0 ? `Lucro: R$ ${profit.toFixed(2)}` : `Prejuízo: R$ ${Math.abs(profit).toFixed(2)}`
    });

    this.saveToStorage();
    return order;
  }

  closePosition(symbol, currentPrice, timestamp = Date.now()) {
    const position = this.positions.find(p => p.symbol === symbol);
    
    if (!position || position.quantity === 0) {
      throw new Error('Nenhuma posição aberta para este ativo');
    }

    return this.sell(symbol, currentPrice, position.quantity, timestamp);
  }

  // ===== GESTÃO DE POSIÇÕES =====
  updatePosition(symbol, quantity, price) {
    const existingPosition = this.positions.find(p => p.symbol === symbol);

    if (existingPosition) {
      if (quantity > 0) {
        // Comprando mais
        const totalCost = (existingPosition.quantity * existingPosition.avgPrice) + (quantity * price);
        const totalQuantity = existingPosition.quantity + quantity;
        existingPosition.avgPrice = totalCost / totalQuantity;
        existingPosition.quantity = totalQuantity;
      } else {
        // Vendendo
        existingPosition.quantity += quantity; // quantity é negativo na venda
        if (existingPosition.quantity <= 0) {
          this.positions = this.positions.filter(p => p.symbol !== symbol);
        }
      }
    } else if (quantity > 0) {
      // Nova posição
      this.positions.push({
        symbol,
        quantity,
        avgPrice: price,
        openTimestamp: Date.now()
      });
    }
  }

  // ===== CÁLCULOS DE PERFORMANCE =====
  calculatePortfolioValue(currentPrices) {
    let portfolioValue = this.balance;
    
    this.positions.forEach(position => {
      const currentPrice = currentPrices[position.symbol] || position.avgPrice;
      portfolioValue += position.quantity * currentPrice;
    });

    return portfolioValue;
  }

  calculatePnL(currentPrices) {
    let totalPnL = 0;
    const positionsPnL = {};

    this.positions.forEach(position => {
      const currentPrice = currentPrices[position.symbol] || position.avgPrice;
      const pnl = (currentPrice - position.avgPrice) * position.quantity;
      totalPnL += pnl;
      positionsPnL[position.symbol] = {
        ...position,
        currentPrice,
        pnl,
        pnlPercent: ((currentPrice - position.avgPrice) / position.avgPrice) * 100
      };
    });

    return { totalPnL, positionsPnL };
  }

  // ===== ESTRATÉGIAS AUTOMATIZADAS =====
  executeStrategy(strategy, candleData, indicators) {
    // Implementa lógica de estratégias baseada em indicadores
    switch (strategy.name) {
      case 'DEMA_RSI':
        return this.executeDemaRsiStrategy(candleData, indicators, strategy.params);
      case 'MACD_SIGNAL':
        return this.executeMacdStrategy(candleData, indicators, strategy.params);
      default:
        return null;
    }
  }

  executeDemaRsiStrategy(candleData, indicators, params) {
    const { rsi, dema } = indicators;
    const currentPrice = candleData[candleData.length - 1].close;
    const currentRsi = rsi[rsi.length - 1];
    const currentDema = dema[dema.length - 1];

    // Lógica da estratégia DEMA + RSI
    if (currentRsi < params.oversold && currentPrice > currentDema) {
      return { action: 'BUY', price: currentPrice, reason: 'RSI oversold + price above DEMA' };
    } else if (currentRsi > params.overbought && currentPrice < currentDema) {
      return { action: 'SELL', price: currentPrice, reason: 'RSI overbought + price below DEMA' };
    }

    return null;
  }

  // ===== UTILITÁRIOS =====
  generateOrderId() {
    return 'ORD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getTradeHistory() {
    return this.tradeHistory;
  }

  getOrderHistory() {
    return this.orders;
  }

  // ===== PERSISTÊNCIA =====
  saveToStorage() {
    const data = {
      balance: this.balance,
      positions: this.positions,
      orders: this.orders,
      tradeHistory: this.tradeHistory,
      contractSize: this.contractSize
    };
    localStorage.setItem('tradingEngine', JSON.stringify(data));
  }

  loadFromStorage() {
    const data = localStorage.getItem('tradingEngine');
    if (data) {
      const parsed = JSON.parse(data);
      this.balance = parsed.balance || 50000;
      this.positions = parsed.positions || [];
      this.orders = parsed.orders || [];
      this.tradeHistory = parsed.tradeHistory || [];
      this.contractSize = parsed.contractSize || 1;
    }
  }

  resetAccount() {
    this.balance = 50000;
    this.positions = [];
    this.orders = [];
    this.tradeHistory = [];
    this.contractSize = 1;
    this.saveToStorage();
  }
}

export default new TradingEngine();