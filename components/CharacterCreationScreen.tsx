import React, { useState, useMemo, useCallback } from 'react';
import type { Character, Difficulty, Origin, Personality, Talent, PlayerStats, BaseStats, BodyPart, BodyPartStatus, MagicSchool, Proficiency, DeityName, Journal } from '../types';
import { DIFFICULTIES, ORIGINS, PERSONALITIES, ALL_WEAPON_PROFICIENCIES } from '../data/characterData';
import { generateBackstory } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface CharacterCreationScreenProps {
  onFinish: (character: Character) => void;
  mode: 'standard' | 'custom';
}

const BASE_STATS_TEMPLATE: BaseStats = {
  hp: 50, maxHp: 50,
  san: 50, maxSan: 50,
  mana: 20, maxMana: 20,
  stamina: 50, maxStamina: 50,
  attack: 5, defense: 5, speed: 5,
  charisma: 5
};

const STATS_FOR_POINT_BUY: (keyof BaseStats)[] = ['hp', 'san', 'mana', 'stamina', 'attack', 'defense', 'speed', 'charisma'];
const ALL_MAGIC_SCHOOLS: MagicSchool[] = ['Huyền Bí', 'Huyết Thuật', 'Vực Thẳm', 'Thánh Thánh'];
const ALL_DEITIES: DeityName[] = ['Sylvian', 'Gro-goroth', 'Alll-mer', 'Khaos, Đấng Hỗn Mang', 'Aethel, Người Dệt Hư Không', 'Lithos, Ý Chí Của Đá'];

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onFinish, mode }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Khác');
  const [backstory, setBackstory] = useState('');
  const [backstoryLoading, setBackstoryLoading] = useState(false);
  const [customScenario, setCustomScenario] = useState('');
  const [godMode, setGodMode] = useState(false);

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(DIFFICULTIES[0]);
  const [selectedOrigin, setSelectedOrigin] = useState<Origin | null>(null);
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<Personality | null>(null);

  const [spentPoints, setSpentPoints] = useState<Partial<Record<keyof BaseStats, number>>>({});

  const handleDifficultyChange = (d: Difficulty) => {
    setSelectedDifficulty(d);
    setSpentPoints({}); // Reset points on difficulty change
  };

  const handleOriginChange = (o: Origin) => {
    setSelectedOrigin(o);
    setSelectedTalent(null); // Reset talent when origin changes
  };

  const handleGenerateBackstory = useCallback(async () => {
    if (!name || !selectedOrigin) {
      alert("Vui lòng nhập Tên và chọn Nguồn Gốc trước khi tạo tiểu sử.");
      return;
    }
    setBackstoryLoading(true);
    try {
      const generated = await generateBackstory(name, gender, selectedOrigin.name);
      setBackstory(generated);
    } catch (error) {
      console.error("Lỗi tạo tiểu sử:", error);
      setBackstory("Không thể kết nối với các thế lực siêu nhiên để viết nên số phận của bạn. Hãy tự mình viết nó.");
    } finally {
      setBackstoryLoading(false);
    }
  }, [name, gender, selectedOrigin]);

  const handlePointChange = (stat: keyof BaseStats, amount: number) => {
    const currentSpent = spentPoints[stat] || 0;
    const newSpent = currentSpent + amount;
    
    const otherPoints = Object.entries(spentPoints)
        .filter(([key]) => key !== stat)
        .reduce((acc, [, val]) => acc + (val || 0), 0);
    const totalSpent = otherPoints + newSpent;
    
    if (newSpent >= 0 && totalSpent <= selectedDifficulty.pointBuy) {
      setSpentPoints(prev => ({ ...prev, [stat]: newSpent }));
    }
  };

  const finalStats = useMemo<PlayerStats>(() => {
    const final: any = { ...BASE_STATS_TEMPLATE };
    if (selectedOrigin) {
      for (const [key, value] of Object.entries(selectedOrigin.baseStats)) {
        final[key] = (final[key] || 0) + value;
      }
    }
    for (const [key, value] of Object.entries(spentPoints)) {
        final[key] = (final[key] || 0) + value;
    }
    // Sync max values
    final.maxHp = final.hp;
    final.maxSan = final.san;
    final.maxMana = final.mana;
    final.maxStamina = final.stamina;

    return final;
  }, [selectedOrigin, spentPoints]);
  
  const remainingPoints = selectedDifficulty.pointBuy - Object.values(spentPoints).reduce((a, b) => a + (b || 0), 0);

  const isFormValid = name.trim() && selectedOrigin && selectedTalent && selectedPersonality && (godMode || remainingPoints === 0) && (mode === 'standard' || customScenario.trim());

  const handleSubmit = () => {
    if (!isFormValid || !selectedOrigin || !selectedTalent || !selectedPersonality) {
      alert("Vui lòng hoàn thành tất cả các lựa chọn, sử dụng hết điểm phân bổ và điền kịch bản tùy chỉnh (nếu có).");
      return;
    }
    
    const initialBodyParts: Record<BodyPart, BodyPartStatus> = {
        head: 'Khỏe Mạnh',
        torso: 'Khỏe Mạnh',
        leftArm: 'Khỏe Mạnh',
        rightArm: 'Khỏe Mạnh',
        leftLeg: 'Khỏe Mạnh',
        rightLeg: 'Khỏe Mạnh',
    };

    const weaponProficiencies = ALL_WEAPON_PROFICIENCIES.reduce((acc, profName) => {
        const isOriginProficiency = profName === selectedOrigin.weaponProficiency;
        acc[profName] = { 
            level: isOriginProficiency ? 2 : 1, 
            xp: 0, 
            xpToNextLevel: isOriginProficiency ? 150 : 100 
        };
        return acc;
    }, {} as Record<string, Proficiency>);
    
    const magicMasteries = ALL_MAGIC_SCHOOLS.reduce((acc, school) => {
        acc[school] = { level: 1, xp: 0, xpToNextLevel: 100 };
        return acc;
    }, {} as Record<MagicSchool, Proficiency>);

    const skills = selectedOrigin.startingSkills.map(skill => ({...skill, currentCooldown: 0 }));

    const initialFaith = ALL_DEITIES.reduce((acc, deity) => {
        acc[deity] = { markLevel: 0, faithPoints: 0, faithPointsToNextLevel: 100 };
        return acc;
    }, {} as Record<DeityName, any>);

    const initialJournal: Journal = {
        quests: [],
        lore: [],
        characters: [],
        bestiary: [],
    };

    const character: Character = {
      name: name.trim(),
      gender,
      backstory: backstory.trim() || "Một linh hồn câm lặng với quá khứ không thể nói thành lời.",
      difficulty: selectedDifficulty,
      origin: selectedOrigin,
      talent: selectedTalent,
      personality: selectedPersonality,
      stats: finalStats,
      bodyParts: initialBodyParts,
      hunger: 100,
      maxHunger: 100,
      thirst: 100,
      maxThirst: 100,
      reputation: selectedPersonality?.name === "Tàn nhẫn" ? -10 : 0,
      inventory: { ...selectedOrigin.startingEquipment },
      skills: skills,
      knownRecipeIds: selectedOrigin.startingRecipes || [],
      weaponProficiencies: weaponProficiencies,
      magicMasteries: magicMasteries,
      faith: initialFaith,
      sanctuary: null,
      journal: initialJournal,
      companions: [],
      godMode: godMode,
      customScenario: mode === 'custom' ? customScenario.trim() : undefined,
    };
    onFinish(character);
  };

  const renderSection = (title: string, children: React.ReactNode, extraClasses: string = "") => (
    <div className={`mb-8 p-4 border border-gray-800 rounded-md bg-black/30 ${extraClasses}`}>
      <h2 className="text-2xl font-bold text-red-600 mb-4 border-b border-gray-700 pb-2">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-black/70 border border-gray-800 shadow-2xl shadow-red-900/20 rounded-lg backdrop-blur-sm text-gray-300">
      <h1 className="text-4xl font-bold text-center text-red-700 mb-6">Tạo Dựng Số Phận</h1>

      {mode === 'custom' && renderSection("Kịch Bản Tùy Chỉnh", (
        <div>
            <p className="text-sm text-gray-400 mb-2">Viết ra bối cảnh, nhân vật và mục tiêu của bạn. AI sẽ sử dụng điều này làm điểm khởi đầu cho cuộc phiêu lưu của bạn.</p>
            <textarea value={customScenario} onChange={e => setCustomScenario(e.target.value)} placeholder="Ví dụ: 'Tôi là một thợ săn quái vật già nua, đi tìm một loài thảo dược quý hiếm trong khu rừng bị nguyền rủa để cứu con gái mình...'" rows={5} className="w-full bg-gray-900 border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
        </div>
      ), "border-purple-500")}

      {renderSection("Thông Tin Cơ Bản", (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tên Nhân Vật" className="bg-gray-900 border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500" />
          <select value={gender} onChange={e => setGender(e.target.value)} className="bg-gray-900 border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500">
            <option>Nam</option>
            <option>Nữ</option>
            <option>Khác</option>
          </select>
          <div className="md:col-span-2">
            <textarea value={backstory} onChange={e => setBackstory(e.target.value)} placeholder="Tiểu sử (tùy chọn, hoặc để AI tạo)" rows={4} className="w-full bg-gray-900 border border-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
            <button onClick={handleGenerateBackstory} disabled={backstoryLoading || !name || !selectedOrigin} className="mt-2 bg-transparent border border-purple-500 text-purple-400 px-4 py-2 rounded text-sm hover:bg-purple-500 hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed">
              {backstoryLoading ? <LoadingSpinner /> : "AI Tạo Tiểu Sử"}
            </button>
          </div>
        </div>
      ))}

      {renderSection("Độ Khó & Chế Độ Chơi", (
        <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DIFFICULTIES.map(d => (
            <button key={d.name} onClick={() => handleDifficultyChange(d)} className={`p-2 border-2 rounded transition ${selectedDifficulty.name === d.name ? 'border-red-500 bg-red-900/30' : 'border-gray-700 hover:bg-gray-800'}`}>
              <h3 className="font-bold">{d.name}</h3>
              <p className="text-xs text-gray-400">{d.description}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded-md">
            <input type="checkbox" id="god-mode" checked={godMode} onChange={(e) => setGodMode(e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500"/>
            <label htmlFor="god-mode" className="font-bold text-yellow-300">Ý Chí Sáng Thế (God Mode)</label>
        </div>
        {godMode && <p className="text-xs text-yellow-400 mt-1">Bất tử, tài nguyên vô hạn. Điểm phân bổ sẽ không cần thiết.</p>}
        </>
      ))}

      {renderSection("Nguồn Gốc", (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ORIGINS.map(o => (
             <button key={o.name} onClick={() => handleOriginChange(o)} className={`p-3 border-2 rounded transition text-left h-full ${selectedOrigin?.name === o.name ? 'border-red-500 bg-red-900/30' : 'border-gray-700 hover:bg-gray-800'}`}>
              <h3 className="font-bold text-base">{o.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{o.description}</p>
            </button>
          ))}
        </div>
      ))}
      
      {selectedOrigin && renderSection("Thiên Phú & Kỹ năng khởi đầu", (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {selectedOrigin.talents.map(t => (
                <button key={t.name} onClick={() => setSelectedTalent(t)} className={`p-3 border-2 rounded transition text-left h-full ${selectedTalent?.name === t.name ? 'border-red-500 bg-red-900/30' : 'border-gray-700 hover:bg-gray-800'}`}>
                <h3 className="font-bold">{t.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{t.description}</p>
                </button>
            ))}
            </div>
             <div className="mt-4">
                 <h4 className="font-bold text-gray-400">Kỹ năng khởi đầu:</h4>
                 {selectedOrigin.startingSkills.map(s => (
                     <div key={s.id} className="p-2 bg-gray-900/50 rounded mt-1">
                         <p className="font-semibold text-red-400">{s.name}</p>
                         <p className="text-xs text-gray-400">{s.description}</p>
                     </div>
                 ))}
             </div>
          </>
      ))}


       {renderSection("Tính Cách (Chọn 1)", (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PERSONALITIES.map(p => (
            <button key={p.name} onClick={() => setSelectedPersonality(p)} className={`p-3 border-2 rounded transition text-left h-full ${selectedPersonality?.name === p.name ? 'border-red-500 bg-red-900/30' : 'border-gray-700 hover:bg-gray-800'}`}>
              <h3 className="font-bold">{p.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{p.description}</p>
            </button>
          ))}
        </div>
      ))}

      {!godMode && renderSection(`Phân Bổ Điểm (Còn lại: ${remainingPoints})`, (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS_FOR_POINT_BUY.map(key => {
            const statKey = key as keyof BaseStats;
            return (
              <div key={statKey}>
                <label className="capitalize text-gray-400">{statKey}</label>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => handlePointChange(statKey, -1)} className="px-2 py-0.5 bg-gray-700 rounded">-</button>
                  <span className="font-bold text-lg w-16 text-center">{finalStats[statKey]}</span>
                  <button onClick={() => handlePointChange(statKey, 1)} className="px-2 py-0.5 bg-gray-700 rounded">+</button>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <div className="text-center mt-8">
        <button onClick={handleSubmit} disabled={!isFormValid} className="bg-transparent border-2 border-red-600 text-red-500 font-bold py-3 px-12 rounded-sm hover:bg-red-600 hover:text-black transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500/50 disabled:border-red-600/50">
          Bắt Đầu Hành Trình
        </button>
        {!isFormValid && <p className="text-xs text-gray-500 mt-2">Cần chọn tên, nguồn gốc, thiên phú, tính cách và dùng hết điểm (trừ khi ở God Mode). Nếu ở chế độ tùy chỉnh, hãy điền kịch bản.</p>}
      </div>

    </div>
  );
};

export default CharacterCreationScreen;