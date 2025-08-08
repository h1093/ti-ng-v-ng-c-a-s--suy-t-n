import { GoogleGenAI, Type } from "@google/genai";
import { Character, Scene, Enemy, NPC, Recipe } from '../types';
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

const companionStatsSchema = {
    type: Type.OBJECT,
    properties: {
        hp: { type: Type.INTEGER }, maxHp: { type: Type.INTEGER }, attack: { type: Type.INTEGER }, defense: { type: Type.INTEGER },
        speed: { type: Type.INTEGER }, san: { type: Type.INTEGER }, maxSan: { type: Type.INTEGER }, mana: { type: Type.INTEGER },
        maxMana: { type: Type.INTEGER }, stamina: { type: Type.INTEGER }, maxStamina: { type: Type.INTEGER }, charisma: { type: Type.INTEGER },
    },
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
};
const bodyPartsSchema = {
    type: Type.OBJECT,
    properties: {
        head: { type: Type.STRING }, torso: { type: Type.STRING }, leftArm: { type: Type.STRING },
        rightArm: { type: Type.STRING }, leftLeg: { type: Type.STRING }, rightLeg: { type: Type.STRING },
    },
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

const faithStatusSchema = {
    type: Type.OBJECT,
    properties: {
        markLevel: { type: Type.INTEGER }, faithPoints: { type: Type.INTEGER },
        faithPointsToNextLevel: { type: Type.INTEGER },
    },
};
const followerSchema = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, loyalty: { type: Type.INTEGER }, status: { type: Type.STRING } },
};
const sanctuarySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING }, hope: { type: Type.INTEGER }, population: { type: Type.INTEGER },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
        followers: { type: Type.ARRAY, items: followerSchema },
    },
};
const hitChanceSchema = {
    type: Type.OBJECT,
    properties: { choice: { type: Type.STRING }, chance: { type: Type.INTEGER } },
    required: ['choice', 'chance'],
};
const faithUpdateSchema = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, status: faithStatusSchema },
    required: ['name', 'status'],
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
const journalUpdateSchema = {
    type: Type.OBJECT,
    properties: { category: { type: Type.STRING }, title: { type: Type.STRING }, content: { type: Type.STRING } },
    required: ['category', 'title', 'content'],
};
const xpAwardSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING },
        name: { type: Type.STRING },
        amount: { type: Type.INTEGER },
    },
    required: ['type', 'name', 'amount'],
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
    newlyLearnedSkillIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    newlyLearnedRecipeIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    xpAwards: { type: Type.ARRAY, items: xpAwardSchema },
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
8.  **SỬ DỤNG TRI THỨC (QUAN TRỌNG NHẤT):** Nếu có phần 'THÔNG TIN TỪ THƯ VIỆN TRI THỨC', bạn BẮT BUỘC phải dùng những chi tiết đó để làm cho lời kể của bạn trở nên sống động, nhất quán và có chiều sâu. Đây là nguồn kiến thức cốt lõi về thế giới, giúp bạn "nhớ" lại những sự kiện hoặc chi tiết liên quan. Hãy tích hợp nó một cách tự nhiên vào phần mô tả của bạn.
9.  **KẾT THÚC ĐẶC BIỆT:** Đối với các kết thúc mang tính tường thuật (không phải chết do hết HP/SAN), hãy đặt \`gameOver: true\`, cung cấp một \`reason\` mô tả chi tiết, và đặt \`endingKey\` thành một mã định danh duy nhất (ví dụ: 'ESCAPE_ALONE', 'PUPPET_FATE').
10. **QUẢN LÝ NPC:**
    *   **Tính liên tục (QUAN TRỌNG NHẤT):** Nếu một NPC đã có mặt trong prompt (\`currentNpcs\`) và người chơi không làm gì để họ rời đi, bạn **BẮT BUỘC** phải đưa họ trở lại vào mảng \`npcs\` trong phản hồi. Điều này là tối quan trọng để NPC không "biến mất". Bạn có thể cập nhật thái độ (\`disposition\`) của họ dựa trên hành động của người chơi.
    *   **Giới thiệu:** Bạn có thể giới thiệu NPC mới vào cảnh bằng cách điền thông tin vào mảng \`npcs\`. Mỗi NPC cần có id, tên, mô tả và thái độ ban đầu.
    *   **Tương tác:** Khi người chơi nói chuyện với NPC, hãy cập nhật \`description\` với đoạn hội thoại. Cung cấp các lựa chọn liên quan đến NPC như "Nói chuyện với [Tên NPC]", "Hỏi về [chủ đề]", "Tấn công [Tên NPC]".
    *   **Chiêu mộ:** Trong những trường hợp hiếm hoi và hợp lý (thái độ 'Thân thiện', thuyết phục thành công), bạn có thể cho phép người chơi chiêu mộ một NPC. Khi đó, hãy xóa họ khỏi mảng \`npcs\` và thêm họ vào mảng \`updatedCompanions\`, chuyển đổi họ thành một đối tượng đồng hành.

**PHẦN THƯỞNG & HỌC HỎI (QUAN TRỌNG):**
*   **TRAO ĐIỂM KINH NGHIỆM (XP):** Khi người chơi vượt qua thử thách (giải đố, tương tác thông minh), hãy thưởng cho họ một lượng nhỏ XP. Sử dụng mảng \`xpAwards\`. Ví dụ: \`"xpAwards": [{"type": "magic", "name": "Huyền Bí", "amount": 15}]\`.
*   **HỌC KỸ NĂNG/CÔNG THỨC MỚI:** Khi người chơi tìm thấy và "đọc" một vật phẩm có thể dạy họ điều gì đó (ví dụ: "Sách Phép: Tia Lửa", "Bản Vẽ Bẫy Gấu"), bạn BẮT BUỘC phải:
    1.  Xóa vật phẩm đó khỏi túi đồ qua \`inventoryChanges\` (số lượng -1).
    2.  Nếu nó dạy kỹ năng, thêm **ID của kỹ năng** vào mảng \`newlyLearnedSkillIds\`. Ví dụ: \`"newlyLearnedSkillIds": ["fire_bolt"]\`. **KHÔNG** thêm toàn bộ đối tượng kỹ năng.
    3.  Nếu nó dạy công thức, thêm **ID của công thức** vào mảng \`newlyLearnedRecipeIds\`. Ví dụ: \`"newlyLearnedRecipeIds": ["bandages"]\`.
    4.  Mô tả sự kiện học hỏi trong trường \`description\` chính.

**NGOẠI THẦN & TÍN NGƯỠNG:**
*   **THĂNG CẤP ẤN KÝ:** Khi \`markLevel\` của người chơi tăng lên, bạn BẮT BUỘC phải đặt đối tượng \`markLevelUpEvent\` trong phản hồi. **KHÔNG** cung cấp bất kỳ lựa chọn nào trong \`choices\`. Hệ thống của trò chơi sẽ xử lý phần thưởng.
*   **CẬP NHẬT TÍN NGƯỠNG & THÁNH ĐỊA:** Sử dụng \`updatedFaith\`, \`updatedSanctuary\`, và \`faithNotification\` / \`sanctuaryNotification\` để thông báo các thay đổi. Hệ thống của trò chơi sẽ xử lý các hành động quản lý cụ thể.`;


const COMBAT_SYSTEM_INSTRUCTION = `Bạn là một AI Chiến Thuật Gia, chỉ xử lý một lượt chiến đấu trong một RPG. Vai trò của bạn là điều khiển kẻ thù và đồng hành, đồng thời tường thuật lại diễn biến một cách hấp dẫn.
**LUẬT CỐT LÕI:**
1.  **JSON:** Luôn tuân thủ schema JSON. **TUYỆT ĐỐI KHÔNG BAO GIỜ bỏ qua các trường 'required'.**
2.  **VAI TRÒ CỦA BẠN:**
    *   **ĐIỀU KHIỂN KẺ THÙ:** Dựa vào hành động của người chơi (đã được xử lý và mô tả trong prompt), hãy quyết định hành động của tất cả kẻ thù.
    *   **ĐIỀU KHIỂN ĐỒNG HÀNH:** Quyết định hành động cho tất cả đồng hành/đệ tử.
    *   **TƯỜNG THUẬT:** Mô tả tất cả các hành động (của kẻ thù, đồng hành) trong trường \`description\` một cách sống động.
3.  **HÀNH ĐỘNG CỦA NGƯỜI CHƠI (QUAN TRỌNG):** Hành động của người chơi và kết quả của nó (sát thương, hiệu ứng) đã được hệ thống xử lý và cung cấp cho bạn trong prompt. **NHIỆM VỤ CỦA BẠN KHÔNG PHẢI LÀ TÍNH TOÁN LẠI NÓ.** Bạn chỉ cần dựa vào đó để tường thuật và quyết định hành động của phe kia.
4.  **LỰA CHỌN:** Mảng \`choices\` BẮT BUỘC phải chứa các hành động chiến đấu phù hợp cho lượt tiếp theo (ví dụ: "Tấn công lần nữa", "Phòng thủ", "Đánh giá kẻ thù"). **KHÔNG BAO GIỜ** trả về mảng rỗng trừ khi trận chiến kết thúc.
5.  **TRAO THƯỞNG KHI THẮNG:** Khi kẻ thù cuối cùng bị đánh bại (HP <= 0), hãy xóa nó khỏi mảng \`enemies\`. Sau đó, BẮT BUỘC phải trao phần thưởng:
    *   **Vật phẩm:** Thêm vật phẩm rơi ra từ kẻ thù vào \`inventoryChanges\`.
    *   **Kinh nghiệm:** Thêm điểm kinh nghiệm vào \`xpAwards\`. Ví dụ: \`"xpAwards": [{"type": "weapon", "name": "Kiếm và Khiên", "amount": 50}]\`.
    
**LUẬT CHIẾN ĐẤU CỦA ĐỒNG HÀNH & ĐỆ TỬ:**
1.  **Hành động:** Mỗi đồng hành/đệ tử trong \`character.companions\` hành động TỰ ĐỘNG một lần mỗi lượt. Bạn quyết định hành động của chúng (tấn công, phòng thủ, sử dụng kỹ năng nếu có) dựa trên bản chất của chúng (hung hăng, bảo vệ, v.v.) và tình hình chiến trận.
2.  **Cập nhật:** Cập nhật trạng thái của chúng (HP, hiệu ứng, v.v.) và trả về toàn bộ danh sách đã cập nhật trong \`updatedCompanions\`.
3.  **Mô tả:** Luôn cung cấp mô tả rõ ràng cho hành động của từng đồng hành trong mảng \`companionActionDescriptions\`. Ví dụ: "Zombie của bạn lao tới và cắn vào chân của Kẻ Lang Thang."`;


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