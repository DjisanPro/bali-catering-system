import { Router, Request, Response } from 'express';

export interface CashTransaction {
  id: string;
  type: 'SUPPLY' | 'BLEED' | 'FLOAT' | 'SALE';
  amount: number;
  reason: string;
  performedBy: string;
  timestamp: string;
  shiftId: string;
}

export interface CashShiftServerRecord {
  id: string;
  shiftNumber: number;
  status: 'OPEN' | 'IN_OPERATION' | 'CLOSED';
  openedBy: string;
  openedAt: string;
  closedBy?: string;
  closedAt?: string;
  initialCashFloat: number;
  expectedCash: number;
  countedCash?: number;
  cashDiscrepancy?: number;
  totalSalesAmount: number;
  ordersCount: number;
  paymentBreakdown: {
    cash: number;
    mpesa: number;
    emola: number;
    posCard: number;
    bankTransfer: number;
  };
  supplies: CashTransaction[];
  bleedings: CashTransaction[];
  notes?: string;
  discrepancyJustification?: string;
}

const router = Router();

// Store em memória persistido pelo servidor
let activeShift: CashShiftServerRecord | null = null;
const shiftHistory: CashShiftServerRecord[] = [];

// Obter turno de caixa atual
router.get('/current', (req: Request, res: Response) => {
  res.json({
    success: true,
    activeShift,
  });
});

// Histórico de turnos de caixa
router.get('/history', (req: Request, res: Response) => {
  res.json({
    success: true,
    shifts: shiftHistory,
    count: shiftHistory.length,
  });
});

// Abertura de turno de caixa com fundo de troco
router.post('/open', (req: Request, res: Response) => {
  try {
    const { initialCashFloat, openedBy, notes } = req.body;
    if (activeShift && activeShift.status !== 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: `O turno #${activeShift.shiftNumber} já se encontra aberto. Feche-o antes de abrir um novo.`,
      });
    }

    const floatAmount = Number(initialCashFloat) || 0;
    const now = new Date().toISOString();
    const newShiftNumber = shiftHistory.length + (activeShift ? 1 : 1);

    const newShift: CashShiftServerRecord = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      shiftNumber: newShiftNumber,
      status: 'OPEN',
      openedBy: openedBy || 'Operador de Caixa',
      openedAt: now,
      initialCashFloat: floatAmount,
      expectedCash: floatAmount,
      totalSalesAmount: 0,
      ordersCount: 0,
      paymentBreakdown: {
        cash: 0,
        mpesa: 0,
        emola: 0,
        posCard: 0,
        bankTransfer: 0,
      },
      supplies: [],
      bleedings: [],
      notes: notes || '',
    };

    activeShift = newShift;

    res.json({
      success: true,
      message: `Turno #${newShift.shiftNumber} aberto com sucesso com fundo de ${floatAmount} MT.`,
      shift: newShift,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao abrir caixa.' });
  }
});

// Suprimento de caixa (Entrada de dinheiro para troco extra)
router.post('/supply', (req: Request, res: Response) => {
  try {
    const { amount, reason, performedBy } = req.body;
    if (!activeShift || activeShift.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'Nenhum turno de caixa aberto no momento.',
      });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valor de suprimento inválido.' });
    }

    const transaction: CashTransaction = {
      id: `sup-${Date.now()}`,
      type: 'SUPPLY',
      amount: numAmount,
      reason: reason || 'Suprimento de troco',
      performedBy: performedBy || 'Operador',
      timestamp: new Date().toISOString(),
      shiftId: activeShift.id,
    };

    activeShift.supplies.push(transaction);
    activeShift.expectedCash = Number((activeShift.expectedCash + numAmount).toFixed(2));

    res.json({
      success: true,
      message: `Suprimento de ${numAmount} MT registrado com sucesso.`,
      shift: activeShift,
      transaction,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao registrar suprimento.' });
  }
});

// Sangria de caixa (Retirada de dinheiro por segurança)
router.post('/bleed', (req: Request, res: Response) => {
  try {
    const { amount, reason, performedBy } = req.body;
    if (!activeShift || activeShift.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'Nenhum turno de caixa aberto no momento.',
      });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valor de sangria inválido.' });
    }

    if (numAmount > activeShift.expectedCash) {
      return res.status(400).json({
        success: false,
        error: `Sangria superior ao saldo esperado em dinheiro (${activeShift.expectedCash} MT).`,
      });
    }

    const transaction: CashTransaction = {
      id: `bld-${Date.now()}`,
      type: 'BLEED',
      amount: numAmount,
      reason: reason || 'Sangria de segurança para cofre',
      performedBy: performedBy || 'Operador',
      timestamp: new Date().toISOString(),
      shiftId: activeShift.id,
    };

    activeShift.bleedings.push(transaction);
    activeShift.expectedCash = Number((activeShift.expectedCash - numAmount).toFixed(2));

    res.json({
      success: true,
      message: `Sangria de ${numAmount} MT registrada com sucesso.`,
      shift: activeShift,
      transaction,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao registrar sangria.' });
  }
});

// Fechamento de turno de caixa com conferência cega ou informada
router.post('/close', (req: Request, res: Response) => {
  try {
    const { countedCash, closedBy, justification, notes } = req.body;
    if (!activeShift || activeShift.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'Não há turno de caixa ativo para fechar.',
      });
    }

    const counted = Number(countedCash) || 0;
    const discrepancy = Number((counted - activeShift.expectedCash).toFixed(2));
    const now = new Date().toISOString();

    activeShift.status = 'CLOSED';
    activeShift.closedBy = closedBy || 'Operador de Caixa';
    activeShift.closedAt = now;
    activeShift.countedCash = counted;
    activeShift.cashDiscrepancy = discrepancy;
    activeShift.discrepancyJustification = justification || '';
    if (notes) activeShift.notes = (activeShift.notes ? activeShift.notes + ' | ' : '') + notes;

    const closedRecord = { ...activeShift };
    shiftHistory.unshift(closedRecord);
    activeShift = null;

    res.json({
      success: true,
      message: `Turno #${closedRecord.shiftNumber} fechado. Diferença apurada: ${discrepancy} MT.`,
      shift: closedRecord,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao fechar caixa.' });
  }
});

export default router;
