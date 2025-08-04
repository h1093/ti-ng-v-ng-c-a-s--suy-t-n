import type { Recipe } from '../types';

export const RECIPES: Record<string, Recipe> = {
    bandages: {
        id: 'bandages',
        name: 'Bó Gạc',
        description: 'Vải sạch được cuộn chặt, dùng để băng bó vết thương và cầm máu.',
        materials: [{ name: 'Vải rách', quantity: 2 }],
        result: { name: 'Bó Gạc', quantity: 1 }
    },
    sharpened_stick: {
        id: 'sharpened_stick',
        name: 'Cọc Nhọn',
        description: 'Một cành cây được vót nhọn đầu. Tốt hơn là không có gì.',
        materials: [{ name: 'Cành cây', quantity: 1 }],
        result: { name: 'Cọc Nhọn', quantity: 1 }
    },
    torch: {
        id: 'torch',
        name: 'Đuốc',
        description: 'Cung cấp ánh sáng và sự ấm áp trong bóng tối. Có thể dùng để xua đuổi một số loài vật.',
        materials: [{ name: 'Cành cây', quantity: 1 }, { name: 'Vải rách', quantity: 1 }],
        result: { name: 'Đuốc', quantity: 1 }
    },
    healing_salve: {
        id: 'healing_salve',
        name: 'Thuốc Mỡ Chữa Lành',
        description: 'Một loại thuốc mỡ làm từ thảo dược giúp làm dịu vết thương và phục hồi một lượng nhỏ Máu.',
        materials: [{ name: 'Thảo dược xanh', quantity: 1 }, { name: 'Vải rách', quantity: 1 }],
        result: { name: 'Thuốc Mỡ Chữa Lành', quantity: 1 }
    }
};