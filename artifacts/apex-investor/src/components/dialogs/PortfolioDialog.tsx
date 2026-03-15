import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, TrendingUp, Shield, Anchor, Scale, AlertTriangle } from 'lucide-react';
import { useCreatePortfolioItem, useUpdatePortfolioItem } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface PortfolioItem {
  id: number;
  ticker: string;
  companyName: string;
  entryPrice: number;
  currentPrice?: number | null;
  shares: number;
  entryDate?: string | null;
  status: string;
  entryReason?: string | null;
  holdingReason?: string | null;
  sellReason?: string | null;
  sector?: string | null;
  country?: string | null;
  notes?: string | null;
}

interface PortfolioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: PortfolioItem | null;
}

const EMPTY_FORM = {
  ticker: '',
  companyName: '',
  entryPrice: '',
  currentPrice: '',
  shares: '',
  entryDate: '',
  status: 'holding',
  entryReason: '',
  holdingReason: '',
  sellReason: '',
  sector: '',
  country: '',
  notes: '',
  moat: '',
  marginOfSafety: '',
  riskAssessment: '',
};

export function PortfolioDialog({ isOpen, onClose, editItem }: PortfolioDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const createMutation = useCreatePortfolioItem();
  const updateMutation = useUpdatePortfolioItem();

  useEffect(() => {
    if (!isOpen) return;
    if (editItem) {
      // Parse moat/marginOfSafety/riskAssessment from notes JSON if stored there
      let moat = '';
      let marginOfSafety = '';
      let riskAssessment = '';
      let plainNotes = editItem.notes || '';
      try {
        const parsed = JSON.parse(editItem.notes || '{}');
        if (parsed.__apex) {
          moat = parsed.moat || '';
          marginOfSafety = parsed.marginOfSafety || '';
          riskAssessment = parsed.riskAssessment || '';
          plainNotes = parsed.notes || '';
        }
      } catch {}
      setForm({
        ticker: editItem.ticker || '',
        companyName: editItem.companyName || '',
        entryPrice: editItem.entryPrice?.toString() || '',
        currentPrice: editItem.currentPrice?.toString() || '',
        shares: editItem.shares?.toString() || '',
        entryDate: editItem.entryDate || '',
        status: editItem.status || 'holding',
        entryReason: editItem.entryReason || '',
        holdingReason: editItem.holdingReason || '',
        sellReason: editItem.sellReason || '',
        sector: editItem.sector || '',
        country: editItem.country || '',
        notes: plainNotes,
        moat,
        marginOfSafety,
        riskAssessment,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, editItem]);

  if (!isOpen) return null;

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Bundle extra fields into notes as JSON
      const notesPayload = JSON.stringify({
        __apex: true,
        notes: form.notes,
        moat: form.moat,
        marginOfSafety: form.marginOfSafety,
        riskAssessment: form.riskAssessment,
      });

      const payload = {
        ticker: form.ticker.toUpperCase(),
        companyName: form.companyName,
        entryPrice: parseFloat(form.entryPrice),
        currentPrice: form.currentPrice ? parseFloat(form.currentPrice) : null,
        shares: parseFloat(form.shares),
        entryDate: form.entryDate || null,
        status: form.status as 'holding' | 'sold' | 'watching',
        entryReason: form.entryReason || null,
        holdingReason: form.holdingReason || null,
        sellReason: form.sellReason || null,
        sector: form.sector || null,
        country: form.country || null,
        notes: notesPayload,
      };

      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, data: payload });
      } else {
        await createMutation.mutateAsync({ data: payload });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";
  const textareaClass = `${inputClass} resize-none`;
  const labelClass = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl flex flex-col max-h-[95vh] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">{editItem ? 'Edit Position' : 'Add Position'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Paper Trading Portfolio</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ticker *</label>
              <input required value={form.ticker} onChange={set('ticker')} placeholder="AAPL" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Company Name *</label>
              <input required value={form.companyName} onChange={set('companyName')} placeholder="Apple Inc." className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Entry Price *</label>
              <input required type="number" step="0.01" value={form.entryPrice} onChange={set('entryPrice')} placeholder="150.00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Current Price</label>
              <input type="number" step="0.01" value={form.currentPrice} onChange={set('currentPrice')} placeholder="175.00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Shares *</label>
              <input required type="number" step="0.0001" value={form.shares} onChange={set('shares')} placeholder="10" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputClass}>
                <option value="holding">Holding</option>
                <option value="watching">Watching</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Sector</label>
              <input value={form.sector} onChange={set('sector')} placeholder="Technology" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Entry Date</label>
              <input type="date" value={form.entryDate} onChange={set('entryDate')} className={inputClass} />
            </div>
          </div>

          {/* Investment Thesis divider */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Investment Thesis</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Why holding */}
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-success" /> Why Are You Holding It?</span>
            </label>
            <textarea
              rows={3}
              value={form.holdingReason}
              onChange={set('holdingReason')}
              placeholder="The core reason this investment still makes sense to hold. What's your conviction based on?"
              className={textareaClass}
            />
          </div>

          {/* Why to sell */}
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-destructive" /> When / Why Would You Sell?</span>
            </label>
            <textarea
              rows={3}
              value={form.sellReason}
              onChange={set('sellReason')}
              placeholder="Specific triggers or conditions that would make you exit. Be precise — price target, thesis break, time horizon..."
              className={textareaClass}
            />
          </div>

          {/* Risk */}
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><Shield className="w-3 h-3 text-amber-400" /> Risk This Investment Carries</span>
            </label>
            <textarea
              rows={3}
              value={form.riskAssessment}
              onChange={set('riskAssessment')}
              placeholder="Key risks: regulatory, competitive, macro, execution, valuation, concentration... Be honest."
              className={textareaClass}
            />
          </div>

          {/* MOAT */}
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><Anchor className="w-3 h-3 text-blue-400" /> MOAT for This Investment</span>
            </label>
            <textarea
              rows={3}
              value={form.moat}
              onChange={set('moat')}
              placeholder="What protects this business from competition? Brand, network effects, switching costs, cost advantage, patents..."
              className={textareaClass}
            />
          </div>

          {/* Margin of Safety */}
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><Scale className="w-3 h-3 text-violet-400" /> Margin of Safety</span>
            </label>
            <textarea
              rows={3}
              value={form.marginOfSafety}
              onChange={set('marginOfSafety')}
              placeholder="How much discount to intrinsic value are you getting? What's your estimate of intrinsic value vs current price?"
              className={textareaClass}
            />
          </div>

          {/* Entry reason */}
          <div>
            <label className={labelClass}>Why Did You Enter?</label>
            <textarea
              rows={2}
              value={form.entryReason}
              onChange={set('entryReason')}
              placeholder="What was the original thesis when you bought?"
              className={textareaClass}
            />
          </div>

          {/* General notes */}
          <div>
            <label className={labelClass}>Additional Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={set('notes')}
              placeholder="Any other thoughts, links, or reminders..."
              className={textareaClass}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={isSubmitting || !form.ticker || !form.companyName || !form.entryPrice || !form.shares}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : editItem ? 'Save Changes' : 'Add Position'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
