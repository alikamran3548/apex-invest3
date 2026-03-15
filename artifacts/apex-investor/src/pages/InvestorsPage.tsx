import { useState } from 'react';
import { Users, Plus, ExternalLink, Edit2, Trash2, X, Save, ChevronDown, ChevronRight, Quote, BookOpen, Lightbulb, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const STYLES = ['Value Investing', 'Growth Investing', 'Quality Investing', 'Macro Investing', 'Quant / Systematic', 'Activist', 'Special Situations', 'Index / Passive', 'Contrarian', 'Event-Driven', 'Other'];

interface Investor {
  id: number;
  name: string;
  known_for?: string;
  style?: string;
  key_lessons?: string;
  books?: string;
  quotes?: string;
  notes?: string;
  website_url?: string;
  photo_url?: string;
  created_at: string;
}

const EMPTY = { name: '', known_for: '', style: 'Value Investing', key_lessons: '', books: '', quotes: '', notes: '', website_url: '', photo_url: '' };

function InvestorDialog({ investor, onClose }: { investor?: Investor | null; onClose: () => void }) {
  const [form, setForm] = useState(investor ? {
    name: investor.name, known_for: investor.known_for || '', style: investor.style || 'Value Investing',
    key_lessons: investor.key_lessons || '', books: investor.books || '', quotes: investor.quotes || '',
    notes: investor.notes || '', website_url: investor.website_url || '', photo_url: investor.photo_url || '',
  } : EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const method = investor ? 'PUT' : 'POST';
      const url = investor ? `${BASE}/api/investors/${investor.id}` : `${BASE}/api/investors`;
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      qc.invalidateQueries({ queryKey: ['investors'] });
      onClose();
    } finally { setSubmitting(false); }
  };

  const inp = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const lbl = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";
  const divider = (label: string) => (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-bold text-primary uppercase tracking-widest">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">{investor ? 'Edit Investor' : 'Add Investor'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track learnings from great investors</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={lbl}>Name *</label><input required value={form.name} onChange={set('name')} placeholder="Warren Buffett" className={inp} /></div>
            <div className="col-span-2"><label className={lbl}>Known For</label><input value={form.known_for} onChange={set('known_for')} placeholder="Value investing, long-term compounding, Berkshire Hathaway" className={inp} /></div>
            <div>
              <label className={lbl}>Investing Style</label>
              <select value={form.style} onChange={set('style')} className={inp}>
                {STYLES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Photo URL</label><input value={form.photo_url} onChange={set('photo_url')} placeholder="https://..." className={inp} /></div>
          </div>

          {divider('Key Learnings')}

          <div>
            <label className={lbl}><span className="inline-flex items-center gap-1.5"><Lightbulb className="w-3 h-3 text-amber-400" /> Key Lessons from This Investor</span></label>
            <textarea rows={4} value={form.key_lessons} onChange={set('key_lessons')} placeholder="• Buy wonderful businesses at fair prices&#10;• Be greedy when others are fearful&#10;• Circle of competence is everything" className={inp + " resize-none"} />
          </div>

          <div>
            <label className={lbl}><span className="inline-flex items-center gap-1.5"><Quote className="w-3 h-3 text-violet-400" /> Favourite Quotes</span></label>
            <textarea rows={3} value={form.quotes} onChange={set('quotes')} placeholder='"Price is what you pay, value is what you get."&#10;"Rule No. 1: Never lose money."' className={inp + " resize-none"} />
          </div>

          <div>
            <label className={lbl}><span className="inline-flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-blue-400" /> Books / Resources by / about Them</span></label>
            <textarea rows={2} value={form.books} onChange={set('books')} placeholder="The Intelligent Investor, Berkshire Annual Letters, Poor Charlie's Almanack" className={inp + " resize-none"} />
          </div>

          <div>
            <label className={lbl}><span className="inline-flex items-center gap-1.5"><Briefcase className="w-3 h-3 text-green-400" /> Personal Notes & Takeaways</span></label>
            <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="What you specifically learned and apply from this investor..." className={inp + " resize-none"} />
          </div>

          <div><label className={lbl}>Website / Portfolio URL</label><input value={form.website_url} onChange={set('website_url')} placeholder="https://berkshirehathaway.com" className={inp} /></div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSubmit as any} disabled={submitting || !form.name} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" />{submitting ? 'Saving...' : investor ? 'Save Changes' : 'Add Investor'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvestorCard({ investor, onEdit, onDelete }: { investor: Investor; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const sections = [
    { label: 'Key Lessons', value: investor.key_lessons, icon: Lightbulb, color: 'text-amber-400' },
    { label: 'Favourite Quotes', value: investor.quotes, icon: Quote, color: 'text-violet-400' },
    { label: 'Books & Resources', value: investor.books, icon: BookOpen, color: 'text-blue-400' },
    { label: 'Personal Notes', value: investor.notes, icon: Briefcase, color: 'text-green-400' },
  ].filter(s => s.value);

  const hasContent = sections.length > 0;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden group">
      {/* Header */}
      <div
        className={cn("flex items-center gap-4 p-5 transition-colors", hasContent && "cursor-pointer hover:bg-white/5")}
        onClick={() => hasContent && setExpanded(e => !e)}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {investor.photo_url ? (
            <img src={investor.photo_url} alt={investor.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-border"
              onError={e => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.style.setProperty('display', 'flex'); }} />
          ) : null}
          <div className={cn(
            "w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border-2 border-primary/20 text-xl font-bold text-primary",
            investor.photo_url ? "hidden" : "flex"
          )}>
            {investor.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground text-lg leading-tight">{investor.name}</h3>
            {hasContent && (expanded
              ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {investor.style && (
            <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium mt-1">{investor.style}</span>
          )}
          {investor.known_for && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{investor.known_for}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          {investor.website_url && (
            <a href={investor.website_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="w-3 h-3" /> Website
            </a>
          )}
        </div>
      </div>

      {/* Expanded learnings */}
      {expanded && hasContent && (
        <div className="border-t border-border/50 mx-5 mb-5">
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map(sec => {
              const Icon = sec.icon;
              return (
                <div key={sec.label} className="bg-background/50 border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn("w-4 h-4", sec.color)} />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{sec.label}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{sec.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvestorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editInvestor, setEditInvestor] = useState<Investor | null>(null);
  const [filterStyle, setFilterStyle] = useState('All');
  const qc = useQueryClient();

  const { data: investors = [], isLoading } = useQuery<Investor[]>({
    queryKey: ['investors'],
    queryFn: () => fetch(`${BASE}/api/investors`).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/investors/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investors'] }),
  });

  const usedStyles = ['All', ...Array.from(new Set(investors.map(i => i.style).filter(Boolean) as string[]))];
  const filtered = investors.filter(i => filterStyle === 'All' || i.style === filterStyle);

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Learning & Planning</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">Investor Wisdom</h1>
          <p className="text-sm text-muted-foreground mt-1">Track lessons, quotes and insights from legendary investors</p>
        </div>
        <button onClick={() => { setEditInvestor(null); setDialogOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-md shadow-primary/20 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Investor
        </button>
      </header>

      {/* Stats bar */}
      {investors.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="glass-panel px-5 py-3 rounded-xl flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground">{investors.length}</p>
              <p className="text-xs text-muted-foreground">Investors tracked</p>
            </div>
          </div>
          {/* Style filter */}
          {usedStyles.length > 2 && (
            <div className="flex gap-1 p-1 bg-card rounded-xl flex-wrap">
              {usedStyles.map(s => (
                <button key={s} onClick={() => setFilterStyle(s)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    filterStyle === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-5 border border-dashed border-border rounded-3xl bg-card/30">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Users className="w-10 h-10 text-primary/50" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-1">{investors.length === 0 ? 'No investors yet' : 'No match for this style'}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">{investors.length === 0 ? 'Add legendary investors and capture their wisdom — lessons, quotes, books, and your personal takeaways.' : 'Try a different style filter.'}</p>
          </div>
          {investors.length === 0 && (
            <button onClick={() => setDialogOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-md shadow-primary/20">
              <Plus className="w-4 h-4" /> Add Your First Investor
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(investor => (
            <InvestorCard
              key={investor.id}
              investor={investor}
              onEdit={() => { setEditInvestor(investor); setDialogOpen(true); }}
              onDelete={() => { if (confirm(`Remove ${investor.name}?`)) deleteMutation.mutate(investor.id); }}
            />
          ))}
        </div>
      )}

      {dialogOpen && <InvestorDialog investor={editInvestor} onClose={() => { setDialogOpen(false); setEditInvestor(null); }} />}
    </div>
  );
}
