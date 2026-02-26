
import React, { useState } from 'react';
import { Collection, CardItem } from '../types';
import PaperButton from './PaperButton';
import { ICONS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

interface ListEditorProps {
  collection: Collection;
  onUpdate: (updated: Collection) => void;
  onBack: () => void;
  onShuffle: () => void;
}

const ListEditor: React.FC<ListEditorProps> = ({ collection, onUpdate, onBack, onShuffle }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ label: '', description: '', imageUrl: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordBuffer, setPasswordBuffer] = useState(collection.password || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality to save space
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        if (target === 'new') {
          setNewItem(prev => ({ ...prev, imageUrl: dataUrl }));
        } else {
          handleUpdateItem(target, { imageUrl: dataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addItem = () => {
    if (!newItem.label.trim()) return;
    const item: CardItem = {
      id: Math.random().toString(36).substr(2, 9),
      label: newItem.label,
      description: newItem.description,
      imageUrl: newItem.imageUrl,
      excluded: false
    };
    onUpdate({ ...collection, items: [item, ...collection.items] });
    setNewItem({ label: '', description: '', imageUrl: '' });
  };

  const handleUpdateItem = (id: string, updates: Partial<CardItem>) => {
    onUpdate({
      ...collection,
      items: collection.items.map(i => i.id === id ? { ...i, ...updates } : i)
    });
  };

  const handleRestoreAll = () => {
    if (window.confirm("Restore all excluded items to the active deck?")) {
      onUpdate({
        ...collection,
        items: collection.items.map(i => ({ ...i, excluded: false }))
      });
    }
  };

  const handleSavePassword = () => {
    onUpdate({ ...collection, password: passwordBuffer });
    setShowPasswordInput(false);
  };

  const handleClearPassword = () => {
    if(window.confirm("Remove password protection from this deck?")) {
      onUpdate({ ...collection, password: '' });
      setPasswordBuffer('');
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${collection.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_archive.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a helpful assistant generating lists for a randomizer app. 
        User Request: "${aiPrompt}".
        
        INSTRUCTIONS:
        1. If the user specifies a quantity (e.g., "100 numbers", "50 names") or a range (e.g., "1-95"), you MUST generate ALL of them. Do not truncate the list.
        2. If no quantity is specified, generate 8 creative items.
        3. Output a JSON array of objects.
        4. For 'label': The main text (e.g., "42" or "Dragon").
        5. For 'description': A short flavor text.
        6. For 'imageKeyword': A single keyword for finding a background image.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                description: { type: Type.STRING },
                imageKeyword: { type: Type.STRING }
              },
              required: ["label", "description", "imageKeyword"]
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      const newItems: CardItem[] = data.map((d: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        label: d.label,
        description: d.description,
        imageUrl: `https://images.unsplash.com/photo-1?auto=format&fit=crop&w=400&q=80&sig=${Math.random()}&keywords=${encodeURIComponent(d.imageKeyword)}`,
        excluded: false
      }));

      onUpdate({ ...collection, items: [...newItems, ...collection.items] });
      setAiPrompt('');
    } catch (error) {
      console.error(error);
      alert("Magic scribe failed. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <nav className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 sm:mb-10 pb-6 border-b-2 border-dashed border-parchment-ink/30 dark:border-parchment-silver/30">
        <button onClick={onBack} className="flex items-center gap-2 text-parchment-ink dark:text-parchment-silver typewriter-font hover:underline font-bold text-sm sm:text-base">
          <ICONS.Back /> BACK TO ARCHIVES
        </button>
        <div className="flex gap-4 w-full sm:w-auto">
          <PaperButton 
             variant="ghost" 
             onClick={handleExport}
             className="flex-1 sm:flex-none"
          >
            <ICONS.Download /> EXPORT
          </PaperButton>
          <PaperButton 
             variant="ghost" 
             onClick={handleRestoreAll} 
             className="flex-1 sm:flex-none border-parchment-ink/20 dark:border-parchment-silver/20"
             disabled={!collection.items.some(i => i.excluded)}
          >
            <ICONS.Eye /> RESTORE ALL
          </PaperButton>
          <PaperButton variant="primary" onClick={onShuffle} className="flex-1 sm:flex-none" disabled={collection.items.filter(i => !i.excluded).length === 0}>
            <ICONS.Shuffle /> SHUFFLE DECK
          </PaperButton>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left: Deck Settings & AI */}
        <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
          <div className="bg-white dark:bg-[#121212] p-6 paper-shadow border-2 border-parchment-ink dark:border-parchment-silver deckle-edge">
             <input 
              type="text" 
              value={collection.title}
              onChange={(e) => onUpdate({...collection, title: e.target.value})}
              placeholder="DECK NAME"
              className="paper-font text-3xl font-bold w-full border-b-2 border-parchment-ink/20 dark:border-parchment-silver/20 mb-4 focus:border-parchment-ink dark:focus:border-parchment-silver outline-none bg-transparent dark:text-white"
            />
            <textarea 
              value={collection.description}
              onChange={(e) => onUpdate({...collection, description: e.target.value})}
              placeholder="MANIFESTO"
              className="typewriter-font w-full h-20 text-sm italic outline-none resize-none bg-transparent dark:text-white/80"
            />
            
            {/* Password Protection Section */}
            <div className="mt-4 pt-4 border-t-2 border-dashed border-parchment-ink/10 dark:border-parchment-silver/10">
              <div className="flex justify-between items-center mb-2">
                 <h5 className="typewriter-font text-[10px] uppercase tracking-widest font-bold opacity-60 dark:text-white/60">
                   Security Protocol
                 </h5>
                 {collection.password && !showPasswordInput && (
                   <span className="text-[10px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                     <ICONS.Lock /> LOCKED
                   </span>
                 )}
              </div>
              
              {!showPasswordInput ? (
                collection.password ? (
                  <div className="flex gap-2">
                    <button onClick={() => setShowPasswordInput(true)} className="text-xs underline hover:text-parchment-accent dark:text-parchment-silver">Change Passphrase</button>
                    <span className="text-xs opacity-30">|</span>
                    <button onClick={handleClearPassword} className="text-xs text-red-500 hover:underline">Remove Lock</button>
                  </div>
                ) : (
                  <button onClick={() => setShowPasswordInput(true)} className="flex items-center gap-2 text-xs opacity-60 hover:opacity-100 transition-opacity dark:text-white">
                    <ICONS.Key /> Set Passphrase
                  </button>
                )
              ) : (
                <div className="space-y-2">
                  <input 
                    type="password"
                    value={passwordBuffer}
                    onChange={(e) => setPasswordBuffer(e.target.value)}
                    placeholder="Enter Secret..."
                    className="w-full bg-parchment-light/50 dark:bg-white/5 border border-parchment-ink/30 dark:border-parchment-silver/30 p-2 text-sm typewriter-font outline-none dark:text-white"
                  />
                  <div className="flex gap-2">
                     <PaperButton variant="primary" onClick={handleSavePassword} className="py-1 px-3 text-xs w-full">
                       SECURE
                     </PaperButton>
                     <button onClick={() => { setShowPasswordInput(false); setPasswordBuffer(collection.password || ''); }} className="text-xs underline opacity-50 dark:text-white">
                       Cancel
                     </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#121212] p-6 paper-shadow border-2 border-parchment-ink dark:border-parchment-silver">
            <h4 className="typewriter-font font-bold mb-4 uppercase tracking-tighter border-b border-parchment-ink/10 dark:border-parchment-silver/10 pb-2 dark:text-white">Draft New Card</h4>
            <div className="space-y-4">
              <input 
                type="text" 
                value={newItem.label}
                onChange={(e) => setNewItem({...newItem, label: e.target.value})}
                className="w-full bg-parchment-light/50 dark:bg-white/5 border-2 border-parchment-ink dark:border-parchment-silver p-2 typewriter-font placeholder:opacity-50 dark:text-white"
                placeholder="LABEL (REQUIRED)"
              />
              <input 
                type="text" 
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="w-full bg-parchment-light/50 dark:bg-white/5 border-2 border-parchment-ink dark:border-parchment-silver p-2 typewriter-font placeholder:opacity-50 dark:text-white"
                placeholder="DESCRIPTION"
              />
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})}
                  className="w-full bg-parchment-light/50 dark:bg-white/5 border-2 border-parchment-ink dark:border-parchment-silver p-2 typewriter-font placeholder:opacity-50 dark:text-white"
                  placeholder="IMAGE URL (OPTIONAL)"
                />
                <label className="cursor-pointer shrink-0">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'new')} />
                  <PaperButton as="div" variant="ghost" className="h-full border-2 border-parchment-ink dark:border-parchment-silver px-3">
                    <ICONS.Upload />
                  </PaperButton>
                </label>
              </div>
              {newItem.imageUrl && newItem.imageUrl.startsWith('data:image') && (
                <div className="w-full h-32 bg-gray-100 dark:bg-white/5 border border-parchment-ink/10 dark:border-parchment-silver/10 overflow-hidden rounded-sm relative">
                  <img src={newItem.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  <button onClick={() => setNewItem({...newItem, imageUrl: ''})} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500">
                    <ICONS.Trash />
                  </button>
                </div>
              )}
              <PaperButton variant="secondary" onClick={addItem} className="w-full">
                STAMP TO DECK
              </PaperButton>
            </div>
          </div>

          <div className="bg-[#4a4e69] dark:bg-[#0a0a0a] p-6 paper-shadow border-2 border-[#4a4e69] dark:border-parchment-silver text-white">
            <h4 className="typewriter-font font-bold mb-4 uppercase flex items-center gap-2">
               <span className="animate-pulse">✨</span> AI Scribe Assistant
            </h4>
            <textarea 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g. 'List numbers 1 to 50' or '10 fantasy potion names'"
              className="w-full bg-black/20 dark:bg-white/10 border border-white/30 p-2 text-sm typewriter-font mb-4 placeholder:text-white/40 h-24"
            />
            <PaperButton 
              variant="primary" 
              onClick={generateWithAI} 
              className="w-full border-white/50 text-[#1a1c2c] dark:text-white dark:border-white"
              disabled={isGenerating || !aiPrompt.trim()}
            >
              {isGenerating ? 'WRITING...' : 'GENERATE LIST'}
            </PaperButton>
          </div>
        </div>

        {/* Right: Card List */}
        <div className="lg:col-span-8 order-1 lg:order-2">
           <div className="flex justify-between items-end mb-6">
              <h3 className="paper-font text-3xl sm:text-4xl font-black italic uppercase dark:text-parchment-silver">The Repository</h3>
              <span className="typewriter-font text-xs opacity-50 dark:text-white/50">{collection.items.length} ENTRIES</span>
           </div>
           
           <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin pb-20">
              {collection.items.map(item => (
                <div 
                  key={item.id} 
                  className={`bg-white dark:bg-[#121212] border-2 border-parchment-ink dark:border-parchment-silver p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center group transition-all ${item.excluded ? 'opacity-40 grayscale' : 'paper-shadow'}`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-white/5 border border-parchment-ink/10 dark:border-parchment-silver/10 shrink-0 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-xl opacity-20 dark:text-white">?</span>
                    )}
                  </div>

                  <div className="flex-1 w-full">
                    {editingId === item.id ? (
                      <div className="space-y-3 p-2 bg-parchment-light/50 dark:bg-white/5 rounded">
                        <input 
                          autoFocus
                          className="w-full font-bold text-lg bg-transparent border-b border-parchment-ink dark:border-parchment-silver outline-none dark:text-white"
                          value={item.label}
                          onChange={(e) => handleUpdateItem(item.id, { label: e.target.value })}
                          placeholder="Label"
                        />
                        <input 
                          className="w-full text-xs italic bg-transparent border-b border-parchment-ink/20 dark:border-parchment-silver/20 outline-none dark:text-white/80"
                          value={item.description || ''}
                          onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                          placeholder="Description..."
                        />
                         <div className="flex gap-2">
                           <input 
                              className="flex-1 text-xs bg-transparent border-b border-parchment-ink/20 dark:border-parchment-silver/20 outline-none dark:text-white/80"
                              value={item.imageUrl || ''}
                              onChange={(e) => handleUpdateItem(item.id, { imageUrl: e.target.value })}
                              placeholder="Image URL..."
                            />
                            <label className="cursor-pointer">
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, item.id)} />
                              <span className="text-xs text-blue-500 hover:text-blue-700 uppercase font-bold px-2">Upload</span>
                            </label>
                             <button 
                              onClick={() => handleUpdateItem(item.id, { imageUrl: '' })}
                              className="text-xs text-red-500 hover:text-red-700 uppercase font-bold"
                              title="Remove Image"
                             >
                               Clear
                             </button>
                         </div>
                        <div className="text-right">
                           <button onClick={() => setEditingId(null)} className="text-xs underline opacity-50 dark:text-white">Done</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => setEditingId(item.id)} className="cursor-text w-full">
                        <h4 className="paper-font text-xl font-bold leading-none mb-1 dark:text-white">{item.label}</h4>
                        <p className="typewriter-font text-[10px] uppercase tracking-widest opacity-60 truncate dark:text-white/60">{item.description || 'No description'}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 opacity-100 sm:opacity-30 sm:group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-dashed border-black/10">
                    <button 
                      onClick={() => handleUpdateItem(item.id, { excluded: !item.excluded })}
                      className="p-2 hover:bg-black/5 dark:hover:bg-white/5 dark:text-white"
                      title={item.excluded ? "Include" : "Exclude"}
                    >
                      {item.excluded ? <ICONS.EyeOff /> : <ICONS.Eye />}
                    </button>
                    <button 
                      onClick={() => onUpdate({ ...collection, items: collection.items.filter(i => i.id !== item.id) })}
                      className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <ICONS.Trash />
                    </button>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ListEditor;