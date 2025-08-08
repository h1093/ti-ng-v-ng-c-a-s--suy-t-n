
import { Item } from '../types';

export const ITEM_DEFINITIONS: Record<string, Item> = {
    // Starting Gear
    'dagger_rusted': {
        id: 'dagger_rusted',
        name: 'Dao găm rỉ sét',
        description: 'Một con dao găm cũ kỹ. Vẫn còn sắc bén một cách đáng ngạc nhiên.',
        type: 'weapon',
        usable: false,
    },
    'cloth_torn': {
        id: 'cloth_torn',
        name: 'Vải rách',
        description: 'Một mảnh vải cũ, có thể dùng để băng bó hoặc làm vật liệu chế tạo.',
        type: 'material',
        usable: false,
    },
    'robe_scholar': {
        id: 'robe_scholar',
        name: 'Áo choàng học giả',
        description: 'Một chiếc áo choàng bằng vải tốt, đã sờn rách ở nhiều chỗ.',
        type: 'armor',
        usable: false,
    },
    'armor_iron_broken': {
        id: 'armor_iron_broken',
        name: 'Giáp sắt hỏng',
        description: 'Một bộ giáp sắt đã chịu nhiều hư hại, nhưng vẫn tốt hơn là không có gì.',
        type: 'armor',
        usable: false,
    },
    'longsword_cracked': {
        id: 'longsword_cracked',
        name: 'Trường kiếm nứt',
        description: 'Một thanh trường kiếm đáng tin cậy, dù đã có nhiều vết nứt trên lưỡi.',
        type: 'weapon',
        usable: false,
    },
     'hide_armor': {
        id: 'hide_armor',
        name: 'Giáp da thú',
        description: 'Một bộ giáp làm từ da của một con thú lớn, cứng rắn và bền bỉ.',
        type: 'armor',
        usable: false,
    },
    'battle_axe': {
        id: 'battle_axe',
        name: 'Rìu chiến',
        description: 'Một chiếc rìu chiến to bản, nặng trịch, có thể bổ đôi một cái đầu lâu.',
        type: 'weapon',
        usable: false,
    },
     'ritual_knife': {
        id: 'ritual_knife',
        name: 'Dao nghi lễ',
        description: 'Một con dao được trang trí công phu, có những rãnh nhỏ để dẫn máu.',
        type: 'weapon',
        usable: false,
    },
    'dark_robe': {
        id: 'dark_robe',
        name: 'Áo choàng đen',
        description: 'Một chiếc áo choàng đen đơn giản, che giấu thân phận người mặc.',
        type: 'armor',
        usable: false,
    },
    'skull_candle': {
        id: 'skull_candle',
        name: 'Nến sọ người',
        description: 'Một ngọn nến được cắm trên một chiếc sọ người nhỏ. Ánh sáng của nó thật kỳ lạ.',
        type: 'misc',
        usable: false,
    },
    'short_bow': {
        id: 'short_bow',
        name: 'Cung ngắn',
        description: 'Một cây cung ngắn, dễ sử dụng, phù hợp cho việc săn bắn hoặc chiến đấu du kích.',
        type: 'weapon',
        usable: false,
    },
    'arrows': {
        id: 'arrows',
        name: 'Mũi tên',
        description: 'Những mũi tên với đầu bịt sắt.',
        type: 'misc',
        usable: false,
    },
    'leather_cloak': {
        id: 'leather_cloak',
        name: 'Áo choàng da',
        description: 'Một chiếc áo choàng bằng da, giúp bảo vệ khỏi thời tiết và những cú đánh nhẹ.',
        type: 'armor',
        usable: false,
    },
    'tattered_robes': {
        id: 'tattered_robes',
        name: 'Áo lễ rách',
        description: 'Bộ áo lễ của một tín đồ đã mất đi đức tin.',
        type: 'armor',
        usable: false,
    },
    'warped_censer': {
        id: 'warped_censer',
        name: 'Lư hương méo mó',
        description: 'Một lư hương bằng đồng đã bị méo mó, tỏa ra một mùi hương khó chịu.',
        type: 'misc',
        usable: false,
    },

    // Materials
    'stick': {
        id: 'stick',
        name: 'Cành cây',
        description: 'Một cành cây khô, có thể dùng làm vũ khí tạm bợ hoặc vật liệu.',
        type: 'material',
        usable: false,
    },
    'herb_green': {
        id: 'herb_green',
        name: 'Thảo dược xanh',
        description: 'Một loại thảo dược có đặc tính chữa lành nhẹ.',
        type: 'material',
        usable: true,
        effects: [
            { type: 'HEAL', stat: 'hp', amount: 10 }
        ]
    },

    // Consumables (crafted or found)
    'bandages': {
        id: 'bandages',
        name: 'Bó Gạc',
        description: 'Vải sạch được cuộn chặt, dùng để băng bó vết thương và cầm máu. Hồi một lượng nhỏ Máu.',
        type: 'consumable',
        usable: true,
        effects: [
            { type: 'HEAL', stat: 'hp', amount: 15 },
        ]
    },
    'healing_salve': {
        id: 'healing_salve',
        name: 'Thuốc Mỡ Chữa Lành',
        description: 'Một loại thuốc mỡ làm từ thảo dược giúp làm dịu vết thương và phục hồi Máu.',
        type: 'consumable',
        usable: true,
        effects: [
            { type: 'HEAL', stat: 'hp', amount: 25 }
        ]
    },

    // Books (usable to learn skills)
    'book_arcane_bolt': {
        id: 'book_arcane_bolt',
        name: 'Sách Phép: Tia Năng Lượng',
        description: 'Một cuốn sách cũ dạy những nguyên lý cơ bản của phép thuật Huyền Bí.',
        type: 'book',
        usable: true,
        effects: [
            { type: 'LEARN_SKILL', skillId: 'scholar_arcane_bolt' }
        ]
    },

    // Crafted Gear
    'sharpened_stick': {
        id: 'sharpened_stick',
        name: 'Cọc Nhọn',
        description: 'Một cành cây được vót nhọn đầu. Tốt hơn là không có gì.',
        type: 'weapon',
        usable: false,
    },
    'torch': {
        id: 'torch',
        name: 'Đuốc',
        description: 'Cung cấp ánh sáng và sự ấm áp trong bóng tối. Có thể dùng để xua đuổi một số loài vật.',
        type: 'weapon',
        usable: false,
    }
};
