import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Character, Scene, Skill, NPC, SystemAction } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { StatDisplay } from './StatDisplay';
import { SidePanelAccordion } from './SidePanelAccordion';
import { BodyStatus } from './BodyStatus';
import { EnemyDisplay } from './EnemyDisplay';
import { NpcDisplay } from './NpcDisplay';
import { CompanionDisplay } from './CompanionDisplay';
import { Journal } from './Journal';
import { CraftingModal } from './CraftingModal';
import { CharacterDetailsModal } from './CharacterDetailsModal';
import { MarkLevelUpModal } from './MarkLevelUpModal';
import { RECIPES } from '../data/craftingData';

interface GameScreenProps {
  character: Character;
  scene: Scene;
  loading: boolean;
  onChoice: (choice: string) => void;
  onSystemAction: (action: SystemAction) => void;
  turnCount: number;
  onSave: () => void;
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ character, scene, loading, onChoice, onSystemAction, turnCount, onSave, onExit }) => {
  const [customAction, setCustomAction] = useState('');
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isCharacterDetailsOpen, setIsCharacterDetailsOpen] = useState(false);
  const [markLevelUpEvent, setMarkLevelUpEvent] = useState(scene.markLevelUpEvent || null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [isActionsCollapsed, setIsActionsCollapsed] = useState(false);


  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scene.markLevelUpEvent) {
      setMarkLevelUpEvent(scene.markLevelUpEvent);
    }
  }, [scene.markLevelUpEvent]);
  
  useEffect(() => {
    // Scroll to the top of the main content area when the scene description changes
    if (mainContentRef.current) {
      mainContentRef.current.parentElement?.scrollTo(0, 0);
    }
  }, [scene.description]);
  
  useEffect(() => {
      if(systemMessage) {
          const timer = setTimeout(() => setSystemMessage(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [systemMessage]);

  const handleCustomActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAction.trim() && !loading) {
      onChoice(customAction.trim());
      setCustomAction('');
    }
  };

  const handleTargetPart = (enemyId: string, part: 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg') => {
    const enemy = scene.enemies?.find(e => e.id === enemyId);
    if (enemy && !loading) {
      let partNameVI: string;
      switch (part) {
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
  
  const handleCraft = (recipeId: string) => {
      setIsCraftingOpen(false);
      onSystemAction({ type: 'CRAFT_ITEM', payload: { recipeId } });
  }

  const handleUseItem = (itemId: string) => {
      onSystemAction({ type: 'USE_ITEM', payload: { itemId } });
  }

  const handleSystemActionWrapper = (action: SystemAction) => {
    setIsCharacterDetailsOpen(false);
    setIsCraftingOpen(false);
    onSystemAction(action);
  };

  const handlePathSelection = (action: SystemAction) => {
    if (markLevelUpEvent) {
      onSystemAction(action);
      setMarkLevelUpEvent(null);
    }
  };
  
  const handleManualSave = () => {
    if (loading || saveState !== 'idle') return;
    setSaveState('saving');
    onSave();
    setTimeout(() => {
        setSaveState('saved');
        setTimeout(() => {
            setSaveState('idle');
        }, 1500);
    }, 200);
  };
  
  const handleExitClick = () => {
    if (confirm("Bạn có chắc muốn thoát ra menu chính không? Tiến trình của bạn được lưu tự động mỗi lượt.")) {
      onExit();
    }
  }

  const sanityPercentage = useMemo(() => {
    return (character.stats.san / character.stats.maxSan) * 100;
  }, [character.stats.san, character.stats.maxSan]);

  const screenEffectStyle = {
    '--sanity-factor': (100 - sanityPercentage) / 100,
    '--shake-intensity': sanityPercentage < 40 ? `${Math.min(2, (40 - sanityPercentage) / 20)}px` : '0px',
    '--vignette-opacity': sanityPercentage < 50 ? `${(50 - sanityPercentage) / 100}` : '0',
  } as React.CSSProperties;

  const saveButtonText = {
      idle: 'Lưu',
      saving: 'Đang lưu...',
      saved: 'Đã lưu!'
  };

  const SanityEffects = () => {
      if (sanityPercentage >= 50) return null;
      return <>
        <div className="sanity-vignette" style={screenEffectStyle}></div>
        {sanityPercentage < 25 && <div className="sanity-noise" style={screenEffectStyle}></div>}
      </>
  }

  const inCombat = scene.enemies && scene.enemies.length > 0;

  const getSkillDisabledReason = (skill: Skill): string | null => {
      if(character.godMode) return null;
      if (skill.currentCooldown > 0) return `Hồi chiêu: ${skill.currentCooldown} lượt`;
      if (character.stats[skill.costType] < skill.costAmount) return `Không đủ ${skill.costType.toUpperCase()}`;
      return null;
  }

  return (
    <>
      <SanityEffects />
      {isJournalOpen && <Journal journal={character.journal} onClose={() => setIsJournalOpen(false)} />}
      {isCraftingOpen && <CraftingModal character={character} allRecipes={RECIPES} onCraft={handleCraft} onClose={() => setIsCraftingOpen(false)} />}
      {isCharacterDetailsOpen && <CharacterDetailsModal character={character} onSystemAction={handleSystemActionWrapper} onUseItem={handleUseItem} onClose={() => setIsCharacterDetailsOpen(false)} />}
      {markLevelUpEvent && <MarkLevelUpModal event={markLevelUpEvent} onSystemAction={handlePathSelection} />}

      <div className={`w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 p-4 sm:p-6 bg-black/60 border border-gray-800 shadow-lg shadow-red-900/20 rounded-lg backdrop-blur-sm relative overflow-hidden ${sanityPercentage < 40 ? 'sanity-shake' : ''}`} style={screenEffectStyle}>
        {/* Left Side Panel */}
        <aside className="w-full md:w-1/4 lg:w-1/5 flex flex-col gap-4">
            <div className="text-center p-2 bg-black/30 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold text-red-500">{character.name}</h3>
                <p className="text-base text-gray-300 font-semibold mt-1">{`Lượt: ${turnCount}`}</p>
                {character.godMode && <div className="mt-1 text-sm font-bold text-yellow-400 border border-yellow-500 bg-yellow-900/30 py-1 rounded-md">Ý Chí Sáng Thế</div>}
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

        {/* Right Main Content */}
        <div className="w-full md:w-3/4 lg:w-4/5 flex flex-col max-h-[90vh] overflow-y-auto pr-2">
          {inCombat && (
            <div className="mb-4 flex-shrink-0">
              <h3 className="text-2xl font-bold text-red-700 border-b-2 border-red-800/50 pb-2 mb-4">KẺ THÙ</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto pr-2">
                {scene.enemies?.map(enemy => <EnemyDisplay key={enemy.id} enemy={enemy} onTargetPart={handleTargetPart} />)}
              </div>
            </div>
          )}
          
          {!inCombat && scene.npcs && scene.npcs.length > 0 && (
            <div className="mb-4 flex-shrink-0">
              <h3 className="text-2xl font-bold text-blue-400 border-b-2 border-blue-800/50 pb-2 mb-4">NHÂN VẬT KHÁC</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto pr-2">
                {scene.npcs.map(npc => <NpcDisplay key={npc.id} npc={npc} />)}
              </div>
            </div>
          )}


          {/* Scrollable container for description and actions */}
          <div ref={mainContentRef} className="flex flex-col flex-grow min-h-0">
              <main className="mb-6 flex-grow">
                <h3 className="text-2xl font-bold text-gray-400 border-b-2 border-gray-700/50 pb-2 mb-4">DIỄN BIẾN</h3>
                {loading ? <LoadingSpinner /> : <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap" style={{textShadow: `0 0 calc(var(--sanity-factor) * 5px) rgba(255, 100, 100, 0.5)`}}>{scene.description}</p>}
              </main>

              <footer className="w-full mt-auto flex-shrink-0">
                {!loading && !markLevelUpEvent && (
                  <>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-bold text-gray-300">Hành động</h4>
                        <button
                            onClick={() => setIsActionsCollapsed(!isActionsCollapsed)}
                            className="p-1 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
                            aria-expanded={!isActionsCollapsed}
                            aria-controls="actions-panel"
                            title={isActionsCollapsed ? "Hiện hành động" : "Ẩn hành động"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isActionsCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                    <div id="actions-panel" className={`transition-all duration-500 ease-in-out overflow-hidden ${isActionsCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
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
                                            <span className="text-sm font-normal">{disabledReason || (character.godMode ? 'MIỄN PHÍ' : `${skill.costAmount} ${skill.costType.toUpperCase()}`)}</span>
                                        </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(scene.choices || []).map((choice, index) => {
                            const hitChanceEntry = scene.hitChances?.find(hc => hc.choice === choice);
                            const hitChance = hitChanceEntry?.chance;
                            return (
                                <button key={index} onClick={() => onChoice(choice)} disabled={loading} className="w-full bg-gray-800/50 border border-gray-700 text-gray-300 font-bold py-3 px-4 rounded-sm text-left transition-all duration-200 hover:bg-gray-700 hover:border-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center">
                                    <span>&gt; {choice}</span>
                                    {hitChance !== undefined && <span className="text-sm font-normal text-yellow-400">{hitChance}%</span>}
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
                        <input type="text" value={customAction} onChange={e => setCustomAction(e.target.value)} placeholder="Làm gì tiếp theo...?" disabled={loading} className="flex-grow bg-gray-900/70 border border-gray-700 text-gray-300 py-3 px-4 rounded-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 placeholder-gray-500 disabled:opacity-50" />
                        <button type="submit" disabled={loading || !customAction.trim()} className="flex-shrink-0 bg-transparent border-2 border-red-600 text-red-500 font-bold py-3 px-6 rounded-sm hover:bg-red-600 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-600 disabled:text-gray-500 disabled:hover:bg-transparent">Gửi</button>
                        </form>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                            <button onClick={() => setIsCharacterDetailsOpen(true)} disabled={loading} className="w-full bg-transparent border-2 border-cyan-500 text-cyan-400 font-bold py-3 px-4 rounded-sm hover:bg-cyan-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">Nhân Vật</button>
                            <button onClick={() => setIsCraftingOpen(true)} disabled={loading || inCombat} title={inCombat ? "Không thể chế tạo trong chiến đấu" : "Mở giao diện chế tạo"} className="w-full bg-transparent border-2 border-green-500 text-green-400 font-bold py-3 px-4 rounded-sm hover:bg-green-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">Chế Tạo</button>
                            <button onClick={() => onChoice('[HÀNH ĐỘNG] Quan sát xung quanh thật kỹ lưỡng.')} disabled={loading || inCombat} title={inCombat ? "Không thể quan sát trong chiến đấu" : "Nhìn kỹ môi trường xung quanh"} className="w-full bg-transparent border-2 border-indigo-500 text-indigo-400 font-bold py-3 px-4 rounded-sm hover:bg-indigo-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">Quan Sát</button>
                            <button onClick={() => setIsJournalOpen(true)} disabled={loading} className="w-full bg-transparent border-2 border-blue-500 text-blue-400 font-bold py-3 px-4 rounded-sm hover:bg-blue-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">Nhật Ký</button>
                            <button onClick={handleManualSave} disabled={loading || saveState !== 'idle'} className="w-full bg-transparent border-2 border-yellow-500 text-yellow-400 font-bold py-3 px-4 rounded-sm hover:bg-yellow-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">{saveButtonText[saveState]}</button>
                            <button onClick={handleExitClick} disabled={loading} className="w-full bg-transparent border-2 border-gray-500 text-gray-400 font-bold py-3 px-4 rounded-sm hover:bg-gray-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">Thoát</button>
                        </div>
                    </div>
                  </>
                )}
              </footer>
          </div>
        </div>
      </div>
    </>
  );
};