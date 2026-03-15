import { useState, useMemo } from 'react';
import { BookOpen, Plus, Star, ExternalLink, Edit2, Trash2, X, Save, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const BOOK_CATEGORIES = ['General', 'Investing', 'Psychology', 'Biography', 'Trading', 'Economics', 'Business', 'Finance', 'History', 'Self-Improvement'];
const STATUSES = [
  { value: 'to-read', label: 'To Read', color: 'text-muted-foreground', bg: 'bg-muted/60' },
  { value: 'reading', label: 'Reading', color: 'text-amber-400', bg: 'bg-amber-400/10 border border-amber-400/20' },
  { value: 'done', label: 'Done', color: 'text-success', bg: 'bg-success/10 border border-success/20' },
];

interface Book {
  id: number;
  title: string;
  author?: string;
  category: string;
  status: string;
  rating?: number;
  notes?: string;
  url?: string;
  cover_url?: string;
  created_at: string;
}

const EMPTY_FORM = { title: '', author: '', category: 'Investing', status: 'to-read', rating: '', notes: '', url: '', cover_url: '' };

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={cn("w-5 h-5 transition-colors", onChange ? "cursor-pointer" : "cursor-default",
            n <= value ? "text-amber-400" : "text-muted-foreground/30")}
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      ))}
    </div>
  );
}

function BookDialog({ book, onClose }: { book?: Book | null; onClose: () => void }) {
  const [form, setForm] = useState(book
    ? { title: book.title, author: book.author || '', category: book.category, status: book.status, rating: book.rating?.toString() || '', notes: book.notes || '', url: book.url || '', cover_url: book.cover_url || '' }
    : EMPTY_FORM
  );
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...form, rating: form.rating ? parseInt(form.rating) : null };
    try {
      if (book) {
        await fetch(`${BASE}/api/books/${book.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${BASE}/api/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      qc.invalidateQueries({ queryKey: ['books'] });
      onClose();
    } finally { setSubmitting(false); }
  };

  const inp = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const lbl = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">{book ? 'Edit Book' : 'Add Book'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          <div><label className={lbl}>Title *</label><input required value={form.title} onChange={set('title')} placeholder="The Intelligent Investor" className={inp} /></div>
          <div><label className={lbl}>Author</label><input value={form.author} onChange={set('author')} placeholder="Benjamin Graham" className={inp} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Category</label>
              <select value={form.category} onChange={set('category')} className={inp}>
                {BOOK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select value={form.status} onChange={set('status')} className={inp}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Rating</label>
            <StarRating value={parseInt(form.rating) || 0} onChange={v => setForm(f => ({ ...f, rating: v.toString() }))} />
          </div>
          <div><label className={lbl}>Amazon / Goodreads URL</label><input value={form.url} onChange={set('url')} placeholder="https://..." className={inp} /></div>
          <div><label className={lbl}>Cover Image URL</label><input value={form.cover_url} onChange={set('cover_url')} placeholder="https://..." className={inp} /></div>
          <div><label className={lbl}>Notes</label><textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Key takeaways, why it's worth reading..." className={inp + " resize-none"} /></div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSubmit as any} disabled={submitting || !form.title} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" />{submitting ? 'Saving...' : book ? 'Save Changes' : 'Add Book'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookCard({ book, onEdit, onDelete }: { book: Book; onEdit: () => void; onDelete: () => void }) {
  const status = STATUSES.find(s => s.value === book.status) || STATUSES[0];
  return (
    <div className="glass-panel rounded-2xl p-5 flex gap-4 group hover:border-border transition-all">
      {/* Cover or placeholder */}
      <div className="w-16 flex-shrink-0">
        {book.cover_url
          ? <img src={book.cover_url} alt={book.title} className="w-16 h-24 object-cover rounded-lg shadow-md" onError={e => (e.currentTarget.style.display = 'none')} />
          : <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"><BookOpen className="w-8 h-8 text-primary/50" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-foreground leading-snug line-clamp-2">{book.title}</h3>
            {book.author && <p className="text-sm text-muted-foreground mt-0.5">{book.author}</p>}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={onEdit} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-medium", status.bg, status.color)}>{status.label}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">{book.category}</span>
          {book.rating ? <StarRating value={book.rating} /> : null}
        </div>
        {book.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{book.notes}</p>}
        {book.url && (
          <a href={book.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
            <ExternalLink className="w-3 h-3" /> View
          </a>
        )}
      </div>
    </div>
  );
}

export default function BooksPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: () => fetch(`${BASE}/api/books`).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/books/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });

  const usedCategories = useMemo(() => ['All', ...Array.from(new Set(books.map(b => b.category)))], [books]);

  const filtered = useMemo(() => books.filter(b => {
    if (filterCat !== 'All' && b.category !== filterCat) return false;
    if (filterStatus !== 'All' && b.status !== filterStatus) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !(b.author || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [books, filterCat, filterStatus, search]);

  const counts = useMemo(() => ({
    toRead: books.filter(b => b.status === 'to-read').length,
    reading: books.filter(b => b.status === 'reading').length,
    done: books.filter(b => b.status === 'done').length,
  }), [books]);

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Learning & Planning</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">Books Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Reading list organized by category and investment style</p>
        </div>
        <button onClick={() => { setEditBook(null); setDialogOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-md shadow-primary/20 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Book
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'To Read', count: counts.toRead, color: 'text-muted-foreground', bg: 'glass-panel' },
          { label: 'Reading', count: counts.reading, color: 'text-amber-400', bg: 'glass-panel' },
          { label: 'Completed', count: counts.done, color: 'text-success', bg: 'glass-panel' }].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books..." className="pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary w-52" />
        </div>
        <div className="flex gap-1 p-1 bg-card rounded-xl">
          {['All', 'to-read', 'reading', 'done'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
              filterStatus === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}>{s === 'All' ? 'All' : STATUSES.find(x => x.value === s)?.label}</button>
          ))}
        </div>
        {usedCategories.length > 1 && (
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary">
            {usedCategories.map(c => <option key={c}>{c}</option>)}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 border border-dashed border-border rounded-3xl bg-card/30">
          <BookOpen className="w-16 h-16 text-muted-foreground/20" />
          <p className="text-muted-foreground">{books.length === 0 ? "No books yet. Add your first one!" : "No books match your filters."}</p>
          {books.length === 0 && (
            <button onClick={() => setDialogOpen(true)} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">
              <Plus className="w-4 h-4 inline mr-2" />Add Your First Book
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(book => (
            <BookCard key={book.id} book={book}
              onEdit={() => { setEditBook(book); setDialogOpen(true); }}
              onDelete={() => { if (confirm('Delete this book?')) deleteMutation.mutate(book.id); }}
            />
          ))}
        </div>
      )}

      {dialogOpen && <BookDialog book={editBook} onClose={() => { setDialogOpen(false); setEditBook(null); }} />}
    </div>
  );
}
