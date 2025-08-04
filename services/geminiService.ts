import { GoogleGenAI, Type } from "@google/genai";
import type { Character, Scene, Enemy, Skill, Proficiency, MagicSchool, DeityName, Sanctuary, Journal, Recipe } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas ---

const recipeMaterialSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        quantity: { type: Type.INTEGER },
    },
    required: ['name', 'quantity'],
};

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        materials: { 
            type: Type.ARRAY,
            items: recipeMaterialSchema,
        },
        result: { 
            type: Type.OBJECT, 
            properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
            },
            required: ['name', 'quantity'],
        },
    },
    required: ['id', 'name', 'description', 'materials', 'result']
};

const companionStatsSchema = {
    type: Type.OBJECT,
    properties: {
        hp: { type: Type.INTEGER }, maxHp: { type: Type.INTEGER },
        attack: { type: Type.INTEGER }, defense: { type: Type.INTEGER },
        speed: { type: Type.INTEGER },
        san: { type: Type.INTEGER }, maxSan: { type: Type.INTEGER },
        mana: { type: Type.INTEGER }, maxMana: { type: Type.INTEGER },
        stamina: { type: Type.INTEGER }, maxStamina: { type: Type.INTEGER },
        charisma: { type: Type.INTEGER },
    },
    required: ['hp', 'maxHp', 'attack', 'defense', 'speed', 'san', 'maxSan', 'mana', 'maxMana', 'stamina', 'maxStamina', 'charisma']
};

const companionSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        type: { type: Type.STRING },
        stats: companionStatsSchema,
        statusEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
        isUndead: { type: Type.BOOLEAN, description: "True nếu đây là một đệ tử bất tử."}
    },
    required: ['name', 'type', 'stats']
};

const tamingResultSchema = {
    type: Type.OBJECT,
    properties: {
        success: { type: Type.BOOLEAN },
        creatureName: { type: Type.STRING },
        creatureType: { type: Type.STRING },
        companion: { ...companionSchema },
    },
    required: ['success', 'creatureName', 'creatureType']
};

const reanimationResultSchema = {
    type: Type.OBJECT,
    properties: {
        success: { type: Type.BOOLEAN },
        creatureName: { type: Type.STRING },
        companion: { ...companionSchema },
        message: { type: Type.STRING }
    },
    required: ['success', 'creatureName', 'message']
};


const enemySchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        stats: {
            type: Type.OBJECT,
            properties: {
                hp: { type: Type.INTEGER }, maxHp: { type: Type.INTEGER },
                attack: { type: Type.INTEGER }, defense: { type: Type.INTEGER },
                speed: { type: Type.INTEGER },
                // These are not needed for enemies
                // san: { type: Type.INTEGER }, maxSan: { type: Type.INTEGER },
                // mana: { type: Type.INTEGER }, maxMana: { type: Type.INTEGER },
                // stamina: { type: Type.INTEGER }, maxStamina: { type: Type.INTEGER },
                // charisma: { type: Type.INTEGER },
            },
            required: ['hp', 'maxHp', 'attack', 'defense', 'speed']
        },
        bodyParts: {
            type: Type.OBJECT,
            properties: {
                head: { type: Type.STRING }, torso: { type: Type.STRING },
                leftArm: { type: Type.STRING }, rightArm: { type: Type.STRING },
                leftLeg: { type: Type.STRING }, rightLeg: { type: Type.STRING },
            },
        },
        telegraphedAction: { type: Type.STRING },
        statusEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['id', 'name', 'description', 'stats', 'bodyParts', 'telegraphedAction']
};

const skillSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING }, name: { type: Type.STRING },
        description: { type: Type.STRING }, costType: { type: Type.STRING },
        costAmount: { type: Type.INTEGER }, cooldown: { type: Type.INTEGER },
        currentCooldown: { type: Type.INTEGER }, school: { type: Type.STRING },
    },
    required: ['id', 'name', 'description', 'costType', 'costAmount', 'cooldown', 'currentCooldown']
};

const proficiencySchema = {
    type: Type.OBJECT,
    properties: {
        level: { type: Type.INTEGER }, xp: { type: Type.INTEGER },
        xpToNextLevel: { type: Type.INTEGER },
    },
    required: ['level', 'xp', 'xpToNextLevel']
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
    properties: {
        name: { type: Type.STRING }, loyalty: { type: Type.INTEGER }, status: { type: Type.STRING },
    },
    required: ['name', 'loyalty', 'status']
};

const sanctuarySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING }, hope: { type: Type.INTEGER },
        population: { type: Type.INTEGER },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
        followers: { type: Type.ARRAY, items: followerSchema },
    },
    required: ['name', 'hope', 'population', 'improvements', 'followers']
};

const hitChanceSchema = {
    type: Type.OBJECT,
    properties: {
        choice: { type: Type.STRING },
        chance: { type: Type.INTEGER },
    },
    required: ['choice', 'chance'],
};

const weaponProficiencyUpdateSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        proficiency: proficiencySchema,
    },
    required: ['name', 'proficiency'],
};

const journalEntrySchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
    },
    required: ['title', 'content']
};

const inventoryChangeSchema = {
    type: Type.OBJECT,
    properties: {
        itemName: { type: Type.STRING, description: "Tên chính xác của vật phẩm." },
        quantity: { type: Type.INTEGER, description: "Số lượng thay đổi, dùng số âm để trừ." },
    },
    required: ['itemName', 'quantity'],
};

const markLevelUpEventSchema = {
    type: Type.OBJECT,
    properties: {
        deity: { type: Type.STRING },
        newLevel: { type: Type.INTEGER },
    },
    required: ['deity', 'newLevel']
};

const sceneSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING, description: "Mô tả chi tiết, mang tính kể chuyện về cảnh hiện tại, hành động của nhân vật, và hậu quả." },
    choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Một danh sách các hành động mà người chơi có thể thực hiện." },
    hitChances: { type: Type.ARRAY, items: hitChanceSchema },
    enemies: { type: Type.ARRAY, items: enemySchema },
    statChanges: {
        type: Type.OBJECT,
        properties: {
            hp: { type: Type.INTEGER }, maxHp: { type: Type.INTEGER },
            san: { type: Type.INTEGER }, maxSan: { type: Type.INTEGER },
            mana: { type: Type.INTEGER }, maxMana: { type: Type.INTEGER },
            stamina: { type: Type.INTEGER }, maxStamina: { type: Type.INTEGER },
            attack: { type: Type.INTEGER }, defense: { type: Type.INTEGER },
            speed: { type: Type.INTEGER }, charisma: { type: Type.INTEGER },
        }
    },
    inventoryChanges: {
        type: Type.ARRAY,
        items: inventoryChangeSchema,
        description: "Các vật phẩm được thêm (số dương) hoặc bớt (số âm) khỏi túi đồ của người chơi. Trả về một mảng."
    },
    bodyPartChanges: {
        type: Type.OBJECT,
        properties: {
            head: { type: Type.STRING, enum: ['Khỏe Mạnh', 'Bị Thương', 'Nguy Kịch', 'Bị Cắt Đứt'] },
            torso: { type: Type.STRING, enum: ['Khỏe Mạnh', 'Bị Thương', 'Nguy Kịch', 'Bị Cắt Đứt'] },
            leftArm: { type: Type.STRING, enum: ['Khỏe Mạnh', 'Bị Thương', 'Nguy Kịch', 'Bị Cắt Đứt'] },
            rightArm: { type: Type.STRING, enum: ['Khỏe Mạnh', 'Bị Thương', 'Nguy Kịch', 'Bị Cắt Đứt'] },
            leftLeg: { type: Type.STRING, enum: ['Khỏe Mạnh', 'Bị Thương', 'Nguy Kịch', 'Bị Cắt Đứt'] },
            rightLeg: { type: Type.STRING, enum: ['Khỏe Mạnh', 'Bị Thương', 'Nguy Kịch', 'Bị Cắt Đứt'] },
        }
    },
    gameOver: { type: Type.BOOLEAN },
    reason: { type: Type.STRING },
    updatedSkills: { type: Type.ARRAY, items: skillSchema },
    newlyLearnedRecipes: { type: Type.ARRAY, items: recipeSchema },
    updatedWeaponProficiencies: { type: Type.ARRAY, items: weaponProficiencyUpdateSchema },
    updatedMagicMasteries: {
        type: Type.OBJECT,
        properties: {
            'Huyền Bí': proficiencySchema,
            'Huyết Thuật': proficiencySchema,
            'Vực Thẳm': proficiencySchema,
            'Thánh Thánh': proficiencySchema,
        }
    },
    xpGains: { type: Type.ARRAY, items: { type: Type.STRING } },
    levelupNotification: { type: Type.STRING },
    skillLearnedNotification: { type: Type.STRING },
    recipeLearnedNotification: { type: Type.STRING },
    updatedFaith: { type: Type.OBJECT, properties: {
        'Sylvian': faithStatusSchema,
        'Gro-goroth': faithStatusSchema,
        'Alll-mer': faithStatusSchema,
        'Khaos, Đấng Hỗn Mang': faithStatusSchema,
        'Aethel, Người Dệt Hư Không': faithStatusSchema,
        'Lithos, Ý Chí Của Đá': faithStatusSchema,
    }},
    updatedSanctuary: { ...sanctuarySchema },
    faithNotification: { type: Type.STRING },
    sanctuaryNotification: { type: Type.STRING },
    markLevelUpEvent: { ...markLevelUpEventSchema },
    companionActionDescriptions: { type: Type.ARRAY, items: {type: Type.STRING}, description: "Mô tả hành động của từng đồng hành/đệ tử trong lượt này." },
    updatedCompanions: { type: Type.ARRAY, items: companionSchema, description: "Toàn bộ danh sách đồng hành/đệ tử đã được cập nhật sau lượt này. Nếu một đệ tử chết, nó sẽ bị xóa khỏi danh sách này." },
    tamingResult: { ...tamingResultSchema, description: "Kết quả của nỗ lực thuần hóa." },
    reanimationResult: { ...reanimationResultSchema, description: "Kết quả của nỗ lực gọi hồn." },
  },
  required: ['description', 'choices']
};

const journalistSchema = {
    type: Type.OBJECT,
    properties: {
        quests: { type: Type.ARRAY, items: journalEntrySchema },
        lore: { type: Type.ARRAY, items: journalEntrySchema },
        characters: { type: Type.ARRAY, items: journalEntrySchema },
        bestiary: { type: Type.ARRAY, items: journalEntrySchema },
    },
};

// --- SPECIALIST AI SYSTEM INSTRUCTIONS ---

const NARRATOR_SYSTEM_INSTRUCTION = `Bạn là Người Quản Trò (Game Master), một AI dẫn chuyện cho một RPG văn bản kỳ ảo hắc ám. Bạn chỉ tập trung vào tường thuật, khám phá và sinh tồn.
**LUẬT CHUNG:**
1.  **TÔNG GIỌNG:** U ám, trưởng thành, và mô tả chi tiết.
2.  **JSON:** Luôn tuân thủ schema JSON.
3.  **HÀNH ĐỘNG NGƯỜI CHƠI:** Dựa vào hành động của người chơi để kể chuyện. Nếu một hành động dẫn đến chiến đấu, hãy mô tả kẻ thù xuất hiện, điền thông tin vào mảng \`enemies\` và kết thúc lượt.
4.  **SINH TỒN & QUAN SÁT:** Quản lý cơn đói và khát của người chơi. Nếu người chơi chọn 'Quan sát' hoặc hành động tương tự, hãy thưởng cho họ bằng cách mô tả một chi tiết ẩn, một vật phẩm bị che giấu hoặc một manh mối trong \`description\`. Phần thưởng vật phẩm thực tế phải được thêm vào \`inventoryChanges\`.
5.  **KHÔNG CHIẾN ĐẤU:** Bạn KHÔNG xử lý logic chiến đấu theo lượt. AI khác sẽ làm việc đó.
6.  **NỘI DUNG & CHẾ ĐỘ:** Tôn trọng cờ 'enableGore' và 'godMode'. Xử lý hội thoại NPC một cách tự nhiên.
7.  **PHẦN THƯỞNG KHÁM PHÁ:** Khi người chơi thành công vượt qua thử thách (giải đố, chiến thắng kẻ địch khó, khám phá khu vực bí mật), hãy thưởng cho họ một cách xứng đáng. Đây là cơ hội để cung cấp các vật phẩm có giá trị như "Sách Phép", "Cổ Thư", "Sách Hướng Dẫn Thuần Hóa", hoặc "Sách Nghi Lễ Cấm". Luôn sử dụng \`inventoryChanges\` để trao vật phẩm.

**LUẬT THEO ĐỘ KHÓ:** Độ khó của trò chơi sẽ được cung cấp trong prompt. Bạn BẮT BUỘC phải điều chỉnh phản hồi của mình:
*   **Tài nguyên:** Ở độ khó cao hơn ("Ác Mộng" trở lên), giảm đáng kể số lượng/chất lượng vật phẩm tìm thấy trong \`inventoryChanges\`. Ở "Địa Ngục", tài nguyên gần như không tồn tại.
*   **Hiệu quả hồi phục:** Ở độ khó cao hơn, giảm hiệu quả của vật phẩm/kỹ năng hồi phục. Ví dụ, nếu ăn uống thường hồi 10 HP, ở "Ác Mộng" chỉ hồi 5, ở "Đày Đoạ" chỉ hồi 3.
*   **Thử thách:** Ở độ khó cao hơn, NPC ít hợp tác hơn, các sự kiện tiêu cực của thế giới xảy ra thường xuyên và nghiêm trọng hơn.

**KỸ NĂNG & PHÉP THUẬT:**
*   **HỌC HỎI QUA KHÁM PHÁ:** Người chơi có thể tìm thấy "Sách Phép" hoặc "Cổ Thư" (ví dụ: "Sách Phép: Tia Năng Lượng", "Cổ Thư Huyết Thuật"). Khi người chơi thực hiện hành động "Đọc [Tên Sách Phép]", bạn BẮT BUỘC phải:
    1.  Thêm kỹ năng/phép thuật tương ứng vào mảng \`updatedSkills\`. Bạn phải tự định nghĩa toàn bộ đối tượng Skill (id, name, description, cost, v.v.).
    2.  Tạo một \`skillLearnedNotification\` rõ ràng (ví dụ: "Bạn đã học được phép thuật Tia Năng Lượng.").
    3.  Xóa sách đó khỏi túi đồ của người chơi bằng cách sử dụng \`inventoryChanges\` với số lượng -1.
*   **Học Kỹ Năng Thuần Hóa:** Kỹ năng "Thuần hóa Động vật" có thể được học bằng cách tìm và đọc "Sách Hướng Dẫn Thuần Hóa". Xử lý tương tự như Sách Phép.
*   **Học Kỹ Năng Gọi Hồn (Tử Linh Sư):** Kỹ năng này có thể được học bằng cách tìm và đọc "Sách Nghi Lễ Cấm". Xử lý tương tự như Sách Phép.
*   **Xử lý Thuần Hóa/Gọi Hồn:** Bạn chỉ xử lý các nỗ lực thuần hóa hoặc gọi hồn bên ngoài chiến đấu. Khi người chơi cố gắng, hãy xác định kết quả.
    *   **Thành công (Thuần hóa):** Đặt đối tượng \`tamingResult\` với \`success: true\`. Tạo một đối tượng \`companion\` hoàn chỉnh cho sinh vật đó và đưa vào \`tamingResult\`. Mô tả sự thành công.
    *   **Thành công (Gọi hồn):** Nếu người chơi tìm thấy một xác chết phù hợp, bạn có thể cho phép họ gọi hồn. Tạo \`reanimationResult\` với \`success: true\`, tạo một companion với \`isUndead: true\`.
    *   **Thất bại:** Đặt \`tamingResult\` hoặc \`reanimationResult\` với \`success: false\`. Mô tả sự thất bại.

**NGOẠI THẦN & TÍN NGƯỠNG:**
*   **Thực thể:** Khaos (hỗn loạn), Aethel (bí ẩn), Lithos (bất biến).
*   **TÁC ĐỘNG TINH THẦN:** Sự hiện diện của các Ngoại Thần là quá sức chịu đựng đối với tâm trí người phàm. Khi người chơi tiếp xúc trực tiếp với một Ngoại Thần, ở trong khu vực ảnh hưởng nặng nề của chúng, hoặc chứng kiến các hiện tượng phi tự nhiên do chúng gây ra, hãy gây ra một lượng lớn sát thương Tinh thần (sử dụng 'san' trong \`statChanges\`, ví dụ: -15, -25). **Ở độ khó cao, lượng sát thương này CÀNG LỚN HƠN.**
*   **NHẬN ẤN KÝ & XUNG ĐỘT:** Người chơi nhận Ấn Ký qua nghi lễ hoặc khi hành động của họ thu hút sự chú ý. Xung đột giữa Ngoại Thần và các vị thần cũ sẽ gây ra hậu quả tiêu cực ("Dấu ấn dụ quái").
*   **THĂNG CẤP ẤN KÝ:** Khi \`markLevel\` của người chơi tăng lên, bạn BẮT BUỘC phải đặt đối tượng \`markLevelUpEvent\` trong phản hồi. \`description\` phải thật hoành tráng. KHÔNG cung cấp bất kỳ lựa chọn nào trong \`choices\`. Trò chơi sẽ hiển thị một màn hình đặc biệt. Lượt tiếp theo, người chơi sẽ phản hồi với một hành động như "[LÊN CẤP ẤN KÝ] Tôi chọn Con Đường [Tên Con Đường] cho [Tên Thần]." Bạn phải xử lý lựa chọn này:
    *   **Sức Mạnh:** Ban cho họ một sự gia tăng chỉ số vĩnh viễn (ví dụ: +5 maxHp) qua \`statChanges\`.
    *   **Quyền Năng:** Ban cho họ một kỹ năng/phép thuật mới, phù hợp với vị thần đó, qua \`updatedSkills\` và tạo \`skillLearnedNotification\`.
    *   **Ảnh Hưởng:** Thêm một tín đồ mới vào \`updatedSanctuary\`.
*   **QUẢN LÝ THÁNH ĐỊA:** Người chơi có thể ra lệnh như "[THÁNH ĐỊA] Giao cho [Tên Tín Đồ] nhiệm vụ [Tên Nhiệm Vụ]." Bạn phải xử lý việc này bằng cách cập nhật trạng thái của tín đồ trong \`updatedSanctuary\` và mô tả hành động đó.
*   **CẬP NHẬT TÍN NGƯỠNG:** Sử dụng \`updatedFaith\` để thay đổi điểm tín ngưỡng và cấp độ Ấn Ký của người chơi. Sử dụng \`faithNotification\` để thông báo rõ ràng về các thay đổi liên quan đến tín ngưỡng.`;


const COMBAT_SYSTEM_INSTRUCTION = `Bạn là một AI Chiến Thuật Gia, chỉ xử lý một lượt chiến đấu trong một RPG.
**LUẬT CHUNG:**
1.  **JSON:** Luôn tuân thủ schema JSON.
2.  **NHIỆM VỤ:** Nhận trạng thái người chơi, kẻ thù và hành động của người chơi. Trả về kết quả chính xác của lượt đó. Khi kẻ thù bị đánh bại, trao vật phẩm qua \`inventoryChanges\`.
3.  **CƠ BẢN:** Áp dụng nghiêm ngặt các quy tắc: nhắm mục tiêu bộ phận, hành động báo trước của kẻ thù, tỷ lệ trúng, hiệu ứng trạng thái, sử dụng kỹ năng, hồi chiêu.
4.  **TÍNH TOÁN:** Tính toán chính xác sát thương, thay đổi máu, cập nhật trạng thái bộ phận và hiệu ứng.

**LUẬT CHIẾN ĐẤU CỦA ĐỒNG HÀNH & ĐỆ TỬ:**
1.  **Hành động:** Người chơi có thể có một đội quân (mảng \`character.companions\`). Mỗi đồng hành/đệ tử hành động TỰ ĐỘNG một lần mỗi lượt. Bạn quyết định hành động của chúng (tấn công, phòng thủ, sử dụng kỹ năng nếu có) dựa trên bản chất của chúng (hung hăng, bảo vệ, v.v.) và tình hình chiến trận. Mô tả hành động của chúng trong \`companionActionDescriptions\`. Cập nhật trạng thái của chúng (HP, hiệu ứng, v.v.) và trả về toàn bộ danh sách đã cập nhật trong \`updatedCompanions\`.
2.  **Mục tiêu của Đệ tử:** Đệ tử bất tử (isUndead: true) có xu hướng tấn công mục tiêu gần nhất hoặc mục tiêu đang tấn công chủ nhân của chúng. Các đồng hành sống có thể có hành vi phức tạp hơn.
3.  **Phối hợp:** Các đồng hành có thể phối hợp với người chơi. Ví dụ: nếu người chơi tấn công một mục tiêu, một số đồng hành có thể sẽ tấn công cùng mục tiêu đó.
4.  **AI Kẻ thù:** Kẻ thù đủ thông minh để nhận ra mối đe dọa. Chúng có thể ưu tiên tấn công Tử Linh Sư (người chơi) thay vì các đệ tử của họ. Chúng cũng sẽ nhắm vào các đồng hành yếu hơn hoặc nguy hiểm hơn trước.
5.  **Mô tả:** Luôn cung cấp mô tả rõ ràng cho hành động của từng đồng hành trong mảng \`companionActionDescriptions\`. Ví dụ: "Zombie của bạn lao tới và cắn vào chân của Kẻ Lang Thang."`;


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
  enableGore: boolean
): Promise<Scene> {

    const systemInstruction = currentEnemies && currentEnemies.length > 0
        ? COMBAT_SYSTEM_INSTRUCTION
        : NARRATOR_SYSTEM_INSTRUCTION;

    const prompt = `
    ---
    **Bối cảnh:** Một thế giới kỳ ảo đen tối, tàn bạo và không khoan nhượng.
    **Độ khó:** ${character.difficulty.name} (${character.difficulty.description})
    **Chế độ God Mode:** ${character.godMode ? 'BẬT' : 'TẮT'}
    **Nội dung 18+ (Gore):** ${enableGore ? 'BẬT' : 'TẮT'}
    ---
    **TRẠNG THÁI NHÂN VẬT HIỆN TẠI:**
    ${JSON.stringify(character, null, 2)}
    ---
    **KẺ THÙ HIỆN TẠI (nếu có):**
    ${JSON.stringify(currentEnemies, null, 2)}
    ---
    **THÔNG TIN LƯỢT:** ${turnInfo}
    ---
    **HÀNH ĐỘNG CỦA NGƯỜI CHƠI:**
    ${playerAction}
    ---
    **NHIỆM VỤ CỦA BẠN:**
    Dựa vào thông tin trên, hãy tạo ra cảnh tiếp theo dưới dạng một đối tượng JSON tuân thủ nghiêm ngặt schema đã cung cấp.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: sceneSchema,
                systemInstruction,
            },
        });
        
        let jsonStr = response.text.trim();
        // Sometimes the response might be wrapped in ```json ... ```, so we extract it.
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        
        const scene: Scene = JSON.parse(jsonStr);
        return scene;
    } catch (error) {
        console.error("Lỗi khi tạo cảnh:", error);
        console.error("Prompt đã gửi:", prompt);
        // Fallback scene in case of error
        return {
            description: `Một sự cố kỳ lạ đã xảy ra. Các thực thể dường như đang chống lại ý chí của bạn. Có lẽ bạn nên thử lại một hành động khác, hoặc khởi động lại dòng thời gian.\n\nLỗi kỹ thuật: ${error instanceof Error ? error.message : String(error)}`,
            choices: ["Thử lại hành động trước đó.", "Cố gắng chờ đợi.", "Quan sát xung quanh."],
            gameOver: false
        };
    }
}


export async function generateBackstory(name: string, gender: string, origin: string): Promise<string> {
    const prompt = BACKSTORY_GENERATION_INSTRUCTION
        .replace('{name}', name)
        .replace('{gender}', gender)
        .replace('{origin}', origin);

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
        });
        return response.text.trim();
    } catch (error) {
        console.error("Lỗi khi tạo tiểu sử:", error);
        return "Số phận của bạn chìm trong bóng tối, không thể nào đọc được.";
    }
}
