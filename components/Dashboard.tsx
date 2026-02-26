
import React, { useState } from 'react';
import { Collection } from '../types';
import PaperButton from './PaperButton';
import { ICONS } from '../constants';

interface DashboardProps {
  collections: Collection[];
  onSelect: (c: Collection) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ collections, onSelect, onCreate, onDelete, onImport, onToggleTheme }) => {
  const [authTarget, setAuthTarget] = useState<Collection | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const handleCollectionClick = (col: Collection) => {
    if (col.password && col.password.trim() !== "") {
      setAuthTarget(col);
      setAuthError(false);
      setPasswordInput('');
    } else {
      onSelect(col);
    }
  };

  const verifyPassword = () => {
    if (authTarget && passwordInput === authTarget.password) {
      onSelect(authTarget);
      setAuthTarget(null);
      setPasswordInput('');
    } else {
      setAuthError(true);
      // Shake effect timeout
      setTimeout(() => setAuthError(false), 500);
    }
  };

  const handleExport = (e: React.MouseEvent, col: Collection) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(col, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${col.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_archive.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 sm:py-16 relative">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
        <div>
          <h1 className="paper-font text-5xl sm:text-7xl font-black italic tracking-tighter text-parchment-ink dark:text-parchment-silver leading-none">
            THE ARCHIVES
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
             <p className="typewriter-font text-sm opacity-60 uppercase tracking-[0.3em] dark:text-white/60">Decision Bureau v2.0</p>
             <button onClick={onToggleTheme} className="w-fit text-xs typewriter-font border border-parchment-ink/20 dark:border-parchment-silver/20 px-2 py-1 hover:bg-parchment-ink hover:text-white dark:text-parchment-silver dark:hover:bg-parchment-silver dark:hover:text-black transition-colors">
               TOGGLE DARKROOM
             </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <label className="cursor-pointer flex-1 lg:flex-none">
            <input type="file" className="hidden" onChange={onImport} />
            <PaperButton as="div" variant="ghost" className="w-full lg:w-auto">
              <ICONS.Upload /> IMPORT DECK
            </PaperButton>
          </label>
          <PaperButton variant="secondary" onClick={onCreate} className="flex-1 lg:flex-none px-8 text-lg w-full lg:w-auto">
            <ICONS.Plus /> NEW ARCHIVE
          </PaperButton>
        </div>
      </header>

      {/* Security Check Modal */}
      {authTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-parchment-ink/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#121212] w-full max-w-md p-8 border-4 border-parchment-ink dark:border-parchment-silver deckle-edge paper-shadow relative">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-parchment-ink text-white dark:bg-parchment-silver dark:text-black mb-4">
                <ICONS.Lock />
              </div>
              <h3 className="paper-font text-3xl font-bold uppercase dark:text-white">Restricted Access</h3>
              <p className="typewriter-font text-xs uppercase tracking-widest opacity-60 dark:text-white/60">
                "{authTarget.title}" is classified.
              </p>
            </div>
            
            <input 
              type="password" 
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
              placeholder="ENTER PASSPHRASE"
              className={`w-full bg-parchment-light/50 dark:bg-white/5 border-2 p-3 text-center typewriter-font font-bold mb-4 outline-none transition-all dark:text-white ${authError ? 'border-red-500 text-red-500 animate-[shake_0.5s_ease-in-out]' : 'border-parchment-ink dark:border-parchment-silver'}`}
            />
            
            <div className="flex gap-4">
              <PaperButton variant="ghost" onClick={() => setAuthTarget(null)} className="flex-1">
                ABORT
              </PaperButton>
              <PaperButton variant="primary" onClick={verifyPassword} className="flex-1">
                UNLOCK
              </PaperButton>
            </div>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="py-32 border-4 border-dashed border-parchment-ink/10 dark:border-parchment-silver/10 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-6 opacity-10 dark:text-white">📜</div>
          <h2 className="paper-font text-3xl font-bold opacity-40 dark:text-white/40">The registry is empty.</h2>
          <button onClick={onCreate} className="mt-4 typewriter-font text-parchment-ink dark:text-parchment-silver underline font-black">
            Inaugurate your first deck
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
          {collections.map(col => (
            <div 
              key={col.id} 
              onClick={() => handleCollectionClick(col)}
              className="group relative bg-white dark:bg-[#121212] border-2 border-parchment-ink dark:border-parchment-silver p-8 paper-shadow deckle-edge cursor-pointer transition-all hover:-translate-y-2 hover:rotate-1"
            >
              {/* Folder tab decoration */}
              <div className="absolute -top-3 left-6 w-20 h-6 bg-parchment-ink dark:bg-parchment-silver -z-10 rounded-t-sm group-hover:w-24 transition-all"></div>
              
              {/* Lock Indicator */}
              {col.password && (
                <div className="absolute top-4 right-4 text-parchment-ink/40 dark:text-parchment-silver/40">
                  <ICONS.Lock />
                </div>
              )}

              <h3 className="paper-font text-3xl font-black leading-tight mb-4 group-hover:underline dark:text-parchment-silver">
                {col.title || 'Untitled Archive'}
              </h3>
              
              <p className="typewriter-font text-sm italic opacity-60 line-clamp-3 mb-6 dark:text-white/60">
                {col.description || 'N/A'}
              </p>

              <div className="mt-auto pt-4 border-t border-parchment-ink/10 dark:border-parchment-silver/10 flex justify-between items-center text-[10px] typewriter-font uppercase tracking-widest font-black dark:text-white/50">
                <span>{col.items.length} CARDS</span>
                <span className="opacity-40">{new Date(col.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="absolute bottom-4 right-4 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleExport(e, col)}
                  className="p-2 text-parchment-ink/40 hover:text-parchment-ink dark:text-parchment-silver/40 dark:hover:text-white hover:bg-parchment-ink/5 dark:hover:bg-white/5 rounded-full"
                  title="Export Archive"
                >
                  <ICONS.Download />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(col.id); }}
                  className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                  title="Delete Archive"
                >
                  <ICONS.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;