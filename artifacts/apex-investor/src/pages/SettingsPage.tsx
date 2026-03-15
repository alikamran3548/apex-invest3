import { useState, useRef } from 'react';
import {
  Palette, Download, Upload, CheckCircle, AlertCircle, Loader2,
  ShieldCheck, Database, RefreshCw, Layers, Type, Circle, Sparkles,
  CornerDownRight, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, THEMES, type ThemeId, type CardStyle, type FontStyle, type RadiusStyle } from '@/lib/theme';
import { useQueryClient } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

type ImportMode = 'append' | 'replace';
interface ImportResult { success: boolean; imported?: Record<string, number>; error?: string; }

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ icon, color, title, subtitle, children }: {
  icon: React.ReactNode; color: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className="glass-panel rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme, ui, setUI } = useTheme();
  const queryClient = useQueryClient();

  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('append');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${BASE}/api/data/export`);
      const blob = await res.blob();
      const filename = res.headers.get('Content-Disposition')?.match(/filename="(.+?)"/)?.[1]
        || `apex-investor-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch { alert('Export failed. Please try again.'); }
    finally { setExporting(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (!json.data || json.app !== 'APEX Investor') {
          setImportResult({ success: false, error: 'Invalid file format. Use a file exported from APEX Investor.' });
          return;
        }
        if (importMode === 'replace' && !confirm('⚠️ This will DELETE all existing data and replace it. Are you sure?')) {
          setImportFileName(''); if (fileRef.current) fileRef.current.value = ''; return;
        }
        setImporting(true);
        const res = await fetch(`${BASE}/api/data/import`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: json.data, mode: importMode }),
        });
        const result = await res.json();
        setImportResult(result);
        if (result.success) queryClient.invalidateQueries();
      } catch { setImportResult({ success: false, error: 'Failed to parse file.' }); }
      finally { setImporting(false); if (fileRef.current) fileRef.current.value = ''; }
    };
    reader.readAsText(file);
  };

  const aTierThemes = THEMES.filter(t => !t.tier);
  const sTierThemes = THEMES.filter(t => t.tier === 'S');

  const ThemeCard = ({ t }: { t: typeof THEMES[0] }) => {
    const active = theme === t.id;
    return (
      <button
        onClick={() => setTheme(t.id as ThemeId)}
        className={cn(
          "relative p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-100 duration-200",
          active ? "border-primary shadow-lg shadow-primary/20" : "border-border hover:border-border/80"
        )}
        style={{ background: t.preview.bg }}
      >
        <div className="flex gap-1.5 mb-3">
          <div className="w-5 h-5 rounded-full border-2 border-white/10" style={{ background: t.preview.bg }} />
          <div className="w-5 h-5 rounded-full shadow" style={{ background: t.preview.primary }} />
          <div className="w-5 h-5 rounded-full border-2 border-white/8" style={{ background: t.preview.card }} />
        </div>
        <p className="text-sm font-bold" style={{ color: t.preview.primary }}>{t.name}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{t.description}</p>
        {active && (
          <div className="absolute top-3 right-3">
            <CheckCircle className="w-4 h-4" style={{ color: t.preview.primary }} />
          </div>
        )}
        {t.tier === 'S' && !active && (
          <div className="absolute top-3 right-3">
            <Star className="w-3.5 h-3.5" style={{ color: t.preview.primary, opacity: 0.7 }} />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6 pb-24 max-w-3xl">
      <header className="border-b border-border/50 pb-5">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">System</p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalise your APEX Investor experience</p>
      </header>

      {/* ── THEMES ──────────────────────────────────────────────────── */}
      <SectionCard
        icon={<Palette className="w-5 h-5 text-primary" />}
        color="bg-primary/10"
        title="Colour Theme"
        subtitle="Choose your preferred colour scheme — themes apply instantly"
      >
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Standard Themes</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {aTierThemes.map(t => <ThemeCard key={t.id} t={t} />)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">S-Tier Themes</p>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary tracking-wide">EXCLUSIVE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {sTierThemes.map(t => <ThemeCard key={t.id} t={t} />)}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Your theme choice is saved locally and persists across sessions.</p>
      </SectionCard>

      {/* ── S-TIER UI OPTIONS ────────────────────────────────────────── */}
      <SectionCard
        icon={<Sparkles className="w-5 h-5 text-amber-400" />}
        color="bg-amber-400/10"
        title="S-Tier UI"
        subtitle="Premium layout and style options that transform the whole app"
      >

        {/* Card Style */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">Card Style</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { value: 'glass',    label: 'Glassmorphism', desc: 'Frosted glass panels with blur' },
              { value: 'solid',    label: 'Solid',         desc: 'Opaque cards, clean borders' },
              { value: 'minimal',  label: 'Minimal',       desc: 'Transparent, barely there' },
              { value: 'terminal', label: 'Terminal',      desc: 'CRT scanlines, accent glow' },
            ] as { value: CardStyle; label: string; desc: string }[]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setUI({ cardStyle: opt.value })}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.01]",
                  ui.cardStyle === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                )}
              >
                <p className={cn("text-sm font-bold", ui.cardStyle === opt.value ? "text-primary" : "text-muted-foreground")}>{opt.label}</p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Font Style */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">Typography</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'sans',  label: 'Modern Sans',  sample: 'Aa',  desc: 'DM Sans — clean & readable' },
              { value: 'serif', label: 'Elegant Serif', sample: 'Aa', desc: 'Playfair Display — classic finance' },
              { value: 'mono',  label: 'Monospace',    sample: 'Aa',  desc: 'JetBrains Mono — terminal precision' },
            ] as { value: FontStyle; label: string; sample: string; desc: string }[]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setUI({ fontStyle: opt.value })}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.01]",
                  ui.fontStyle === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                )}
              >
                <p
                  className={cn("text-2xl font-bold mb-1", ui.fontStyle === opt.value ? "text-primary" : "text-muted-foreground")}
                  style={{
                    fontFamily: opt.value === 'sans' ? "'DM Sans', sans-serif"
                      : opt.value === 'serif' ? "'Playfair Display', Georgia, serif"
                      : "'JetBrains Mono', monospace"
                  }}
                >
                  {opt.sample}
                </p>
                <p className={cn("text-xs font-bold", ui.fontStyle === opt.value ? "text-primary" : "text-muted-foreground")}>{opt.label}</p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CornerDownRight className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">Corner Style</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'sharp',   label: 'Sharp',   preview: 4  },
              { value: 'rounded', label: 'Rounded', preview: 12 },
              { value: 'pill',    label: 'Pill',    preview: 28 },
            ] as { value: RadiusStyle; label: string; preview: number }[]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setUI({ radiusStyle: opt.value })}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.01] flex items-center gap-3",
                  ui.radiusStyle === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                )}
              >
                <div
                  className={cn("w-8 h-8 flex-shrink-0 border-2", ui.radiusStyle === opt.value ? "border-primary bg-primary/10" : "border-muted-foreground/30 bg-muted/40")}
                  style={{ borderRadius: opt.preview }}
                />
                <p className={cn("text-sm font-bold", ui.radiusStyle === opt.value ? "text-primary" : "text-muted-foreground")}>{opt.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Glow Effects toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/40">
          <div className="flex items-center gap-3">
            <Circle className={cn("w-5 h-5 transition-colors", ui.glowEffects ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="text-sm font-bold text-foreground">Glow Effects</p>
              <p className="text-xs text-muted-foreground">Adds ambient glow to cards and primary elements</p>
            </div>
          </div>
          <button
            onClick={() => setUI({ glowEffects: !ui.glowEffects })}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors duration-300",
              ui.glowEffects ? "bg-primary" : "bg-muted"
            )}
          >
            <div
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300",
                ui.glowEffects ? "left-6" : "left-1"
              )}
            />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">All UI options apply instantly and are saved in your browser.</p>
      </SectionCard>

      {/* ── EXPORT ───────────────────────────────────────────────────── */}
      <SectionCard
        icon={<Database className="w-5 h-5 text-success" />}
        color="bg-success/10"
        title="Export Data"
        subtitle="Download a complete backup of all your data as a single JSON file"
      >
        <div className="bg-background/50 border border-border/50 rounded-xl p-4 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Exports all entries, portfolio positions, watchlist, books, resources, roadmap PDFs, and investor profiles into a single <span className="text-foreground font-medium">.json</span> backup.
          </p>
          <div className="grid grid-cols-2 gap-1">
            {['All section entries & notes', 'Portfolio positions with thesis', 'Watchlist stocks', 'Books library', 'Courses & resources', 'Roadmap PDFs', 'Investor wisdom profiles'].map(item => (
              <p key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle className="w-3 h-3 text-success flex-shrink-0" /> {item}
              </p>
            ))}
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md",
            exportDone ? "bg-success text-success-foreground shadow-success/20" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20",
            "disabled:opacity-70 disabled:cursor-not-allowed"
          )}
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : exportDone ? <CheckCircle className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Exporting...' : exportDone ? 'Downloaded!' : 'Export All Data'}
        </button>
      </SectionCard>

      {/* ── IMPORT ───────────────────────────────────────────────────── */}
      <SectionCard
        icon={<Upload className="w-5 h-5 text-amber-400" />}
        color="bg-amber-400/10"
        title="Import Data"
        subtitle="Restore data from a previous backup file"
      >
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Import Mode</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'append',  label: 'Add to Existing', desc: 'Keeps your current data and adds imported items on top', icon: RefreshCw, active: 'border-primary bg-primary/5', ic: 'text-blue-400' },
              { value: 'replace', label: 'Replace All',      desc: 'Deletes all current data first. Cannot be undone.',     icon: ShieldCheck, active: 'border-destructive bg-destructive/5', ic: 'text-destructive' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setImportMode(opt.value)}
                className={cn("p-4 rounded-xl border-2 text-left transition-all", importMode === opt.value ? opt.active : "border-border hover:border-border/80")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <opt.icon className={cn("w-4 h-4", importMode === opt.value ? opt.ic : "text-muted-foreground")} />
                  <span className={cn("text-sm font-bold", importMode === opt.value ? "text-foreground" : "text-muted-foreground")}>{opt.label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        <button
          onClick={() => { setImportResult(null); setImportFileName(''); fileRef.current?.click(); }}
          disabled={importing}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full justify-center"
        >
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {importing ? 'Importing...' : 'Choose Backup File (.json)'}
        </button>

        {importResult && (
          <div className={cn("p-4 rounded-xl border", importResult.success ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30")}>
            <div className="flex items-center gap-2 mb-2">
              {importResult.success ? <CheckCircle className="w-5 h-5 text-success" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
              <span className={cn("font-bold text-sm", importResult.success ? "text-success" : "text-destructive")}>
                {importResult.success ? 'Import Successful' : 'Import Failed'}
              </span>
            </div>
            {importResult.success && importResult.imported && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {Object.entries(importResult.imported).map(([key, count]) => count > 0 && (
                  <div key={key} className="bg-background/50 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-success">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                  </div>
                ))}
              </div>
            )}
            {importResult.error && <p className="text-sm text-destructive/80 mt-1">{importResult.error}</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Only <span className="text-foreground font-medium">.json</span> files exported from APEX Investor are supported.</p>
      </SectionCard>
    </div>
  );
}
