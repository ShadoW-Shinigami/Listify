import React from 'react';
import { CardItem } from '../types';

interface CardDisplayProps {
  card: CardItem | null;
  isShuffling: boolean;
  isEmpty: boolean;
  remainingCount: number;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ card, isShuffling, isEmpty, remainingCount }) => {
  return (
    <div className={`relative w-full max-w-[320px] aspect-[2/3] mx-auto perspective-1000 ${isShuffling ? 'animate-shuffle' : ''}`}>
      {/* Dynamic Stack visualization */}
      {Array.from({ length: Math.min(5, remainingCount) }).map((_, i) => (
        <div 
          key={i}
          className="absolute inset-0 bg-white dark:bg-[#1a1a1a] border-2 border-parchment-ink dark:border-parchment-silver rounded-sm paper-shadow"
          style={{ 
            transform: `translate(${i * 2}px, ${i * 2}px)`,
            zIndex: -i - 1,
            opacity: 1 - (i * 0.15)
          }}
        />
      ))}
      
      {/* Active Card */}
      <div className={`absolute inset-0 bg-white dark:bg-[#121212] border-4 border-parchment-ink dark:border-parchment-silver rounded-sm paper-shadow deckle-edge flex flex-col items-center p-6 text-center transition-all duration-300 ${isShuffling ? 'opacity-50 grayscale scale-95' : 'opacity-100'}`}>
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-4xl mb-4">🕳️</div>
            <div className="text-parchment-ink dark:text-parchment-silver typewriter-font italic font-black text-xl uppercase tracking-tighter">
              Void of Choice
            </div>
            <p className="text-[10px] mt-2 opacity-60 dark:opacity-40 typewriter-font uppercase">Recycle the deck to continue</p>
          </div>
        ) : isShuffling ? (
          <div className="h-full flex flex-col items-center justify-center">
             <div className="paper-font text-5xl font-black italic opacity-20">MIXING...</div>
          </div>
        ) : card ? (
          <div className="flex flex-col h-full w-full overflow-hidden">
            <div className="text-[10px] typewriter-font uppercase tracking-[0.4em] opacity-40 mb-4 border-b border-parchment-ink/10 dark:border-parchment-silver/10 pb-2 shrink-0">
              RESULT #{card.id.slice(-4)}
            </div>
            
            {card.imageUrl ? (
              <div className="w-full h-48 mb-6 overflow-hidden border-2 border-parchment-ink dark:border-parchment-silver p-1 bg-white dark:bg-black/20 shrink-0">
                <img 
                  src={card.imageUrl} 
                  alt={card.label} 
                  className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                />
              </div>
            ) : <div className="flex-1 max-h-8"></div>}
            
            <div className="flex-1 flex flex-col justify-center min-h-0">
              <h2 className="paper-font text-3xl sm:text-4xl font-black text-parchment-ink dark:text-parchment-silver mb-2 leading-none uppercase tracking-tighter line-clamp-3">
                {card.label}
              </h2>
              {card.description && (
                <div className="overflow-y-auto max-h-24 scrollbar-thin">
                  <p className="typewriter-font text-xs sm:text-sm text-parchment-ink dark:text-parchment-silver italic opacity-80 border-l-2 border-parchment-ink/20 dark:border-parchment-silver/20 pl-4 py-1">
                    {card.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 w-full flex justify-between items-center opacity-30 typewriter-font text-[8px] uppercase tracking-widest font-black shrink-0">
              <span>BUREAU OF CHANCE</span>
              <span>GEN-X-01</span>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <div className="paper-font text-4xl font-black italic">READY?</div>
            <p className="typewriter-font text-[10px] mt-2 uppercase tracking-widest">Awaiting the pull</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardDisplay;