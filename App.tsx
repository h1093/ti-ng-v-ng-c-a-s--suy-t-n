
import React, { useState, useCallback, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { CharacterCreationScreen } from './components/CharacterCreationScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AiSourceManagerModal } from './components/AiSourceManagerModal';
import { generateScene } from './services/geminiService';
import { processScene } from './services/characterStateService';
import { getAiConfig, saveAiConfig } from './services/geminiService';
import { Character, Scene } from './types';
import { ORIGINS, DIFFICULTIES, ALL_WEAPON_PROFICIENCIES, ALL_MAGIC_SCHOOLS, ALL_DEITIES } from './data/characterData';


const App = () => {
  const [gameState, setGameState] = useState('START_SCREEN');
  const [character, setCharacter] = useState<Character | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [gameOverReason, setGameOverReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [hasSave, setHasSave] = useState(false);
  const [enableGore, setEnableGore] = useState(true);
  const [creationMode, setCreationMode] = useState<'standard' | 'custom'>('standard');
  const [isAiManagerOpen, setIsAiManagerOpen] = useState(false);

  const WORLD_EVENT_TURN_INTERVAL = 5;
  const SAVE_GAME_KEY = 'echoes_of_ruin_save_v7'; // Updated version key
  const SETTINGS_KEY = 'echoes_of_ruin_settings_v1';
  const HUNGER_PER_TURN = 2;
  const THIRST_PER_TURN = 3;

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
        // Don't crash the app, but notify user if possible.
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

  const handleGameOver = useCallback((reason: string, finalCharacterState?: Character) => {
    setGameOverReason(reason);
    setGameState('GAME_OVER');
    if (finalCharacterState?.difficulty?.permadeath) {
      localStorage.removeItem(SAVE_GAME_KEY);
      setHasSave(false);
    }
  }, []);

  const sceneProcessor = useCallback((scene: Scene, currentCharacter: Character) => {
      const { updatedCharacter, finalScene } = processScene(scene, currentCharacter);
      
      setCharacter(updatedCharacter);
      setCurrentScene(finalScene);
      
      if (finalScene.gameOver || !updatedCharacter.godMode && (updatedCharacter.stats.hp <= 0 || updatedCharacter.stats.san <= 0)) {
          let reason = finalScene.reason || '';
          if (updatedCharacter.stats.hp <= 0 && !reason) reason = "Cơ thể bạn kiệt sức, đổ gục thành một đống máu me trên nền đá lạnh lẽo.";
          if (updatedCharacter.stats.san <= 0 && !reason) reason = "Tâm trí bạn vỡ vụn, để lại bạn một cái vỏ rỗng tuếch, lạc lối trong những kinh hoàng bạn đã chứng kiến.";
          handleGameOver(reason, updatedCharacter);
      }
      setLoading(false);
  }, [handleGameOver]);

  const handleChoice = useCallback(async (choice: string) => {
    if (!character || !currentScene) return;

    setLoading(true);
    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);
    
    let updatedCharacter = { ...character };
    let turnInfo = 'Bắt đầu lượt mới. ';

    updatedCharacter.skills = updatedCharacter.skills.map(skill => ({
        ...skill,
        currentCooldown: Math.max(0, skill.currentCooldown - 1)
    }));
    turnInfo += 'Một vài kỹ năng đã được hồi lại. ';

    const inCombat = currentScene.enemies && currentScene.enemies.length > 0;
    if (!inCombat && !updatedCharacter.godMode) {
        updatedCharacter.hunger = Math.max(0, updatedCharacter.hunger - HUNGER_PER_TURN);
        updatedCharacter.thirst = Math.max(0, updatedCharacter.thirst - THIRST_PER_TURN);
    }

    if (updatedCharacter.hunger === 0 && !updatedCharacter.godMode) {
      updatedCharacter.stats.hp = Math.max(1, updatedCharacter.stats.hp - 1); // Don't let hunger kill, just weaken
      turnInfo += 'Cơn đói đang gặm nhấm bạn từ bên trong. ';
    }
    if (updatedCharacter.thirst === 0 && !updatedCharacter.godMode) {
      updatedCharacter.stats.hp = Math.max(1, updatedCharacter.stats.hp - 2); // Thirst is more dangerous
      turnInfo += 'Cổ họng bạn khô rát vì thiếu nước. ';
    }

    let actionForGemini = choice;
    if (newTurnCount > 0 && newTurnCount % WORLD_EVENT_TURN_INTERVAL === 0 && !inCombat) {
        actionForGemini += "\n\n[CHỈ THỊ QUẢN TRÒ: Đã đến lúc cho một SỰ KIỆN THẾ GIỚI. Hãy đưa một yếu tố bất ngờ, đáng lo ngại hoặc kỳ lạ vào cảnh này.]";
    }
    
    const scene = await generateScene(updatedCharacter, actionForGemini, turnInfo, currentScene.enemies, enableGore);
    sceneProcessor(scene, updatedCharacter);
  }, [character, currentScene, sceneProcessor, turnCount, enableGore]);

  const startGame = useCallback(async (newCharacter: Character) => {
      setLoading(true);
      setCharacter(newCharacter);
      setTurnCount(0);
      setGameState('PLAYING');
      
      const firstAction = newCharacter.customScenario 
          ? `[HÀNH TRÌNH TÙY CHỈNH]: ${newCharacter.customScenario}` 
          : "BẮT ĐẦU CUỘC PHIÊU LƯU: Nhân vật đặt những bước chân đầu tiên vào phế tích.";
      
      const firstScene = await generateScene(newCharacter, firstAction, 'Bắt đầu một hành trình mới.', [], enableGore);
      sceneProcessor(firstScene, newCharacter);
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
        inventory: { ...origin.startingEquipment, "Thuốc Mỡ Chữa Lành": 5 },
        skills: origin.startingSkills.map(s => ({ ...s, currentCooldown: 0 })),
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
    const scene = await generateScene(defaultCharacter, "[CHẾ ĐỘ THỬ NGHIỆM CHIẾN ĐẤU]: Bắt đầu một trận chiến ngẫu nhiên chống lại một kẻ thù đầy thách thức.", '', [], enableGore);
    sceneProcessor(scene, defaultCharacter);
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
    setGameOverReason('');
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
            turnCount={turnCount}
            onSave={manualSaveGame}
            onExit={handleExit}
          />
        ) : (
          <LoadingSpinner />
        );
      case 'GAME_OVER':
        return <GameOverScreen reason={gameOverReason} onRestart={handleRestart} />;
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
