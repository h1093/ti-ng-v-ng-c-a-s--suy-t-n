
import React, { useState, useMemo, useEffect } from 'react';
import type { Character, Scene, Skill, Recipe, BodyPart, DeityName } from '../types';
import LoadingSpinner from './LoadingSpinner';
import StatDisplay from './StatDisplay';
import BodyStatus from './BodyStatus';
import EnemyDisplay from './EnemyDisplay';
import Journal from './Journal';
import CraftingModal from './CraftingModal';
import { RECIPES } from '../data/craftingData';
import CharacterDetailsModal from './CharacterDetailsModal';
import MarkLevelUpModal from './MarkLevelUpModal';
import CompanionDisplay from './CompanionDisplay';
import SidePanelAccordion from './SidePanelAccordion';


interface GameScreenProps {
  character: Character;
  scene: Scene;
  loading: boolean;
  onChoice: (choice: string) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ character, scene, loading, onChoice }) => {
  const [customAction, setCustomAction] = useState('');
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isCharacterDetailsOpen, setIsCharacterDetailsOpen] = useState(false);
  const [markLevelUpEvent, setMarkLevelUpEvent] = useState<{ deity: DeityName; newLevel: number; } | null>(null);

  useEffect(() => {
    // Open the modal if the scene contains a level up event.
    if (scene.markLevelUpEvent) {
      setMarkLevelUpEvent(scene.markLevelUpEvent);
    }
  }, [scene.markLevelUpEvent]);

  const handleCustomActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAction.trim() && !loading) {
      onChoice(customAction.trim());
      setCustomAction('');
    }
  };
  
  const handleTargetPart = (enemyId: string, part: BodyPart) => {
      const enemy = scene.enemies?.find(e => e.id === enemyId);
      if (enemy && !loading) {
        let partNameVI: string;
        switch(part) {
            case 'head': partNameVI = 'đầu'; break;
            case 'torso': partNameVI = 'thân'; break;
            case 'leftArm': partNameVI = 'tay trái'; break;
            case 'rightArm': partNameVI = 'tay phải'; break;
            case 'leftLeg': partNameVI = 'chân trái'; break;
            case 'rightLeg': partNameVI = 'chân phải'; break;
            default: partNameVI = part;
        }
        onChoice(`Tấn công ${partNameVI} của ${enemy.name}`);
      }
  };

  const handleCraft = (recipe: Recipe) => {
    setIsCraftingOpen(false);
    onChoice(`[HÀNH ĐỘNG] Chế tạo ${recipe.name}.`);
  };

  const handleSanctuaryAction = (action: string) => {
    setIsCharacterDetailsOpen(false);
    onChoice(action);
  };
  
  const handlePathSelection = (path: string) => {
      if(markLevelUpEvent) {
        onChoice(`[LÊN CẤP ẤN KÝ] Tôi chọn Con Đường ${path} cho ${markLevelUpEvent.deity}.`);
        setMarkLevelUpEvent(null);
      }
  };

  const sanityPercentage = useMemo(() => {
    return (character.stats.san / character.stats.maxSan) * 100;
  }, [character.stats.san, character.stats.maxSan]);

  const screenEffectStyle: React.CSSProperties = {
    '--sanity-factor': (100 - sanityPercentage) / 100,
    '--shake-intensity': sanityPercentage < 40 ? `${Math.min(2, (40 - sanityPercentage) / 20)}px` : '0px',
    '--vignette-opacity': sanityPercentage < 50 ? `${(50 - sanityPercentage) / 100}` : '0',
  } as React.CSSProperties;

  const SanityEffects = () => {
    if (sanityPercentage >= 50) return null;
    return (
      <>
        <div className="sanity-vignette" style={screenEffectStyle}></div>
        {sanityPercentage < 25 && <div className="sanity-noise"></div>}
      </>
    );
  };
  
  const inCombat = scene.enemies && scene.enemies.length > 0;
  
  const getSkillDisabledReason = (skill: Skill): string | null => {
    if (character.godMode) return null; // God mode allows infinite skill usage
    if (skill.currentCooldown > 0) return `Hồi chiêu: ${skill.currentCooldown} lượt`;
    if (character.stats[skill.costType] < skill.costAmount) return `Không đủ ${skill.costType.toUpperCase()}`;
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(calc(-1 * var(--shake-intensity))); }
          20%, 40%, 60%, 80% { transform: translateX(var(--shake-intensity)); }
        }
        .sanity-shake {
          animation: shake 0.5s infinite;
        }
        .sanity-vignette {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          box-shadow: inset 0 0 10vw 5vw rgba(0, 0, 0, var(--vignette-opacity));
          pointer-events: none;
          z-index: 50;
        }
        @keyframes noise-anim {
            0% { transform: translate(0, 0); }
            10% { transform: translate(-5%, -5%); }
            20% { transform: translate(-10%, 5%); }
            30% { transform: translate(5%, -10%); }
            40% { transform: translate(-5%, 15%); }
            50% { transform: translate(-10%, 5%); }
            60% { transform: translate(15%, 0); }
            70% { transform: translate(0, 10%); }
            80% { transform: translate(-15%, 0); }
            90% { transform: translate(10%, 5%); }
            100% { transform: translate(5%, 0); }
        }
        .sanity-noise {
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background-image: url('https://www.transparenttextures.com/patterns/stardust.png');
          opacity: calc(var(--sanity-factor) * 0.15);
          animation: noise-anim 0.2s infinite;
          pointer-events: none;
          z-index: 50;
        }
      `}</style>
      <SanityEffects />
      {isJournalOpen && <Journal journal={character.journal} onClose={() => setIsJournalOpen(false)} />}
      {isCraftingOpen && <CraftingModal character={character} allRecipes={RECIPES} onCraft={handleCraft} onClose={() => setIsCraftingOpen(false)} />}
      {isCharacterDetailsOpen && <CharacterDetailsModal character={character} onSanctuaryAction={handleSanctuaryAction} onClose={() => setIsCharacterDetailsOpen(false)} />}
      {markLevelUpEvent && <MarkLevelUpModal event={markLevelUpEvent} onSelectPath={handlePathSelection} />}

      <div 
        className={`w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 p-6 sm:p-8 bg-black/60 border border-gray-800 shadow-lg shadow-red-900/20 rounded-lg backdrop-blur-sm relative overflow-hidden ${sanityPercentage < 40 ? 'sanity-shake' : ''}`}
        style={screenEffectStyle}
      >
        <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-red-500">{character.name}</h3>
              {character.godMode && <div className="mt-1 text-sm font-bold text-yellow-400 border border-yellow-500 bg-yellow-900/30 py-1 rounded-md">Ý CHÍ SÁNG THẾ</div>}
            </div>
            
            <SidePanelAccordion title="Trạng Thái Cơ Thể" initialOpen={true}>
              <BodyStatus bodyParts={character.bodyParts} />
            </SidePanelAccordion>
            
            {character.companions && character.companions.length > 0 && (
              <SidePanelAccordion title="Đồng Hành & Đệ Tử" initialOpen={true}>
                <div className="flex flex-col gap-3">
                    {character.companions.map((comp, index) => (
                        <CompanionDisplay key={`${comp.name}-${index}`} companion={comp} />
                    ))}
                </div>
              </SidePanelAccordion>
            )}

            <SidePanelAccordion title="Chỉ Số Sống" initialOpen={true}>
              <div className="flex flex-col gap-3">
                <StatDisplay label="MÁU" value={character.stats.hp} maxValue={character.stats.maxHp} color="bg-red-600" />
                <StatDisplay label="TINH THẦN" value={character.stats.san} maxValue={character.stats.maxSan} color="bg-purple-600" />
                <StatDisplay label="THỂ LỰC" value={character.stats.stamina} maxValue={character.stats.maxStamina} color="bg-green-600" />
                <StatDisplay label="MANA" value={character.stats.mana} maxValue={character.stats.maxMana} color="bg-blue-600" />
              </div>
            </SidePanelAccordion>

            <SidePanelAccordion title="Nhu Yếu Phẩm">
               <div className="flex flex-col gap-3">
                <StatDisplay label="CƠN ĐÓI" value={character.hunger} maxValue={character.maxHunger} color="bg-yellow-700" />
                <StatDisplay label="CƠN KHÁT" value={character.thirst} maxValue={character.maxThirst} color="bg-cyan-600" />
              </div>
            </SidePanelAccordion>

            <SidePanelAccordion title="Thuộc Tính">
               <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div><span className="text-gray-400">TẤN CÔNG</span><p className="font-bold text-lg text-white">{character.stats.attack}</p></div>
                  <div><span className="text-gray-400">PHÒNG THỦ</span><p className="font-bold text-lg text-white">{character.stats.defense}</p></div>
                  <div><span className="text-gray-400">TỐC ĐỘ</span><p className="font-bold text-lg text-white">{character.stats.speed}</p></div>
               </div>
            </SidePanelAccordion>
        </aside>
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
          {inCombat && (
             <div className="mb-4">
                <h3 className="text-2xl font-bold text-red-700 border-b-2 border-red-800/50 pb-2 mb-4">KẺ THÙ</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {scene.enemies?.map(enemy => <EnemyDisplay key={enemy.id} enemy={enemy} onTargetPart={handleTargetPart} />)}
                </div>
            </div>
          )}

          <main className="flex-grow mb-6 min-h-[150px]">
             <h3 className="text-2xl font-bold text-gray-400 border-b-2 border-gray-700/50 pb-2 mb-4">DIỄN BIẾN</h3>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap" style={{ textShadow: `0 0 calc(var(--sanity-factor) * 5px) rgba(255, 100, 100, 0.5)` }}>
                {scene.description}
              </p>
            )}
          </main>

          <footer className="w-full mt-auto">
            {!loading && !markLevelUpEvent && (
              <>
                {inCombat && character.skills.length > 0 && (
                  <div className="mb-4">
                      <h4 className="text-lg font-bold text-yellow-500 mb-2">Kỹ năng</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {character.skills.map(skill => {
                              const disabledReason = getSkillDisabledReason(skill);
                              const title = character.godMode ? `${skill.description} (Vô hạn trong God Mode)` : (disabledReason || skill.description);
                              return (
                                  <button
                                      key={skill.id}
                                      onClick={() => onChoice(`Sử dụng kỹ năng: ${skill.name}`)}
                                      disabled={!!disabledReason}
                                      title={title}
                                      className="w-full bg-yellow-900/30 border border-yellow-800 text-yellow-300 font-bold py-3 px-4 rounded-sm text-left transition-all duration-200 hover:bg-yellow-800/70 hover:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800/40 disabled:border-gray-700 disabled:text-gray-500 flex justify-between items-center"
                                  >
                                      <span>&gt; {skill.name}</span>
                                      <span className="text-sm font-normal">
                                          {disabledReason || (character.godMode ? 'MIỄN PHÍ' : `${skill.costAmount} ${skill.costType.toUpperCase()}`)}
                                      </span>
                                  </button>
                              )
                          })}
                      </div>
                  </div>
                )}
                 
                <h4 className="text-lg font-bold text-gray-300 mb-2">Hành động</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scene.choices.map((choice, index) => {
                    const hitChanceEntry = scene.hitChances?.find(hc => hc.choice === choice);
                    const hitChance = hitChanceEntry?.chance;
                    return (
                      <button
                        key={index}
                        onClick={() => onChoice(choice)}
                        disabled={loading}
                        className="w-full bg-gray-800/50 border border-gray-700 text-gray-300 font-bold py-3 px-4 rounded-sm text-left transition-all duration-200 hover:bg-gray-700 hover:border-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center"
                      >
                        <span>&gt; {choice}</span>
                        {hitChance !== undefined && (
                          <span className="text-sm font-normal text-yellow-400">{hitChance}%</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="my-4 flex items-center gap-4">
                  <div className="flex-grow border-t border-gray-700"></div>
                  <span className="flex-shrink text-gray-500 text-sm">hoặc</span>
                  <div className="flex-grow border-t border-gray-700"></div>
                </div>
                
                <form onSubmit={handleCustomActionSubmit} className="flex gap-2 w-full">
                    <input
                        type="text"
                        value={customAction}
                        onChange={(e) => setCustomAction(e.target.value)}
                        placeholder="Làm gì tiếp theo...?"
                        disabled={loading}
                        className="flex-grow bg-gray-900/70 border border-gray-700 text-gray-300 py-3 px-4 rounded-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 placeholder-gray-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !customAction.trim()}
                        className="flex-shrink-0 bg-transparent border-2 border-red-600 text-red-500 font-bold py-3 px-6 rounded-sm hover:bg-red-600 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-600 disabled:text-gray-500 disabled:hover:bg-transparent"
                    >
                        Gửi
                    </button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                    <button
                        onClick={() => setIsCharacterDetailsOpen(true)}
                        disabled={loading}
                        className="w-full bg-transparent border-2 border-cyan-500 text-cyan-400 font-bold py-3 px-4 rounded-sm hover:bg-cyan-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Nhân Vật
                    </button>
                    <button
                        onClick={() => setIsCraftingOpen(true)}
                        disabled={loading || inCombat}
                        title={inCombat ? "Không thể chế tạo trong chiến đấu" : "Mở giao diện chế tạo"}
                        className="w-full bg-transparent border-2 border-green-500 text-green-400 font-bold py-3 px-4 rounded-sm hover:bg-green-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Chế Tạo
                    </button>
                     <button
                        onClick={() => onChoice('[HÀNH ĐỘNG] Quan sát xung quanh thật kỹ lưỡng.')}
                        disabled={loading || inCombat}
                        title={inCombat ? "Không thể quan sát trong chiến đấu" : "Nhìn kỹ môi trường xung quanh"}
                        className="w-full bg-transparent border-2 border-indigo-500 text-indigo-400 font-bold py-3 px-4 rounded-sm hover:bg-indigo-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Quan Sát
                    </button>
                    <button
                        onClick={() => setIsJournalOpen(true)}
                        disabled={loading}
                        className="w-full bg-transparent border-2 border-blue-500 text-blue-400 font-bold py-3 px-4 rounded-sm hover:bg-blue-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Nhật Ký
                    </button>
                </div>
              </>
            )}
          </footer>
        </div>
      </div>
    </>
  );
};

export default GameScreen;
