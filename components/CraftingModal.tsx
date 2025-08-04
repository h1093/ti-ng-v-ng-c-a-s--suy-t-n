import React from 'react';
import type { Character, Recipe } from '../types';

interface CraftingModalProps {
  character: Character;
  allRecipes: Record<string, Recipe>;
  onCraft: (recipe: Recipe) => void;
  onClose: () => void;
}

const CraftingModal: React.FC<CraftingModalProps> = ({ character, allRecipes, onCraft, onClose }) => {
  const knownRecipes = character.knownRecipeIds.map(id => allRecipes[id]).filter(Boolean);

  const canCraft = (recipe: Recipe): boolean => {
    if (character.godMode) return true;
    for (const material of recipe.materials) {
      const hasAmount = character.inventory[material.name] || 0;
      if (hasAmount < material.quantity) {
        return false;
      }
    }
    return true;
  };

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crafting-title"
    >
        <div 
            className="w-full max-w-4xl h-[80vh] flex flex-col bg-gray-900 border border-gray-700 rounded-lg shadow-2xl shadow-green-900/20"
            onClick={(e) => e.stopPropagation()}
        >
            <header className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 id="crafting-title" className="text-2xl font-bold text-green-500">Chế Tạo</h2>
                <button 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-white text-2xl"
                    aria-label="Đóng cửa sổ chế tạo"
                >
                    &times;
                </button>
            </header>

            <main className="flex-grow overflow-y-auto p-4 space-y-4">
                {knownRecipes.length > 0 ? (
                    knownRecipes.map(recipe => {
                        const isCraftable = canCraft(recipe);
                        return (
                            <div key={recipe.id} className="p-4 bg-black/30 border border-gray-800 rounded-md flex flex-col md:flex-row items-start md:items-center gap-4">
                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold text-green-300">{recipe.name}</h3>
                                    <p className="text-sm text-gray-400 mb-2">{recipe.description}</p>
                                    <div className="text-xs">
                                        <span className="font-semibold text-gray-300">Vật liệu: </span>
                                        {recipe.materials.map((mat, index) => {
                                            const hasAmount = character.inventory[mat.name] || 0;
                                            const color = hasAmount >= mat.quantity ? 'text-green-400' : 'text-red-400';
                                            return (
                                                <span key={mat.name} className="mr-2">
                                                    {mat.name} <span className={color}>({hasAmount}/{mat.quantity})</span>
                                                    {index < recipe.materials.length - 1 ? ', ' : ''}
                                                </span>
                                            )
                                        })}
                                    </div>
                                    <p className="text-xs mt-1"><span className="font-semibold text-gray-300">Kết quả: </span>{recipe.result.name} x{recipe.result.quantity}</p>
                                </div>
                                <div className="flex-shrink-0 w-full md:w-auto">
                                    <button 
                                        onClick={() => onCraft(recipe)}
                                        disabled={!isCraftable}
                                        className="w-full md:w-auto bg-green-800/50 border border-green-700 text-green-300 font-bold py-2 px-6 rounded-sm transition-all duration-200 hover:bg-green-700 hover:text-white disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 disabled:cursor-not-allowed"
                                    >
                                        Chế Tạo
                                    </button>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-center text-gray-500 italic py-8">Bạn chưa biết công thức chế tạo nào.</p>
                )}
            </main>
        </div>
    </div>
  );
};

export default CraftingModal;