
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Scene, Enemy, NPC } from '../types';
import { retrieveRelevantLore } from './ragService';
import { createPrunedCharacterForAI } from './aiPromptService';

const AI_CONFIG_KEY = 'ai_source_config_v1';

let ai_instance_for_service: GoogleGenAI | null;
let ai_config = { source: 'default' as 'default' | 'custom', keys: [] as string[], currentIndex: 0 };

function loadAiConfig() {
    try {
        const saved = localStorage.getItem(AI_CONFIG_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.source && Array.isArray(parsed.keys)) {
                ai_config = { ...{ source: 'default', keys: [], currentIndex: 0 }, ...parsed };
            }
        }
    } catch (e) {
        console.error("Failed to load AI config, using default.", e);
        localStorage.removeItem(AI_CONFIG_KEY);
    }
}

function getApiKey(): string | undefined {
    if (ai_config.source === 'custom' && ai_config.keys.length > 0) {
        return ai_config.keys[ai_config.currentIndex];
    }
    if (!process.env.API_KEY) {
        console.warn("API_KEY environment variable not set. Default AI source may not work.");
    }
    return process.env.API_KEY;
}

function initializeAi() {
    const apiKey = getApiKey();
    if (apiKey) {
        try {
            ai_instance_for_service = new GoogleGenAI({ apiKey });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI, likely due to invalid API key format.", e);
            ai_instance_for_service = null;
        }
    } else {
        ai_instance_for_service = null;
    }
}

export function saveAiConfig(source: 'default' | 'custom', keys: string[]) {
    ai_config = { source, keys, currentIndex: 0 };
    try {
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(ai_config));
    } catch (e) {
      console.error("Failed to save AI config.", e);
    }
    initializeAi();
}

export function getAiConfig() {
    return { ...ai_config };
}

function rotateKey() {
    if (ai_config.source === 'custom' && ai_config.keys.length > 1) {
        ai_config.currentIndex = (ai_config.currentIndex + 1) % ai_config.keys.length;
        try {
            localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(ai_config));
        } catch(e) {
            console.error("Could not save rotated key index to localStorage", e);
        }
        initializeAi();
        console.log(`Rotated to API key index ${ai_config.currentIndex}`);
        return true;
    }
    return false;
}

// Initial load and initialization
loadAiConfig();
initializeAi();

async function callGeminiWithRetry(params: any, isBackstory = false) {
    if (!ai_instance_for_service) {
        const errorMsg = "AI Client không được khởi tạo. Vui lòng cấu hình API Key trong phần 'Quản Lý Nguồn AI' ở màn hình chính hoặc đảm bảo API Key mặc định được thiết lập đúng.";
        if (isBackstory) return { text: errorMsg, fullResponse: null };
        throw new Error(errorMsg);
    }
    try {
        const response = await ai_instance_for_service.models.generateContent(params);
        return { text: response.text, fullResponse: response };
    } catch (error) {
        console.error("Gemini API Error:", error);
        const rotated = rotateKey();
        if (rotated) {
            console.log("Retrying with new key...");
            if (!ai_instance_for_service) {
                 if (isBackstory) return { text: "AI Client không thể khởi tạo với key mới.", fullResponse: null };
                 throw new Error("AI Client could not be re-initialized with the new key.");
            }
            const response = await ai_instance_for_service.models.generateContent(params);
            return { text: response.text, fullResponse: response };
        }
        throw error;
    }
}

// --- START: SIMPLIFIED SCHEMAS ---

const recipeMaterialSchema = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, quantity: { type: Type.INTEGER } },
    required: ['name', 'quantity'],
};
const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING },
        materials: { type: Type.ARRAY, items: recipeMaterialSchema },
        result: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.INTEGER } }, required: ['name', 'quantity'] },
    },
    required: ['id', 'name', 'description', 'materials', 'result']
};
const companionStatsSchema = {
    type: Type.OBJECT,
    properties: {
        hp: { type: Type.INTEGER }, maxHp: { type: Type.INTEGER }, attack: { type: Type.INTEGER }, defense: { type: Type.INTEGER },
        speed: { type: Type.INTEGER }, san: { type: Type.INTEGER }, maxSan: { type: Type.INTEGER }, mana: { type: Type.INTEGER },
        maxMana: { type: Type.INTEGER }, stamina: { type: Type.INTEGER }, maxStamina: { type: Type.INTEGER }, charisma: { type: Type.INTEGER },
    },
    required: ['hp', 'maxHp', 'attack', 'defense', 'speed', 'san', 'maxSan', 'mana', 'maxMana', 'stamina', 'maxStamina', 'charisma'],
};
const companionSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING }, type: { type: Type.STRING }, stats: companionStatsSchema,
        statusEffects: { type: Type.ARRAY, items: { type: Type.STRING } }, isUndead: { type: Type.BOOLEAN }
    },
    required: ['name', 'type', 'stats', 'statusEffects', 'isUndead'],
};
const tamingResultSchema = {
    type: Type.OBJECT,
    properties: {
        success: { type: Type.BOOLEAN }, creatureName: { type: Type.STRING }, creatureType: { type: Type.STRING },
        companion: { ...companionSchema },
    },
    required: ['success', 'creatureName', 'creatureType'],
};
const reanimationResultSchema = {
    type: Type.OBJECT,
    properties: {
        success: { type: Type.BOOLEAN }, creatureName: { type: Type.STRING }, companion: { ...companionSchema },
        message: { type: Type.STRING }
    },
    required: ['success', 'creatureName', 'message'],
};
const enemyStatsSchema = {
    type: Type.OBJECT,
    properties: {
        hp: { type: Type.INTEGER }, maxHp: { type: Type.INTEGER }, attack: { type: Type.INTEGER },
        defense: { type: Type.INTEGER }, speed: { type: Type.INTEGER },
    },
    required: ['hp', 'maxHp', 'attack', 'defense', 'speed']
};
const bodyPartsSchema = {
    type: Type.OBJECT,
    properties: {
        head: { type: Type.STRING }, torso: { type: Type.STRING }, leftArm: { type: Type.STRING },
        rightArm: { type: Type.STRING }, leftLeg: { type: Type.STRING }, rightLeg: { type: Type.STRING },
    },
    required: ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']
};
const enemySchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING },
        stats: enemyStatsSchema, bodyParts: bodyPartsSchema, telegraphedAction: { type: Type.STRING },
        statusEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['id', 'name', 'description', 'stats', 'bodyParts', 'telegraphedAction', 'statusEffects'],
};
const npcSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING },
        disposition: { type: Type.STRING },
        dialogueHistory: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['id', 'name', 'description', 'disposition']
};
const skillSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING },
        costType: { type: Type.STRING }, costAmount: { type: Type.INTEGER }, cooldown: { type: Type.INTEGER },
        currentCooldown: { type: Type.INTEGER }, school: { type: Type.STRING },
    },
    required: ['id', 'name', 'description', 'costType', 'costAmount', 'cooldown', 'currentCooldown']
};
const proficiencySchema = {
    type: Type.OBJECT,
    properties: {
        unlocked: { type: Type.BOOLEAN }, level: { type: Type.INTEGER }, xp: { type: Type.INTEGER },
        xpToNextLevel: { type: Type.INTEGER },
    },
    required: ['unlocked', 'level', 'xp', 'xpToNextLevel']
};
const faithStatusSchema = {
    type: Type.OBJECT,
    properties: {
        markLevel: { type: Type.INTEGER }, faithPoints: { type: Type.INTEGER },
        faithPointsToNextLevel: { type: Type.INTEGER },
    },
    required: ['markLevel', 'faithPoints', 'faithPointsToNextLevel']
};
const followerSchema = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, loyalty: { type: Type.INTEGER }, status: { type: Type.STRING } },
    required: ['name', 'loyalty', 'status']
};
const sanctuarySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING }, hope: { type: Type.INTEGER }, population: { type: Type.INTEGER },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
        followers: { type: Type.ARRAY, items: followerSchema },
    },
    required: ['name', 'hope', 'population', 'improvements', 'followers']
};
const hitChanceSchema = {
    type: Type.OBJECT,
    properties: { choice: { type: Type.STRING }, chance: { type: Type.INTEGER } },
    required: ['choice', 'chance'],
};
const weaponProficiencyUpdateSchema = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, proficiency: proficiencySchema },
    required: ['name', 'proficiency'],
};
const magicMasteryUpdateSchema = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, proficiency: proficiencySchema },
    required: ['name', 'proficiency'],
};
const faithUpdateSchema = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, status: faithStatusSchema },
    required: ['name', 'status'],
};
const journalEntrySchema = {
    type: Type.OBJECT,
    properties: { title: { type: Type.STRING }, content: { type: Type.STRING } },
    required: ['title', 'content']
};
const inventoryChangeSchema = {
    type: Type.OBJECT,
    properties: { itemName: { type: Type.STRING }, quantity: { type: Type.INTEGER } },
    required: ['itemName', 'quantity'],
};
const markLevelUpEventSchema = {
    type: Type.OBJECT,
    properties: { deity: { type: Type.STRING }, newLevel: { type: Type.INTEGER } },
    required: ['deity', 'newLevel']
};

// NEW SIMPLIFIED ARRAY-BASED SCHEMAS
const statChangeSchema = {
    type: Type.OBJECT,
    properties: { stat: { type: Type.STRING }, change: { type: Type.INTEGER } },
    required: ['stat', 'change'],
};
const bodyPartChangeSchema = {
    type: Type.OBJECT,
    properties: { part: { type: Type.STRING }, status: { type: Type.STRING } },
    required: ['part', 'status'],
};
const specialSkillUpdateSchema = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, proficiency: proficiencySchema },
    required: ['name', 'proficiency'],
};
const journalUpdateSchema = {
    type: Type.OBJECT,
    properties: { category: { type: Type.STRING }, title: { type: Type.STRING }, content: { type: Type.STRING } },
    required: ['category', 'title', 'content'],
};


const sceneSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING },
    choices: { type: Type.ARRAY, items: { type: Type.STRING } },
    hitChances: { type: Type.ARRAY, items: hitChanceSchema },
    enemies: { type: Type.ARRAY, items: enemySchema },
    npcs: { type: Type.ARRAY, items: npcSchema },
    statChanges: { type: Type.ARRAY, items: statChangeSchema },
    inventoryChanges: { type: Type.ARRAY, items: inventoryChangeSchema },
    bodyPartChanges: { type: Type.ARRAY, items: bodyPartChangeSchema },
    gameOver: { type: Type.BOOLEAN },
    reason: { type: Type.STRING },
    endingKey: { type: Type.STRING },
    updatedSkills: { type: Type.ARRAY, items: skillSchema },
    newlyLearnedRecipes: { type: Type.ARRAY, items: recipeSchema },
    updatedWeaponProficiencies: { type: Type.ARRAY, items: weaponProficiencyUpdateSchema },
    updatedMagicMasteries: { type: Type.ARRAY, items: magicMasteryUpdateSchema },
    updatedSpecialSkills: { type: Type.ARRAY, items: specialSkillUpdateSchema },
    specialSkillLearnedNotification: { type: Type.STRING },
    xpGains: { type: Type.ARRAY, items: { type: Type.STRING } },
    levelupNotification: { type: Type.STRING },
    skillLearnedNotification: { type: Type.STRING },
    recipeLearnedNotification: { type: Type.STRING },
    updatedFaith: { type: Type.ARRAY, items: faithUpdateSchema },
    updatedSanctuary: { ...sanctuarySchema },
    faithNotification: { type: Type.STRING },
    sanctuaryNotification: { type: Type.STRING },
    markLevelUpEvent: { ...markLevelUpEventSchema },
    companionActionDescriptions: { type: Type.ARRAY, items: {type: Type.STRING} },
    updatedCompanions: { type: Type.ARRAY, items: companionSchema },
    tamingResult: { ...tamingResultSchema },
    reanimationResult: { ...reanimationResultSchema },
    journalUpdates: { type: Type.ARRAY, items: journalUpdateSchema },
  },
  required: ['description', 'choices', 'enemies', 'gameOver'],
};

// --- END: SIMPLIFIED SCHEMAS ---


const NARRATOR_SYSTEM_INSTRUCTION = `Bạn là Người Quản Trò (Game Master), một AI dẫn chuyện cho một RPG văn bản kỳ ảo hắc ám. Bạn chỉ tập trung vào tường thuật, khám phá và sinh tồn.
**LUẬT CHUNG:**
1.  **TÔNG GIỌNG:** U ám, trưởng thành, và mô tả chi tiết.
2.  **JSON:** Luôn tuân thủ schema JSON. **TUYỆT ĐỐI KHÔNG BAO GIỜ bỏ qua các trường 'required' trong schema.**
3.  **HÀNH ĐỘNG NGƯỜI CHƠI:** Dựa vào hành động của người chơi để kể chuyện. Nếu một hành động dẫn đến chiến đấu, hãy mô tả kẻ thù xuất hiện, điền thông tin vào mảng \`enemies\` và kết thúc lượt.
4.  **LỰA CHỌN LÀ TỐI QUAN TRỌNG:** Mảng \`choices\` BẮT BUỘC phải chứa từ 3-5 hành động sáng tạo, khác biệt và phù hợp cho người chơi. **KHÔNG BAO GIỜ** trả về một mảng \`choices\` rỗng trừ khi \`gameOver\` là true hoặc có \`markLevelUpEvent\`. Các lựa chọn phải thúc đẩy câu chuyện tiến triển.
5.  **SINH TỒN & QUAN SÁT:** Quản lý cơn đói và khát của người chơi. Nếu người chơi chọn 'Quan sát' hoặc hành động tương tự, hãy thưởng cho họ bằng cách mô tả một chi tiết ẩn, một vật phẩm bị che giấu hoặc một manh mối trong \`description\`. Phần thưởng vật phẩm thực tế phải được thêm vào \`inventoryChanges\`.
6.  **KHÔNG CHIẾN ĐẤU:** Bạn KHÔNG xử lý logic chiến đấu theo lượt. AI khác sẽ làm việc đó.
7.  **NỘI DUNG & CHẾ ĐỘ:** Tôn trọng cờ 'enableGore' và 'godMode'. Xử lý hội thoại NPC một cách tự nhiên.
8.  **PHẦN THƯỞNG KHÁM PHÁ:** Khi người chơi thành công vượt qua thử thách, thưởng cho họ vật phẩm có giá trị như "Sách Phép", "Cổ Thư", "Sách Hướng Dẫn Thuần Hóa", hoặc "Sách Nghi Lễ Cấm" qua \`inventoryChanges\`.
9.  **SỬ DỤNG TRI THỨC (QUAN TRỌNG NHẤT):** Nếu có phần 'THÔNG TIN TỪ THƯ VIỆN TRI THỨC', bạn BẮT BUỘC phải dùng những chi tiết đó để làm cho lời kể của bạn trở nên sống động, nhất quán và có chiều sâu. Đây là nguồn kiến thức cốt lõi về thế giới, giúp bạn "nhớ" lại những sự kiện hoặc chi tiết liên quan. Hãy tích hợp nó một cách tự nhiên vào phần mô tả của bạn.
10. **KẾT THÚC ĐẶC BIỆT:** Đối với các kết thúc mang tính tường thuật (không phải chết do hết HP/SAN), hãy đặt \`gameOver: true\`, cung cấp một \`reason\` mô tả chi tiết, và đặt \`endingKey\` thành một mã định danh duy nhất (ví dụ: 'ESCAPE_ALONE', 'PUPPET_FATE').
11. **QUẢN LÝ NPC:**
    *   **Tính liên tục (QUAN TRỌNG NHẤT):** Nếu một NPC đã có mặt trong prompt (\`currentNpcs\`) và người chơi không làm gì để họ rời đi, bạn **BẮT BUỘC** phải đưa họ trở lại vào mảng \`npcs\` trong phản hồi. Điều này là tối quan trọng để NPC không "biến mất". Bạn có thể cập nhật thái độ (\`disposition\`) của họ dựa trên hành động của người chơi.
    *   **Giới thiệu:** Bạn có thể giới thiệu NPC mới vào cảnh bằng cách điền thông tin vào mảng \`npcs\`. Mỗi NPC cần có id, tên, mô tả và thái độ ban đầu.
    *   **Tương tác:** Khi người chơi nói chuyện với NPC, hãy cập nhật \`description\` với đoạn hội thoại. Cung cấp các lựa chọn liên quan đến NPC như "Nói chuyện với [Tên NPC]", "Hỏi về [chủ đề]", "Tấn công [Tên NPC]".
    *   **Chiêu mộ:** Trong những trường hợp hiếm hoi và hợp lý (thái độ 'Thân thiện', thuyết phục thành công), bạn có thể cho phép người chơi chiêu mộ một NPC. Khi đó, hãy xóa họ khỏi mảng \`npcs\` và thêm họ vào mảng \`updatedCompanions\`, chuyển đổi họ thành một đối tượng đồng hành.

**LUẬT THEO ĐỘ KHÓ:** Bạn BẮT BUỘC phải điều chỉnh phản hồi theo độ khó được cung cấp. Ở độ khó cao hơn, tài nguyên khan hiếm hơn, kẻ thù nguy hiểm hơn, và NPC ít hợp tác hơn.

**KỸ NĂNG & PHÉP THUẬT:**
*   **HỌC QUA SÁCH:** Khi người chơi "Đọc [Tên Sách Phép]", bạn BẮT BUỘC phải:
    1.  Thêm kỹ năng/phép thuật tương ứng vào mảng \`updatedSkills\`. Mảng này chỉ nên chứa **DUY NHẤT** kỹ năng mới này. Bạn phải tự định nghĩa toàn bộ đối tượng Skill.
    2.  Tạo một \`skillLearnedNotification\` rõ ràng.
    3.  Xóa sách đó khỏi túi đồ của người chơi bằng \`inventoryChanges\` với số lượng -1.

**KỸ NĂNG ĐẶC BIỆT (THUẦN THÚ & TỬ LINH):**
*   **MỞ KHÓA:**
    *   Khi người chơi đọc sách chuyên môn, hãy mở khóa kỹ năng tương ứng trong \`updatedSpecialSkills\` (\`unlocked: true\`, \`level: 1\`).
    *   Thông báo cho người chơi bằng \`specialSkillLearnedNotification\`.
    *   Thêm một kỹ năng cơ bản đầu tiên vào \`updatedSkills\` (ví dụ: "Thử Thuần Hóa").
    *   Xóa sách khỏi túi đồ.
*   **TĂNG KINH NGHIỆM (XP):** Tăng XP trong \`updatedSpecialSkills\` khi người chơi sử dụng kỹ năng đó.
*   **LÊN CẤP:** Khi \`xp\` đạt \`xpToNextLevel\`, tăng \`level\`, reset \`xp\`, và thưởng cho người chơi.
*   **Xử lý Thuần Hóa/Gọi Hồn:** Chỉ xử lý các nỗ lực bên ngoài chiến đấu. Xác định kết quả trong \`tamingResult\` hoặc \`reanimationResult\`.

**NGOẠI THẦN & TÍN NGƯỠNG:**
*   **Thực thể:** Khaos (hỗn loạn), Aethel (bí ẩn), Lithos (bất biến).
*   **TÁC ĐỘNG TINH THẦN:** Tiếp xúc với Ngoại Thần gây sát thương Tinh thần ('san' trong \`statChanges\`).
*   **THĂNG CẤP ẤN KÝ:** Khi \`markLevel\` tăng, đặt \`markLevelUpEvent\`. KHÔNG cung cấp \`choices\`. Ở lượt tiếp theo, người chơi sẽ chọn Con Đường. Dựa vào lựa chọn đó, hãy ban cho họ Sức Mạnh (\`statChanges\`), Quyền Năng (\`updatedSkills\`), hoặc Ảnh Hưởng (\`updatedSanctuary\`).
*   **QUẢN LÝ THÁNH ĐỊA:** Xử lý các lệnh quản lý Thánh Địa bằng cách cập nhật \`updatedSanctuary\`.
*   **CẬP NHẬT TÍN NGƯỠNG:** Sử dụng \`updatedFaith\` và \`faithNotification\` để thông báo thay đổi.`;


const COMBAT_SYSTEM_INSTRUCTION = `Bạn là một AI Chiến Thuật Gia, chỉ xử lý một lượt chiến đấu trong một RPG.
**LUẬT CHUNG:**
1.  **CHỈ CHIẾN ĐẤU:** Nhiệm vụ của bạn chỉ giới hạn trong các hành động chiến đấu. Bỏ qua mọi NPC, câu chuyện, hoặc yếu tố khám phá có thể xuất hiện trong prompt. Chỉ tập trung vào người chơi, đồng hành và kẻ thù.
2.  **JSON:** Luôn tuân thủ schema JSON. **TUYỆT ĐỐI KHÔNG BAO GIỜ bỏ qua các trường 'required' trong schema.**
3.  **LỰA CHỌN LÀ TỐI QUAN TRỌNG:** Sau khi xử lý hành động, mảng \`choices\` BẮT BUỘC phải chứa các hành động chiến đấu phù hợp cho lượt tiếp theo (ví dụ: "Tấn công lần nữa", "Phòng thủ", "Đánh giá kẻ thù"). **KHÔNG BAO GIỜ** trả về một mảng \`choices\` rỗng trừ khi trận chiến kết thúc (mảng \`enemies\` rỗng hoặc \`gameOver\` là true).
4.  **NHIỆM VỤ:** Nhận trạng thái người chơi, kẻ thù và hành động của người chơi. Trả về kết quả chính xác của lượt đó. Khi kẻ thù bị đánh bại, trao vật phẩm qua \`inventoryChanges\` và kinh nghiệm qua \`xpGains\`.
5.  **CƠ BẢN:** Áp dụng nghiêm ngặt các quy tắc: nhắm mục tiêu bộ phận, hành động báo trước của kẻ thù, tỷ lệ trúng, hiệu ứng trạng thái.
6.  **TÍNH TOÁN:** Tính toán chính xác sát thương, thay đổi máu, cập nhật trạng thái bộ phận và hiệu ứng.

**LUẬT SỬ DỤNG KỸ NĂNG CỦA NGƯỜI CHƠI:**
Khi hành động của người chơi là "Sử dụng kỹ năng: [Tên Kỹ Năng]":
1.  **Xác định Kỹ năng:** Tìm kỹ năng tương ứng trong mảng \`character.skills\`.
2.  **Áp dụng Hiệu ứng:** Đọc mô tả của kỹ năng và áp dụng chính xác hiệu ứng của nó. 
3.  **Trừ Chi phí:** Trừ chi phí tài nguyên (\`costType\`, \`costAmount\`) từ người chơi thông qua \`statChanges\`.
4.  **Đặt Hồi chiêu:** Trong mảng \`updatedSkills\`, trả về **CHỈ DUY NHẤT** đối tượng kỹ năng đã được sử dụng, đặt \`currentCooldown\` bằng \`cooldown\` gốc.
5.  **Mô tả:** Mô tả rõ ràng hành động sử dụng kỹ năng và kết quả trong trường \`description\` chính.

**LUẬT CHIẾN ĐẤU CỦA ĐỒNG HÀNH & ĐỆ TỬ:**
1.  **Hành động:** Mỗi đồng hành/đệ tử trong \`character.companions\` hành động TỰ ĐỘNG một lần mỗi lượt. Bạn quyết định hành động của chúng dựa trên bản chất và tình hình. Mô tả hành động của chúng trong \`companionActionDescriptions\`.
2.  **Cập nhật:** Cập nhật trạng thái của chúng (HP, hiệu ứng, v.v.) và trả về toàn bộ danh sách đã cập nhật trong \`updatedCompanions\`.
3.  **Mục tiêu:** Kẻ thù có thể tấn công người chơi hoặc đồng hành. Đệ tử bất tử có xu hướng tấn công mục tiêu gần nhất.
4.  **Mô tả:** Luôn cung cấp mô tả rõ ràng cho hành động của từng đồng hành. Ví dụ: "Zombie của bạn lao tới và cắn vào chân của Kẻ Lang Thang."`;


const BACKSTORY_GENERATION_INSTRUCTION = `Tạo một đoạn tiểu sử ngắn (3-5 câu) cho một nhân vật trong một thế giới kỳ ảo hắc ám, tàn bạo.
- **Tên nhân vật:** {name}
- **Giới tính:** {gender}
- **Nguồn gốc:** {origin}
Giữ giọng văn u ám, phù hợp với bối cảnh của Fear & Hunger và Berserk. Tập trung vào một sự kiện định hình nên con người họ.`;

const model = "gemini-2.5-flash";

export async function generateScene(
  character: Character,
  playerAction: string,
  turnInfo: string,
  currentEnemies: Enemy[] | undefined,
  currentNpcs: NPC[] | undefined,
  enableGore: boolean
): Promise<Scene> {

    const inCombat = !!currentEnemies && currentEnemies.length > 0;
    const systemInstruction = inCombat
        ? COMBAT_SYSTEM_INSTRUCTION
        : NARRATOR_SYSTEM_INSTRUCTION;

    let ragContext = '';
    if (!inCombat) {
        const loreContext = `${playerAction} ${character.origin.name} ${Object.keys(character.inventory).join(' ')}`;
        const relevantLore = retrieveRelevantLore(loreContext, 3);
        if (relevantLore.length > 0) {
            ragContext = `
---
**THÔNG TIN TỪ THƯ VIỆN TRI THỨC (Sử dụng để làm giàu câu chuyện):**
${relevantLore.map(e => `- ${e.content}`).join('\n')}
---`;
        }
    }
    
    const prunedCharacter = createPrunedCharacterForAI(character);

    const prompt = `
    ---
    **Bối cảnh:** Một thế giới kỳ ảo đen tối, tàn bạo và không khoan nhượng.
    **Độ khó:** ${character.difficulty.name} (${character.difficulty.description})
    **Chế độ God Mode:** ${character.godMode ? 'BẬT' : 'TẮT'}
    **Nội dung 18+ (Gore):** ${enableGore ? 'BẬT' : 'TẮT'}
    ${ragContext}
    **TRẠNG THÁI NHÂN VẬT HIỆN TẠI (ĐÃ RÚT GỌN):**
    ${JSON.stringify(prunedCharacter, null, 2)}
    ---
    **KẺ THÙ HIỆN TẠI (nếu có):**
    ${JSON.stringify(currentEnemies || [], null, 2)}
    ---
    ${!inCombat && currentNpcs && currentNpcs.length > 0 ? `**NPC HIỆN TẠI:**
${JSON.stringify(currentNpcs, null, 2)}
---` : ''}
    **THÔNG TIN LƯỢT:** ${turnInfo}
    ---
    **HÀNH ĐỘNG CỦA NGƯỜI CHƠI:**
    ${playerAction}
    ---
    **NHIỆM VỤ CỦA BẠN:**
    Dựa vào thông tin trên, hãy tạo ra cảnh tiếp theo dưới dạng một đối tượng JSON tuân thủ nghiêm ngặt schema đã cung cấp.
    `;

    try {
        const { text: resultText } = await callGeminiWithRetry({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: sceneSchema,
                systemInstruction,
            },
        });
        
        let jsonStr = resultText.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        
        const scene = JSON.parse(jsonStr);
        return scene;
    } catch (error) {
        console.error("Lỗi khi tạo cảnh:", error);
        console.error("Prompt đã gửi:", prompt);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const displayError = `Gemini API Error:
${JSON.stringify(error, null, 2)}`;

        return {
            description: `Một sự cố kỳ lạ đã xảy ra. Các thực thể dường như đang chống lại ý chí của bạn. Có lẽ bạn nên thử lại một hành động khác, hoặc khởi động lại dòng thời gian.\n\nLỗi kỹ thuật: ${errorMessage}`,
            choices: ["Thử lại hành động trước đó.", "Cố gắng chờ đợi.", "Quan sát xung quanh."],
            gameOver: false,
            enemies: [],
        };
    }
}


export async function generateBackstory(name: string, gender: string, origin: string): Promise<string> {
    const prompt = BACKSTORY_GENERATION_INSTRUCTION
        .replace('{name}', name)
        .replace('{gender}', gender)
        .replace('{origin}', origin);

    try {
        const { text: resultText } = await callGeminiWithRetry({
            model,
            contents: [{ parts: [{ text: prompt }] }],
        }, true);
        return resultText.trim();
    } catch (error) {
        console.error("Lỗi khi tạo tiểu sử:", error);
        return "Số phận của bạn chìm trong bóng tối, không thể nào đọc được.";
    }
}