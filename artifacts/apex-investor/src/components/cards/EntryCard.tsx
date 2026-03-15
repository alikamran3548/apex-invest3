import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Archive, Clock, MoreVertical, Tag, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Entry } from '@workspace/api-client-react';

interface EntryCardProps {
  entry: Entry;
  onToggleStar: (id: number) => void;
  onToggleArchive: (id: number) => void;
  onEdit: (entry: Entry) => void;
  onDelete: (id: number) => void;
}

export function EntryCard({ entry, onToggleStar, onToggleArchive, onEdit, onDelete }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative bg-card border rounded-2xl overflow-hidden transition-all duration-300",
        entry.starred ? "border-primary/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]" : "border-border hover:border-primary/30 hover:shadow-lg hover:shadow-black/20"
      )}
    >
      {entry.starred && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      )}
      
      <div className="p-5">
        <div className="flex justify-between items-start gap-4">
          <div 
            className="flex-1 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {format(new Date(entry.createdAt), 'MMM d, yyyy')}
              </span>
              {entry.sectionName && (
                <>
                  <span className="text-border text-xs">•</span>
                  <span className="text-xs font-medium text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                    {entry.sectionName}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              {entry.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-1 relative z-10">
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleStar(entry.id); }}
              className={cn("p-2 rounded-full transition-colors", entry.starred ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-muted")}
            >
              <Star className={cn("w-4 h-4", entry.starred && "fill-current")} />
            </button>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-40 glass-panel rounded-xl overflow-hidden z-50 py-1"
                    >
                      <button 
                        onClick={() => { onEdit(entry); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button 
                        onClick={() => { onToggleArchive(entry.id); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5 flex items-center gap-2"
                      >
                        <Archive className="w-4 h-4" /> {entry.archived ? 'Unarchive' : 'Archive'}
                      </button>
                      <button 
                        onClick={() => { onDelete(entry.id); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && entry.content && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div 
                className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground max-w-none mt-4 pt-4 border-t border-border/50"
                dangerouslySetInnerHTML={{ __html: entry.content }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
            {entry.tags.map(tag => (
              <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-muted-foreground" />
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {!expanded && entry.content && (
          <div 
            onClick={() => setExpanded(true)}
            className="mt-4 text-sm text-muted-foreground line-clamp-2 cursor-pointer hover:text-foreground transition-colors relative"
          >
            <div dangerouslySetInnerHTML={{ __html: entry.content.replace(/<[^>]*>?/gm, ' ') }} />
            <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-t from-card to-transparent pointer-events-none" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
