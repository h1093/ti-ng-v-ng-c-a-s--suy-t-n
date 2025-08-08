import { Ending } from '../types';

export const ENDINGS: Record<string, Ending> = {
    DEATH_HP: {
        title: "SỰ SỤP ĐỔ CỦA THỂ XÁC",
        defaultReason: "Cơ thể bạn không thể chịu đựng thêm nữa. Xương gãy, máu tuôn, bạn gục ngã xuống nền đá lạnh lẽo, trở thành một bữa ăn cho những sinh vật đang rình rập trong bóng tối. Không ai nhớ đến tên bạn."
    },
    DEATH_SANITY: {
        title: "SỰ VỠ VỤN CỦA TÂM TRÍ",
        defaultReason: "Thực tại vỡ vụn trước mắt bạn. Những hình ảnh méo mó, những tiếng thì thầm không dứt. Bạn cười một cách điên dại, trở thành một tiếng vọng nữa trong sự suy tàn vĩnh cửu."
    },
    PUPPET_FATE: {
        title: "SỐ PHẬN CỦA CON RỐI",
        defaultReason: "Bạn cảm thấy một sự lạnh lẽo xâm chiếm cơ thể, một ý chí ngoại lai xé toạc tâm trí bạn. Đôi mắt bạn vẫn mở, nhưng không còn là bạn đang nhìn. Cơ thể bạn di chuyển theo ý muốn của một kẻ khác, một con rối bằng xương bằng thịt, bị mắc kẹt trong chính nhà tù thể xác của mình để chứng kiến những hành động ghê tởm sẽ được thực hiện."
    },
    ESCAPE_ALONE: {
        title: "LỐI THOÁT ĐƠN ĐỘC",
        defaultReason: "Ánh sáng nhợt nhạt của thế giới bên ngoài chiếu vào đôi mắt mệt mỏi của bạn. Bạn đã thoát ra, nhưng những ký ức kinh hoàng sẽ mãi mãi ám ảnh. Bạn đã sống sót, nhưng một phần con người bạn đã chết lại ở trong phế tích."
    },
    TRANSFORMATION_ASCENSION: {
        title: "THĂNG HOA",
        defaultReason: "Thể xác phàm trần của bạn tan biến. Bạn không còn là con người, mà là một avatar, một ý chí của một thế lực cổ xưa. Bạn đã vượt qua nỗi đau, nhưng cũng đã mất đi nhân tính."
    },
    GENERIC_END: {
        title: "KẾT THÚC",
        defaultReason: "Hành trình của bạn đã kết thúc."
    }
};