import React, { useState, useCallback, useEffect } from 'react';
import type { GameState, Character, Scene, PlayerStats, Enemy, Origin, Difficulty, BodyPart, BodyPartStatus, MagicSchool, Proficiency, DeityName, FaithStatus, Journal, Recipe, Companion } from './types';
import { generateScene } from './services/geminiService';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import LoadingSpinner from './components/LoadingSpinner';
import { ORIGINS, DIFFICULTIES, ALL_WEAPON_PROFICIENCIES } from './data/characterData';
import {
  applyStatChanges,
  applyInventoryChanges,
  applyBodyPartChanges,
  applyWeaponProficiencyUpdates,
  applyMagicMasteryUpdates,
  applyFaithUpdates,
  applySanctuaryUpdate,
  applyJournalUpdates,
  learnNewRecipes,
  clampStats,
  applyGodMode,
  assembleNotifications
} from './services/characterStateService';

const WORLD_EVENT_TURN_INTERVAL = 5;
const SAVE_GAME_KEY = 'echoes_of_ruin_save_v5'; // Incremented version for new data structure
const SETTINGS_KEY = 'echoes_of_ruin_settings';
const HUNGER_PER_TURN = 2;
const THIRST_PER_TURN = 3;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('START_SCREEN');
  const [character, setCharacter] = useState<Character | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [hasSave, setHasSave] = useState<boolean>(false);
  const [enableGore, setEnableGore] = useState<boolean>(true);
  const [creationMode, setCreationMode] = useState<'standard' | 'custom'>('standard');


  useEffect(() => {
    try {
      const savedGame = localStorage.getItem(SAVE_GAME_KEY);
      if (savedGame) {
        setHasSave(true);
      }
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setEnableGore(JSON.parse(savedSettings).enableGore);
      }
    } catch (error) {
      console.error("Failed to check for saved game/settings:", error);
      localStorage.removeItem(SAVE_GAME_KEY); // Clear potentially corrupted save
      setHasSave(false);
    }
  }, []);

  useEffect(() => {
    if (character && gameState === 'PLAYING') {
      try {
        const gameStateToSave = { character, turnCount, currentScene };
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
          localStorage.setItem(SETTINGS_KEY, JSON.stringify({ enableGore: enabled }));
      } catch (error) {
          console.error("Failed to save settings:", error);
      }
  }

  const handleGameOver = useCallback((reason: string, finalCharacterState: Character) => {
    setGameOverReason(reason);
    setGameState('GAME_OVER');
    
    if (finalCharacterState.difficulty.permadeath) {
      localStorage.removeItem(SAVE_GAME_KEY);
      setHasSave(false);
    }
  }, []);

  const processScene = useCallback((scene: Scene, currentCharacter: Character) => {
    let charToUpdate = { ...currentCharacter };

    // --- Start of State Updates ---

    // Apply companion updates first as a full replacement
    if (scene.updatedCompanions) {
        charToUpdate.companions = scene.updatedCompanions;
    }

    // Apply direct changes from scene using service functions
    charToUpdate.stats = applyStatChanges(charToUpdate.stats, scene.statChanges);
    charToUpdate.inventory = applyInventoryChanges(charToUpdate.inventory, scene.inventoryChanges);
    charToUpdate.bodyParts = applyBodyPartChanges(charToUpdate.bodyParts, scene.bodyPartChanges);
    charToUpdate.weaponProficiencies = applyWeaponProficiencyUpdates(charToUpdate.weaponProficiencies, scene.updatedWeaponProficiencies);
    charToUpdate.magicMasteries = applyMagicMasteryUpdates(charToUpdate.magicMasteries, scene.updatedMagicMasteries);
    charToUpdate.faith = applyFaithUpdates(charToUpdate.faith, scene.updatedFaith);
    charToUpdate.sanctuary = applySanctuaryUpdate(charToUpdate.sanctuary, scene.updatedSanctuary);
    if (scene.updatedSkills) charToUpdate.skills = scene.updatedSkills;

    const { updatedIds, learnedRecipeNames } = learnNewRecipes(charToUpdate.knownRecipeIds, scene.newlyLearnedRecipes);
    charToUpdate.knownRecipeIds = updatedIds;

    const { updatedJournal, wasUpdated: journalWasUpdated } = applyJournalUpdates(charToUpdate.journal, scene.journalUpdates);
    if (journalWasUpdated) {
        charToUpdate.journal = updatedJournal;
    }

    // Handle additions to companions from taming/reanimation
    if (scene.tamingResult?.success && scene.tamingResult.companion) {
        charToUpdate.companions = [...charToUpdate.companions, scene.tamingResult.companion];
    }
    if (scene.reanimationResult?.success && scene.reanimationResult.companion) {
        charToUpdate.companions = [...charToUpdate.companions, scene.reanimationResult.companion];
    }
    
    // --- End of State Updates ---

    // Assemble all notifications into a single block for display
    let notificationText = assembleNotifications(scene, learnedRecipeNames, journalWasUpdated);
    
    // Add taming/reanimation notifications
    if (scene.tamingResult) {
        const tamingNotif = scene.tamingResult.success
            ? `[ Bạn đã thuần hóa thành công ${scene.tamingResult.creatureName}! Nó đã gia nhập đội của bạn. ]`
            : `[ Thuần hóa ${scene.tamingResult.creatureName} thất bại. ]`;
        notificationText = `${tamingNotif}\n\n${notificationText}`;
    }
    if (scene.reanimationResult) {
        const reanimationNotif = `[ ${scene.reanimationResult.message} ]`;
        notificationText = `${reanimationNotif}\n\n${notificationText}`;
    }
    
    const sceneDescription = notificationText ? `${notificationText}\n\n${scene.description}` : scene.description;
    
    // Final stat clamping and god mode application
    const { clampedStats, clampedHunger, clampedThirst } = clampStats(
      charToUpdate.stats, charToUpdate.hunger, charToUpdate.thirst,
      charToUpdate.maxHunger, charToUpdate.maxThirst
    );
    charToUpdate.stats = clampedStats;
    charToUpdate.hunger = clampedHunger;
    charToUpdate.thirst = clampedThirst;

    charToUpdate = applyGodMode(charToUpdate);
    
    const finalScene = {...scene, description: sceneDescription};

    setCharacter(charToUpdate);
    setCurrentScene(finalScene);

    if (finalScene.gameOver || (!charToUpdate.godMode && (charToUpdate.stats.hp <= 0 || charToUpdate.stats.san <= 0))) {
      let reason = finalScene.reason || '';
      if (charToUpdate.stats.hp <= 0 && !reason) reason = "Cơ thể bạn kiệt sức, đổ gục thành một đống máu me trên nền đá lạnh lẽo.";
      if (charToUpdate.stats.san <= 0 && !reason) reason = "Tâm trí bạn vỡ vụn, để lại bạn một cái vỏ rỗng tuếch, lạc lối trong những kinh hoàng bạn đã chứng kiến.";
      
      handleGameOver(reason, charToUpdate);
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

    // Reduce all skill cooldowns by 1 at the start of the turn
    updatedCharacter.skills = updatedCharacter.skills.map(skill => ({
      ...skill,
      currentCooldown: Math.max(0, skill.currentCooldown - 1),
    }));
    turnInfo += 'Một vài kỹ năng đã được hồi lại. ';

    const inCombat = currentScene.enemies && currentScene.enemies.length > 0;
    if (!inCombat && !updatedCharacter.godMode) {
        updatedCharacter.hunger = Math.max(0, updatedCharacter.hunger - HUNGER_PER_TURN);
        updatedCharacter.thirst = Math.max(0, updatedCharacter.thirst - THIRST_PER_TURN);
    }

    if (updatedCharacter.hunger === 0 && !updatedCharacter.godMode) {
        updatedCharacter.stats.hp = Math.max(0, updatedCharacter.stats.hp - 1);
        turnInfo += 'Cơn đói đang gặm nhấm bạn từ bên trong. ';
    }
     if (updatedCharacter.thirst === 0 && !updatedCharacter.godMode) {
        updatedCharacter.stats.hp = Math.max(0, updatedCharacter.stats.hp - 2);
        turnInfo += 'Cổ họng bạn khô rát vì thiếu nước. ';
    }

    let actionForGemini = choice;
    if (newTurnCount > 0 && newTurnCount % WORLD_EVENT_TURN_INTERVAL === 0 && !inCombat) {
        actionForGemini += "\n\n[CHỈ THỊ QUẢN TRÒ: Đã đến lúc cho một SỰ KIỆN THẾ GIỚI. Hãy đưa một yếu tố bất ngờ, đáng lo ngại hoặc kỳ lạ vào cảnh này.]";
    }

    const scene = await generateScene(updatedCharacter, actionForGemini, turnInfo, currentScene.enemies, enableGore);
    processScene(scene, updatedCharacter);
  }, [character, currentScene, processScene, turnCount, enableGore]);
  
  const startGame = useCallback(async (newCharacter: Character) => {
    setLoading(true);
    setCharacter(newCharacter);
    setTurnCount(0);
    setGameState('PLAYING');
    const firstAction = newCharacter.customScenario 
        ? `[HÀNH TRÌNH TÙY CHỈNH]: ${newCharacter.customScenario}`
        : "BẮT ĐẦU CUỘC PHIÊU LƯU: Nhân vật đặt những bước chân đầu tiên vào phế tích.";
    const firstScene = await generateScene(newCharacter, firstAction, '', [], enableGore);
    processScene(firstScene, newCharacter);
  }, [processScene, enableGore]);

  const handleStartCombatSandbox = useCallback(async () => {
    setLoading(true);
    // Create a default knight character for the sandbox
    const origin = ORIGINS.find(o => o.name === "Hiệp Sĩ Sa Ngã")!;
    
    const weaponProficiencies = ALL_WEAPON_PROFICIENCIES.reduce((acc, profName) => {
        const isOriginProficiency = profName === origin.weaponProficiency;
        acc[profName] = {
            level: isOriginProficiency ? 5 : 1,
            xp: 0,
            xpToNextLevel: isOriginProficiency ? 500 : 100,
        };
        return acc;
    }, {} as Record<string, Proficiency>);

    const defaultCharacter: Character = {
      name: "Chiến Binh Thử Nghiệm",
      gender: "Khác",
      backstory: "Một thực thể được tạo ra chỉ để chiến đấu.",
      difficulty: DIFFICULTIES[0],
      origin: origin,
      talent: origin.talents[0],
      personality: { name: "Dũng cảm", description: "Không bao giờ lùi bước", effect: ""},
      stats: { hp: 120, maxHp: 120, san: 100, maxSan: 100, mana: 50, maxMana: 50, stamina: 120, maxStamina: 120, attack: 10, defense: 10, speed: 5, charisma: 5 },
      bodyParts: { head: 'Khỏe Mạnh', torso: 'Khỏe Mạnh', leftArm: 'Khỏe Mạnh', rightArm: 'Khỏe Mạnh', leftLeg: 'Khỏe Mạnh', rightLeg: 'Khỏe Mạnh' },
      hunger: 100, maxHunger: 100, thirst: 100, maxThirst: 100,
      reputation: 0, 
      inventory: origin.startingEquipment,
      skills: origin.startingSkills.map(s => ({...s, currentCooldown: 0})),
      knownRecipeIds: origin.startingRecipes || [],
      weaponProficiencies: weaponProficiencies,
      magicMasteries: (["Huyền Bí", "Huyết Thuật", "Vực Thẳm", "Thánh Thánh"] as MagicSchool[]).reduce((acc, s) => ({...acc, [s]: {level: 1, xp: 0, xpToNextLevel: 100}}), {} as Record<MagicSchool, Proficiency>),
      faith: (["Sylvian", "Gro-goroth", "Alll-mer", "Khaos, Đấng Hỗn Mang", "Aethel, Người Dệt Hư Không", "Lithos, Ý Chí Của Đá"] as DeityName[]).reduce((acc, d) => ({...acc, [d]: {markLevel: 0, faithPoints: 0, faithPointsToNextLevel: 100}}), {} as Record<DeityName, FaithStatus>),
      sanctuary: null,
      journal: { quests: [], lore: [], characters: [], bestiary: [] },
      companions: [],
    };
    setCharacter(defaultCharacter);
    setTurnCount(0);
    setGameState('PLAYING');
    const scene = await generateScene(defaultCharacter, "[CHẾ ĐỘ THỬ NGHIỆM CHIẾN ĐẤU]: Bắt đầu một trận chiến ngẫu nhiên chống lại một kẻ thù đầy thách thức.", '', [], enableGore);
    processScene(scene, defaultCharacter);
  }, [processScene, enableGore]);

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
        // Basic validation
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
    const isPermadeath = character?.difficulty.permadeath;
    setCharacter(null);
    setCurrentScene(null);
    setGameOverReason('');
    setGameState(isPermadeath ? 'CHARACTER_CREATION' : 'START_SCREEN');
    setLoading(false);
    setTurnCount(0);
  };
  
  const renderContent = () => {
    switch (gameState) {
      case 'START_SCREEN':
        return <StartScreen onStart={handleGoToCreator} hasSave={hasSave} onContinue={handleContinue} onStartCombatSandbox={handleStartCombatSandbox} enableGore={enableGore} onGoreToggle={handleGoreToggle} />;
      case 'CHARACTER_CREATION':
        return <CharacterCreationScreen onFinish={handleCreationFinish} mode={creationMode} />;
      case 'PLAYING':
        return character && currentScene ? (
          <GameScreen 
            character={character} 
            scene={currentScene} 
            loading={loading} 
            onChoice={handleChoice} 
          />
        ) : <LoadingSpinner/>;
      case 'GAME_OVER':
        return <GameOverScreen reason={gameOverReason} onRestart={handleRestart} />;
      default:
        return <StartScreen onStart={handleGoToCreator} hasSave={hasSave} onContinue={handleContinue} onStartCombatSandbox={handleStartCombatSandbox} enableGore={enableGore} onGoreToggle={handleGoreToggle} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-gray-300 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/crissxcross.png')] opacity-10"></div>
      <div className="relative z-10 w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;