import type { Difficulty, Origin, Personality } from '../types';

export const DIFFICULTIES: Difficulty[] = [
  { name: "Thử Thách", description: "Một trải nghiệm cân bằng, dành cho những ai muốn khám phá thế giới mà không bị trừng phạt quá khắc nghiệt.", pointBuy: 10, permadeath: false },
  { name: "Ác Mộng", description: "Tài nguyên khan hiếm, kẻ thù ưu tiên tấn công điểm yếu, và phần thưởng ít hơn. Cái chết sẽ xóa sổ tiến trình của bạn.", pointBuy: 5, permadeath: true },
  { name: "Đày Đoạ", description: "Dành cho những tâm hồn dày dạn kinh nghiệm. Kẻ thù tàn nhẫn, phối hợp tấn công. Thế giới không dung thứ cho sai lầm. XP nhận được rất ít.", pointBuy: 2, permadeath: true },
  { name: "Địa Ngục", description: "Bạn không nên ở đây. Kẻ thù hành động hoàn hảo, tài nguyên gần như không tồn tại, và không có phần thưởng nào. Đây là sự trừng phạt.", pointBuy: 0, permadeath: true },
];

export const ALL_WEAPON_PROFICIENCIES: string[] = [
    "Kiếm và Khiên",
    "Vũ khí hạng nặng",
    "Vũ khí nhẹ (Dao găm, v.v.)",
    "Vũ khí tầm xa (Cung, Nỏ)",
    "Vũ khí cán dài (Giáo, v.v.)",
    "Roi và Xích",
    "Sách phép & Quyền trượng",
    "Vũ khí nghi lễ",
    "Vũ khí tạm chế",
    "Tay không",
];

export const ORIGINS: Origin[] = [
  {
    name: "Kẻ Sống Sót Vô Danh",
    description: "Bạn chẳng là ai cả, đến từ hư không. Điều duy nhất bạn biết là làm thế nào để sống sót qua một ngày nữa.",
    baseStats: { hp: 110, san: 90, defense: 5, stamina: 110 },
    startingEquipment: { "Dao găm rỉ sét": 1, "Vải rách": 3 },
    weaponProficiency: "Vũ khí nhẹ (Dao găm, v.v.)",
    startingRecipes: ["bandages", "sharpened_stick"],
    talents: [
      { name: "Ăn tạp", description: "Có thể ăn những thứ mà người khác không dám, hồi một lượng nhỏ Máu." },
      { name: "Lẩn trốn", description: "Bắt đầu chiến đấu với một lượt tàng hình." },
      { name: "Bền bỉ", description: "Nhận ít hơn 10% sát thương vật lý." }
    ],
    startingSkills: [
        { id: "survivor_pocket_sand", name: "Ném Cát", description: "Ném cát vào mắt kẻ thù, có cơ hội làm giảm độ chính xác của chúng trong lượt tiếp theo.", costType: "stamina", costAmount: 10, cooldown: 2 }
    ]
  },
  {
    name: "Học Giả Bị Ruồng Bỏ",
    description: "Bạn đã thấy những bí mật bị cấm đoán trong các văn tự cổ, và bị trục xuất vì kiến thức của mình.",
    baseStats: { san: 120, mana: 110, attack: 5, charisma: 10 },
    startingEquipment: { "Áo choàng học giả": 1, "Sách phép thuật cơ bản": 1 },
    weaponProficiency: "Sách phép & Quyền trượng",
    talents: [
      { name: "Ma thuật máu", description: "Có thể hy sinh Máu để đổi lấy Mana." },
      { name: "Kiến thức bị cấm", description: "Bắt đầu với một phép thuật tấn công tâm trí mạnh mẽ." },
      { name: "Phân tích điểm yếu", description: "Đòn tấn công đầu tiên lên kẻ địch luôn là đòn chí mạng." }
    ],
    startingSkills: [
        { id: "scholar_arcane_bolt", name: "Tia Năng Lượng", description: "Bắn một tia năng lượng huyền bí gây sát thương vừa phải.", costType: "mana", costAmount: 15, cooldown: 0, school: "Huyền Bí" }
    ]
  },
  {
    name: "Hiệp Sĩ Sa Ngã",
    description: "Lời thề của bạn đã bị phá vỡ, danh dự của bạn đã bị vấy bẩn. Giờ đây bạn lang thang tìm kiếm sự cứu chuộc hoặc một cái chết xứng đáng.",
    baseStats: { hp: 120, attack: 10, defense: 10, charisma: 5 },
    startingEquipment: { "Giáp sắt hỏng": 1, "Trường kiếm nứt": 1 },
    weaponProficiency: "Kiếm và Khiên",
    talents: [
      { name: "Đứng vững", description: "Không thể bị hạ gục trong lượt đầu tiên của trận chiến." },
      { name: "Phản đòn", description: "Sau khi đỡ đòn thành công, đòn tấn công tiếp theo gây thêm 50% sát thương." },
      { name: "Ý chí sắt đá", description: "Khi Máu dưới 25%, Tấn công và Phòng thủ tăng vọt." }
    ],
    startingSkills: [
        { id: "knight_defensive_stance", name: "Thế Thủ", description: "Tăng mạnh Phòng thủ trong 1 lượt, nhưng giảm Tấn công.", costType: "stamina", costAmount: 20, cooldown: 3 }
    ]
  },
  {
    name: "Lính Đánh Thuê Man Rợ",
    description: "Sinh ra trong chiến tranh, lớn lên bằng máu. Cuộc sống của bạn là một chuỗi các trận chiến, và bạn xuất sắc trong lĩnh vực đó.",
    baseStats: { hp: 130, attack: 12, speed: 5, stamina: 120 },
    startingEquipment: { "Giáp da thú": 1, "Rìu chiến": 1 },
    weaponProficiency: "Vũ khí hạng nặng",
    talents: [
      { name: "Cơn thịnh nộ", description: "Gây nhiều sát thương hơn khi Máu của bạn càng thấp." },
      { name: "Tàn sát", description: "Hạ gục kẻ thù hồi lại một lượng nhỏ Máu." },
      { name: "Không nao núng", description: "Miễn nhiễm với các hiệu ứng gây sợ hãi hoặc làm giảm Tinh thần." }
    ],
    startingSkills: [
        { id: "barbarian_savage_strike", name: "Chém Man Rợ", description: "Một đòn tấn công mạnh mẽ gây sát thương lớn nhưng làm giảm Phòng thủ của bạn trong lượt này.", costType: "stamina", costAmount: 25, cooldown: 2 }
    ]
  },
   {
    name: "Nghi Lễ Viên Hắc Ám",
    description: "Bạn đã nghiên cứu những nghệ thuật bị cấm đoán, giao dịch với những thực thể mà người thường không dám gọi tên. Quyền năng hắc ám chảy trong huyết quản bạn.",
    baseStats: { san: 110, mana: 130, hp: 90, defense: 3 },
    startingEquipment: { "Dao nghi lễ": 1, "Áo choàng đen": 1, "Nến sọ người": 1 },
    weaponProficiency: "Vũ khí nghi lễ",
    talents: [
      { name: "Thu Hoạch Tinh Chất", description: "Hồi lại một lượng nhỏ Mana mỗi khi có một sinh vật chết gần đó (kẻ thù hoặc đồng minh)." },
      { name: "Thân Xác Quen Thuộc", description: "Giảm 25% sát thương nhận vào từ các sinh vật bất tử." },
      { name: "Bóng Tối Bao Trùm", description: "Các phép thuật thuộc trường phái Vực Thẳm tiêu tốn ít hơn 15% Mana." }
    ],
    startingSkills: [
        { id: "dark_ritualist_drain_life", name: "Hút Sinh Lực", description: "Hút một lượng nhỏ máu từ mục tiêu để hồi phục cho bản thân. Gây sát thương Vực Thẳm.", costType: "mana", costAmount: 18, cooldown: 2, school: "Vực Thẳm" }
    ]
  },
  {
    name: "Cung Thủ Tinh Quái",
    description: "Bạn là một thợ săn nhanh nhẹn, sống sót bằng cách giữ khoảng cách và tung ra những phát bắn chết người. Bóng tối là đồng minh của bạn.",
    baseStats: { speed: 10, stamina: 110, attack: 7, defense: 3 },
    startingEquipment: { "Cung ngắn": 1, "Mũi tên": 15, "Áo choàng da": 1 },
    weaponProficiency: "Vũ khí tầm xa (Cung, Nỏ)",
    talents: [
      { name: "Mắt diều hâu", description: "Tăng 20% độ chính xác với vũ khí tầm xa." },
      { name: "Du kích", description: "Đòn tấn công đầu tiên từ trạng thái ẩn nấp (chưa bị phát hiện) gây thêm 100% sát thương." },
      { name: "Nhanh nhẹn", description: "Có cơ hội né hoàn toàn một đòn tấn công vật lý." }
    ],
    startingSkills: [
        { id: "archer_crippling_shot", name: "Bắn Tê Liệt", description: "Bắn vào chân kẻ thù, có cơ hội làm giảm Tốc độ của chúng.", costType: "stamina", costAmount: 20, cooldown: 3 }
    ]
  },
  {
    name: "Tín Đồ Lạc Lối",
    description: "Vị thần của bạn đã chết hoặc đã bỏ rơi bạn. Giờ đây bạn bám víu vào những nghi lễ méo mó với hy vọng hão huyền.",
    baseStats: { san: 110, mana: 120, speed: 5, charisma: -5 },
    startingEquipment: { "Áo lễ rách": 1, "Lư hương méo mó": 1 },
    weaponProficiency: "Vũ khí nghi lễ",
    talents: [
      { name: "Hy sinh", description: "Có thể hy sinh một phần Tinh thần tối đa để tăng cường sức mạnh cho phép thuật tiếp theo." },
      { name: "Thì thầm từ hư không", description: "Đôi khi nghe được những lời khuyên hữu ích (hoặc gây hại) từ một thực thể vô hình." },
      { name: "Giao ước cuối cùng", description: "Khi chết, phát nổ gây sát thương tâm linh lớn lên mọi thứ xung quanh." }
    ],
    startingSkills: [
        { id: "cultist_blood_offering", name: "Hiến Tế Máu", description: "Hy sinh Máu để đổi lấy một lượng lớn Mana.", costType: "hp", costAmount: 20, cooldown: 1, school: "Huyết Thuật" }
    ]
  }
];

export const PERSONALITIES: Personality[] = [
  { name: "Hận thù", description: "Tăng 15% Tấn công khi Máu dưới 30%.", effect: "Tăng tấn công khi máu thấp." },
  { name: "Vô cảm", description: "Giảm 50% tất cả sát thương Tinh thần phải nhận.", effect: "Giảm sát thương Tinh thần." },
  { name: "Hoang tưởng", description: "Tăng 20% Phòng thủ khi Tinh thần dưới 40%.", effect: "Tăng phòng thủ khi Tinh thần thấp." },
  { name: "Tàn nhẫn", description: "Các lựa chọn đe dọa hoặc bạo lực có khả năng thành công cao hơn. Giảm Uy tín ban đầu.", effect: "Lựa chọn tàn bạo hiệu quả hơn, nhưng ảnh hưởng xấu đến danh tiếng." },
  { name: "Lạc quan một cách vô lý", description: "Phục hồi một lượng nhỏ Tinh thần sau mỗi vài lượt.", effect: "Hồi Tinh thần theo thời gian." },
  { name: "Tham lam", description: "Tìm thấy nhiều chiến lợi phẩm hơn, nhưng thường dẫn đến những lựa chọn nguy hiểm.", effect: "Tăng chiến lợi phẩm." },
  { name: "Nhát gan", description: "Tăng Tốc độ khi cố gắng chạy trốn khỏi trận chiến.", effect: "Chạy trốn dễ dàng hơn." },
  { name: "Tò mò", description: "Luôn có thêm một lựa chọn khám phá trong mỗi cảnh, nhưng nó thường dẫn đến nguy hiểm.", effect: "Thêm lựa chọn khám phá." },
  { name: "Thực dụng", description: "Khả năng chế tạo và sửa chữa vật phẩm được cải thiện.", effect: "Cải thiện chế tạo." },
];