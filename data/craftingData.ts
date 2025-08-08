
import { Recipe } from '../types';

export const RECIPES: Record<string, Recipe> = {
    bandages: {
        id: 'bandages',
        name: 'Bó Gạc',
        description: 'Vải sạch được cuộn chặt, dùng để băng bó vết thương và cầm máu.',
        materials: [{ itemId: 'cloth_torn', quantity: 2 }],
        result: { itemId: 'bandages', quantity: 1 }
    },
    sharpened_stick: {
        id: 'sharpened_stick',
        name: 'Cọc Nhọn',
        description: 'Một cành cây được vót nhọn đầu. Tốt hơn là không có gì.',
        materials: [{ itemId: 'stick', quantity: 1 }],
        result: { itemId: 'sharpened_stick', quantity: 1 }
    },
    torch: {
        id: 'torch',
        name: 'Đuốc',
        description: 'Cung cấp ánh sáng và sự ấm áp trong bóng tối. Có thể dùng để xua đuổi một số loài vật.',
        materials: [{ itemId: 'stick', quantity: 1 }, { itemId: 'cloth_torn', quantity: 1 }],
        result: { itemId: 'torch', quantity: 1 }
    },
    healing_salve: {
        id: 'healing_salve',
        name: 'Thuốc Mỡ Chữa Lành',
        description: 'Một loại thuốc mỡ làm từ thảo dược giúp làm dịu vết thương và phục hồi một lượng nhỏ Máu.',
        materials: [{ itemId: 'herb_green', quantity: 1 }, { itemId: 'cloth_torn', quantity: 1 }],
        result: { itemId: 'healing_salve', quantity: 1 }
    }
};
