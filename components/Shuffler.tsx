import React, { useState, useEffect } from 'react';
import { Collection, CardItem } from '../types';
import PaperButton from './PaperButton';
import CardDisplay from './CardDisplay';
import { ICONS } from '../constants';

interface ShufflerProps {
  collection: Collection;
  onUpdate: (updated: Collection) => void;
  onBack: () => void;
}

const Shuffler: React.FC<ShufflerProps> = ({ collection, onUpdate, onBack }) => {
  const [availableItems, setAvailableItems] = useState<CardItem[]>([]);
  const [currentCard, setCurrentCard] = useState<CardItem | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [history, setHistory] = useState<CardItem[]>([]);

  // Initialize deck only when entering a new collection
  useEffect(() => {
    setAvailableItems(collection.items.filter(i => !i.excluded));
    setCurrentCard(null);
    setHistory([]);
  }, [collection.id]); 

  const handleShuffle = () => {
    if (availableItems.length === 0 || isShuffling) return;
    setIsShuffling(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * availableItems.length);
      const picked = availableItems[randomIndex];
      setCurrentCard(picked);
      setAvailableItems(prev => prev.filter(i => i.id !== picked.id));
      setHistory(prev => [picked, ...prev]);
      setIsShuffling(false);
    }, 600);
  };

  const resetStack = () => {
    // Reload items from props to ensure we get the latest exclusions
    setAvailableItems(collection.items.filter(i => !i.excluded));
    setCurrentCard(null);
    setHistory([]);
  };

  const toggleBurnCurrent = () => {
    if (!currentCard) return;
    const isExcluded = currentCard.excluded;
    const updatedItem = { ...currentCard, excluded: !isExcluded };
    
    setCurrentCard(updatedItem); // Update local display
    
    // Update global collection without resetting the current shuffle session
    onUpdate({
        ...collection,
        items: collection.items.map(i => i.id === currentCard.id ? updatedItem : i)
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-col items-center">
      <nav className="w-full flex justify-between items-center mb-10 border-b-2 border-parchment-ink/10 dark:border-parchment-silver/10 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-parchment-ink dark:text-parchment-silver typewriter-font font-black hover:underline uppercase text-xs sm:text-sm">
          <ICONS.Back /> CEASE OPERATION
        </button>
        <div className="text-right hidden sm:block">
          <div className="typewriter-font font-black opacity-40 uppercase tracking-widest text-[10px] dark:text-white/50">CURRENT DECK</div>
          <div className="paper-font text-2xl font-black italic tracking-tighter uppercase dark:text-parchment-silver">{collection.title}</div>
        </div>
      </nav>

      <div className="flex flex-col xl:flex-row gap-12 items-start w-full justify-center">
        <div className="flex-1 w-full flex flex-col items-center">
          <div className="relative w-full max-w-[320px]">
            <CardDisplay 
                card={currentCard} 
                isShuffling={isShuffling} 
                isEmpty={availableItems.length === 0 && !currentCard} 
                remainingCount={availableItems.length}
            />
            {currentCard && (
                <button 
                    onClick={toggleBurnCurrent}
                    className="absolute -right-12 top-0 p-2 rounded-full bg-white dark:bg-[#121212] border-2 border-parchment-ink dark:border-parchment-silver paper-shadow hover:scale-110 transition-transform z-50"
                    title={currentCard.excluded ? "Restore to rotation" : "Burn (Exclude from future decks)"}
                >
                    {currentCard.excluded ? (
                         <span className="text-green-600"><ICONS.Eye /></span>
                    ) : (
                         <span className="text-red-500"><ICONS.EyeOff /></span>
                    )}
                </button>
            )}
            {currentCard?.excluded && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 typewriter-font uppercase tracking-widest z-50 rounded-sm pointer-events-none">
                    BURNED
                </div>
            )}
          </div>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <PaperButton 
              onClick={handleShuffle} 
              variant="secondary" 
              className="flex-1 py-4 sm:py-6 text-xl sm:text-2xl"
              disabled={availableItems.length === 0 || isShuffling}
            >
              <ICONS.Shuffle /> DRAW CARD
            </PaperButton>
            <PaperButton 
              onClick={resetStack} 
              variant="primary" 
              className="py-4 sm:py-6"
              disabled={isShuffling}
            >
              RECYCLE DECK
            </PaperButton>
          </div>

          <div className="mt-6 typewriter-font text-[10px] font-black uppercase tracking-[0.4em] opacity-40 dark:text-white/40 text-center">
             REMAINING IN ARCHIVE: {availableItems.length}
          </div>
        </div>

        <aside className="w-full xl:w-80 bg-white dark:bg-[#121212] border-2 border-parchment-ink dark:border-parchment-silver p-6 h-64 xl:h-[600px] flex flex-col paper-shadow deckle-edge">
          <h4 className="paper-font font-black text-2xl italic mb-6 border-b border-parchment-ink/20 dark:border-parchment-silver/20 pb-2 dark:text-parchment-silver">CHRONOLOGY</h4>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
            {history.length === 0 ? (
              <div className="text-center py-10 opacity-20 typewriter-font italic text-xs uppercase tracking-widest dark:text-white">
                No past events
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className={`border p-3 flex items-center gap-3 ${item.excluded ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-parchment-light/30 dark:bg-white/5 border-parchment-ink/10 dark:border-parchment-silver/10'}`}>
                  <span className="typewriter-font font-black opacity-30 text-[10px] dark:text-white">{history.length - idx}</span>
                  <div className="flex-1 overflow-hidden">
                    <div className={`paper-font font-bold truncate text-sm dark:text-white ${item.excluded ? 'line-through opacity-50' : ''}`}>{item.label}</div>
                  </div>
                  {item.excluded && <span className="text-[10px] text-red-500 font-bold">BURNED</span>}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Shuffler;