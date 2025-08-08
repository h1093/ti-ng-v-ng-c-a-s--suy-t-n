

import React, { useState, useCallback, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { CharacterCreationScreen } from './components/CharacterCreationScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AiSourceManagerModal } from './components/AiSourceManagerModal';
import { generateScene } from './services/geminiService';
import { processScene, advanceTurn, handleSystemAction as processSystemAction, handlePlayerSkillUsage } from './services/characterStateService';
import { getAiConfig, saveAiConfig } from './services/geminiService';
import { Character, Scene, NPC, Companion, Skill, SystemAction, Enemy } from './types';
import { ORIGINS, DIFFICULTIES, ALL_WEAPON_PROFICIENCIES, ALL_MAGIC_SCHOOLS, ALL_DEITIES } from './data/characterData';
import { ENDINGS } from './data/endingData';
import { SKILL_DEFINITIONS } from './data/skillData';
import { ITEM_DEFINITIONS } from './data/itemData';


/**
 * Reconciles the list of NPCs to prevent them from disappearing if the AI forgets to include them.
 * This acts as a client-side safeguard for state consistency.
 * @param previousNpcs The list of NPCs from the previous scene.
 * @param newNpcs The list of NPCs returned by the AI for the current scene.
 * @param recruitedCompanions NPCs who were explicitly recruited and became companions in the current turn.
 * @returns A reconciled, consistent list of NPCs for the new scene.
 */
const reconcileNpcs = (previousNpcs: NPC[], newNpcs: NPC[] | undefined, recruitedCompanions: Companion[] | undefined): NPC[] => {
    const prev = previousNpcs || [];
    const next = newNpcs || [];
    const companions = recruitedCompanions || [];

    if (prev.length === 0) {
        return next;
    }

    const reconciledList = [...next];
    const nextIds = new Set(next.map(n => n.id));
    const companionNames = new Set(companions.map(c => c.name));

    for (const p of prev) {
        // If an NPC from the previous scene is NOT in the new scene's NPC list,
        // AND they were NOT just recruited as a companion, it means the AI "forgot" them.
        // We add them back to maintain consistency.
        if (!nextIds.has(p.id) && !companionNames.has(p.name)) {
            reconciledList.push(p);
        }
    }
    return reconciledList;
};


const App = () => {
  const [gameState, setGameState] = useState('START_SCREEN');
  const [character, setCharacter] = useState<Character | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [endingDetails, setEndingDetails] = useState<{ typeKey: string; reason: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [hasSave, setHasSave] = useState(false);
  const [enableGore, setEnableGore] = useState(true);
  const [creationMode, setCreationMode] = useState<'standard' | 'custom'>('standard');
  const [isAiManagerOpen, setIsAiManagerOpen] = useState(false);
  const [lastSystemMessage, setLastSystemMessage] = useState<string | null>(null);


  const WORLD_EVENT_TURN_INTERVAL = 5;
  const SAVE_GAME_KEY = 'echoes_of_ruin_save_v9'; // Updated version key
  const SETTINGS_KEY = 'echoes_of_ruin_settings_v1';

  const manualSaveGame = useCallback(() => {
    if (character && gameState === 'PLAYING') {
      try {
        const gameStateToSave = {
          character,
          turnCount,
          currentScene
        };
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(gameStateToSave));
        setHasSave(true);
      } catch (error) {
        console.error("Failed to save game:", error);
      }
    }
  }, [character, turnCount, gameState, currentScene]);

  useEffect(() => {
    try {
      const savedGame = localStorage.getItem(SAVE_GAME_KEY);
      if (savedGame) {
        setHasSave(true);
      }
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (typeof parsedSettings.enableGore === 'boolean') {
          setEnableGore(parsedSettings.enableGore);
        }
      }
    } catch (error) {
      console.error("Failed to check for saved game/settings:", error);
      localStorage.removeItem(SAVE_GAME_KEY);
      setHasSave(false);
    }
  }, []);

  // Autosave effect
  useEffect(() => {
    if (character && gameState === 'PLAYING') {
      try {
        const gameStateToSave = {
          character,
          turnCount,
          currentScene
        };
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(gameStateToSave));
        setHasSave(true);
      } catch (error) {
        console.error("Failed to save game:", error);
      }
    }
  }, [character, turnCount, gameState, currentScene]);

  const handleGoreToggle = (enabled: boolean) => {
    setEnableGore(enabled);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        enableGore: enabled
      }));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleGameOver = useCallback((typeKey: string, reason: string, finalCharacterState?: Character) => {
    setEndingDetails({ typeKey, reason });
    setGameState('GAME_OVER');
    if (finalCharacterState?.difficulty?.permadeath) {
      localStorage.removeItem(SAVE_GAME_KEY);
      setHasSave(false);
    }
  }, []);

  const sceneProcessor = useCallback((scene: Scene, currentCharacter: Character, previousNpcs: NPC[]) => {
      // Reconcile NPC list before processing the scene state changes
      const sceneWithReconciledNpcs = {
          ...scene,
          npcs: reconcileNpcs(previousNpcs, scene.npcs, scene.updatedCompanions),
      };

      const { updatedCharacter, finalScene } = processScene(sceneWithReconciledNpcs, currentCharacter);
      
      setCharacter(updatedCharacter);
      setCurrentScene(finalScene);
      
      const isDead = !updatedCharacter.godMode && (updatedCharacter.stats.hp <= 0 || updatedCharacter.stats.san <= 0);

      if (finalScene.gameOver || isDead) {
          let typeKey = finalScene.endingKey || '';
          
          if (!typeKey) {
              if (updatedCharacter.stats.hp <= 0) typeKey = 'DEATH_HP';
              else if (updatedCharacter.stats.san <= 0) typeKey = 'DEATH_SANITY';
              else typeKey = 'GENERIC_END'; // Fallback for other gameOver cases without a specific key
          }
          
          const defaultEnding = ENDINGS[typeKey];
          const reason = finalScene.reason || defaultEnding?.defaultReason || "Hành trình của bạn đã kết thúc.";

          handleGameOver(typeKey, reason, updatedCharacter);
      } else {
        setLoading(false);
      }
  }, [handleGameOver]);
  
  const handleSystemAction = useCallback((action: SystemAction) => {
      if (!character || !currentScene) return;

      const { updatedCharacter, notification } = processSystemAction(character, action);

      setCharacter(updatedCharacter);
      
      // We don't advance the turn for system actions.
      // We also update the current scene description with the notification.
      setCurrentScene(prev => {
          if (!prev) return null;
          const newDescription = `${prev.description}\n\n${notification}`;
          return { ...prev, description: newDescription };
      });

  }, [character, currentScene]);

  const handleChoice = useCallback(async (choice: string) => {
    if (!character || !currentScene) return;

    setLoading(true);
    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);
    
    const inCombat = currentScene.enemies && currentScene.enemies.length > 0;
    const { updatedCharacter: charAfterTurn, turnInfo } = advanceTurn(character, inCombat);

    let charForAI = charAfterTurn;
    let actionForAI = choice;
    let enemiesForAI: Enemy[] = currentScene.enemies || [];
    
    // --- SYSTEM LOGIC: SKILL USAGE ---
    const skillUsageMatch = choice.match(/^Sử dụng kỹ năng: (.*)/);
    if (inCombat && skillUsageMatch) {
        const skillName = skillUsageMatch[1];
        const skill = character.skills.find(s => s.name === skillName);
        if (skill) {
            // System handles the skill logic
            const { updatedCharacter, updatedEnemies, notificationLog } = handlePlayerSkillUsage(charAfterTurn, enemiesForAI, skill.id, enemiesForAI[0]?.id);
            charForAI = updatedCharacter;
            enemiesForAI = updatedEnemies;
            // The action for the AI is now a description of what happened
            actionForAI = notificationLog;
        }
    }
    // --- END SYSTEM LOGIC ---

    if (newTurnCount > 0 && newTurnCount % WORLD_EVENT_TURN_INTERVAL === 0 && !inCombat) {
        actionForAI += "\n\n[CHỈ THỊ QUẢN TRÒ: Đã đến lúc cho một SỰ KIỆN THẾ GIỚI. Hãy đưa một yếu tố bất ngờ, đáng lo ngại hoặc kỳ lạ vào cảnh này.]";
    }
    
    const previousNpcs = currentScene.npcs || [];
    const scene = await generateScene(charForAI, actionForAI, turnInfo, enemiesForAI, previousNpcs, enableGore);
    sceneProcessor(scene, charForAI, previousNpcs);
  }, [character, currentScene, sceneProcessor, turnCount, enableGore]);

  const startGame = useCallback(async (newCharacter: Character) => {
      setLoading(true);
      setCharacter(newCharacter);
      setTurnCount(0);
      setGameState('PLAYING');
      
      const firstAction = newCharacter.customScenario 
          ? `[HÀNH TRÌNH TÙY CHỈNH]: ${newCharacter.customScenario}` 
          : "BẮT ĐẦU CUỘC PHIÊU LƯU: Nhân vật đặt những bước chân đầu tiên vào phế tích.";
      
      const firstScene = await generateScene(newCharacter, firstAction, 'Bắt đầu một hành trình mới.', [], [], enableGore);
      sceneProcessor(firstScene, newCharacter, []);
  }, [sceneProcessor, enableGore]);

  const handleStartCombatSandbox = useCallback(async () => {
    setLoading(true);
    const origin = ORIGINS.find(o => o.name === "Hiệp Sĩ Sa Ngã")!;
    const weaponProficiencies = ALL_WEAPON_PROFICIENCIES.reduce((acc, profName) => {
        acc[profName] = {
            level: profName === origin.weaponProficiency ? 5 : 1,
            xp: 0,
            xpToNextLevel: profName === origin.weaponProficiency ? 500 : 100,
            unlocked: true,
        };
        return acc;
    }, {} as Record<string, any>);
    
    const startingInventory = { ...origin.startingEquipment };
    startingInventory['healing_salve'] = 5;


    const defaultCharacter: Character = {
        name: "Chiến Binh Thử Nghiệm",
        gender: "Khác",
        backstory: "Một thực thể được tạo ra chỉ để chiến đấu.",
        difficulty: DIFFICULTIES[0],
        origin: origin,
        talent: origin.talents[0],
        personality: { name: "Dũng cảm", description: "Không bao giờ lùi bước", effect: "" },
        stats: { hp: 150, maxHp: 150, san: 100, maxSan: 100, mana: 50, maxMana: 50, stamina: 120, maxStamina: 120, attack: 15, defense: 12, speed: 7, charisma: 5 },
        bodyParts: { head: 'Khỏe Mạnh', torso: 'Khỏe Mạnh', leftArm: 'Khỏe Mạnh', rightArm: 'Khỏe Mạnh', leftLeg: 'Khỏe Mạnh', rightLeg: 'Khỏe Mạnh' },
        hunger: 100, maxHunger: 100, thirst: 100, maxThirst: 100, reputation: 0,
        inventory: startingInventory,
        skills: origin.startingSkills
            .map(id => SKILL_DEFINITIONS[id])
            .filter(Boolean)
            .map(skillDef => ({ ...skillDef, currentCooldown: 0 })),
        knownRecipeIds: origin.startingRecipes || [],
        weaponProficiencies,
        magicMasteries: ALL_MAGIC_SCHOOLS.reduce((acc, s) => ({ ...acc, [s]: { level: 1, xp: 0, xpToNextLevel: 100, unlocked: true } }), {}),
        specialSkills: {
            BeastTaming: { level: 0, xp: 0, xpToNextLevel: 100, unlocked: false },
            Necromancy: { level: 0, xp: 0, xpToNextLevel: 100, unlocked: false },
        },
        faith: ALL_DEITIES.reduce((acc, d) => ({ ...acc, [d]: { markLevel: 0, faithPoints: 0, faithPointsToNextLevel: 100 } }), {}),
        sanctuary: null,
        journal: { quests: [], lore: [], characters: [], bestiary: [] },
        companions: [],
        godMode: false
    };

    setCharacter(defaultCharacter);
    setTurnCount(0);
    setGameState('PLAYING');
    const scene = await generateScene(defaultCharacter, "[CHẾ ĐỘ THỬ NGHIỆM CHIẾN ĐẤU]: Bắt đầu một trận chiến ngẫu nhiên chống lại một kẻ thù đầy thách thức.", '', [], [], enableGore);
    sceneProcessor(scene, defaultCharacter, []);
  }, [sceneProcessor, enableGore]);

  const handleCreationFinish = (newCharacter: Character) => {
    startGame(newCharacter);
  };

  const handleGoToCreator = (mode: 'standard' | 'custom') => {
    setCreationMode(mode);
    setGameState('CHARACTER_CREATION');
  };

  const handleContinue = () => {
    try {
      const savedGameJSON = localStorage.getItem(SAVE_GAME_KEY);
      if (savedGameJSON) {
        const savedGameState = JSON.parse(savedGameJSON);
        if (savedGameState.character && savedGameState.character.journal && savedGameState.character.inventory) {
          setCharacter(savedGameState.character);
          setTurnCount(savedGameState.turnCount);
          setCurrentScene(savedGameState.currentScene);
          setGameState('PLAYING');
        } else {
          throw new Error("Save file is corrupted or outdated.");
        }
      }
    } catch (error) {
      console.error("Failed to load game:", error);
      localStorage.removeItem(SAVE_GAME_KEY);
      setHasSave(false);
      alert("Không thể tải save game. Tệp có thể đã cũ hoặc bị hỏng. Bắt đầu một trò chơi mới.");
      setGameState('START_SCREEN');
    }
  };

  const handleRestart = () => {
    setCharacter(null);
    setCurrentScene(null);
    setEndingDetails(null);
    setGameState('START_SCREEN');
    setLoading(false);
    setTurnCount(0);
  };

  const handleExit = () => {
      setGameState('START_SCREEN');
  }

  const renderContent = () => {
    switch (gameState) {
      case 'START_SCREEN':
        return (
          <>
            <StartScreen
              onStart={handleGoToCreator}
              hasSave={hasSave}
              onContinue={handleContinue}
              onStartCombatSandbox={handleStartCombatSandbox}
              enableGore={enableGore}
              onGoreToggle={handleGoreToggle}
              onOpenAiManager={() => setIsAiManagerOpen(true)}
            />
            <AiSourceManagerModal 
              isOpen={isAiManagerOpen}
              onClose={() => setIsAiManagerOpen(false)}
              saveConfig={saveAiConfig}
              getConfig={getAiConfig}
            />
          </>
        );
      case 'CHARACTER_CREATION':
        return <CharacterCreationScreen onFinish={handleCreationFinish} mode={creationMode} />;
      case 'PLAYING':
        return character && currentScene ? (
          <GameScreen
            character={character}
            scene={currentScene}
            loading={loading}
            onChoice={handleChoice}
            onSystemAction={handleSystemAction}
            turnCount={turnCount}
            onSave={manualSaveGame}
            onExit={handleExit}
          />
        ) : (
          <LoadingSpinner />
        );
      case 'GAME_OVER':
        return endingDetails ? (
            <GameOverScreen 
                endingKey={endingDetails.typeKey}
                reason={endingDetails.reason} 
                onRestart={handleRestart} 
            />
        ) : <LoadingSpinner />;
      default:
        return (
          <StartScreen
            onStart={handleGoToCreator}
            hasSave={hasSave}
            onContinue={handleContinue}
            onStartCombatSandbox={handleStartCombatSandbox}
            enableGore={enableGore}
            onGoreToggle={handleGoreToggle}
            onOpenAiManager={() => setIsAiManagerOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-gray-300 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/crissxcross.png')] opacity-10"></div>
      <div className="relative z-10 w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;