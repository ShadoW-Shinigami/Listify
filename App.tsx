import React, { useState, useEffect } from 'react';
import { Collection, ViewState } from './types';
import Dashboard from './components/Dashboard';
import ListEditor from './components/ListEditor';
import Shuffler from './components/Shuffler';

const STORAGE_KEY = 'papyrus_shuffle_data';
const THEME_KEY = 'papyrus_shuffle_theme';

const App: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setCollections(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const theme = localStorage.getItem(THEME_KEY);
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  }, [collections]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  };

  const handleCreateCollection = () => {
    const newCol: Collection = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'NEW DECK',
      description: 'The purpose of this collection...',
      items: [],
      createdAt: Date.now()
    };
    setCollections([newCol, ...collections]);
    setSelectedCollectionId(newCol.id);
    setCurrentView('editor');
  };

  const handleDeleteCollection = (id: string) => {
    if (window.confirm('Delete this archive? This cannot be undone.')) {
      setCollections(collections.filter(c => c.id !== id));
    }
  };

  const handleUpdateCollection = (updated: Collection) => {
    setCollections(collections.map(c => c.id === updated.id ? updated : c));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.id && imported.title !== undefined && Array.isArray(imported.items)) {
          imported.id = Math.random().toString(36).substr(2, 9);
          setCollections(prev => [imported, ...prev]);
        } else {
          alert('Invalid archive format.');
        }
      } catch (err) { alert('Invalid archive file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectedCollection = collections.find(c => c.id === selectedCollectionId);

  return (
    <div className="min-h-screen">
      {currentView === 'dashboard' && (
        <Dashboard 
          collections={collections} 
          onSelect={(c) => { setSelectedCollectionId(c.id); setCurrentView('editor'); }} 
          onCreate={handleCreateCollection}
          onDelete={handleDeleteCollection}
          onImport={handleImport}
          onToggleTheme={toggleTheme}
        />
      )}

      {currentView === 'editor' && selectedCollection && (
        <ListEditor 
          collection={selectedCollection}
          onUpdate={handleUpdateCollection}
          onBack={() => setCurrentView('dashboard')}
          onShuffle={() => setCurrentView('shuffler')}
        />
      )}

      {currentView === 'shuffler' && selectedCollection && (
        <Shuffler 
          collection={selectedCollection}
          onUpdate={handleUpdateCollection}
          onBack={() => setCurrentView('editor')}
        />
      )}
      
      <footer className="fixed bottom-4 left-6 flex items-center gap-4 opacity-10 pointer-events-none hover:opacity-100 transition-opacity">
        <span className="typewriter-font text-[10px] font-black uppercase tracking-[0.5em] dark:text-white">DECISION ARCHIVE • BUREAU 2025</span>
      </footer>
    </div>
  );
};

export default App;