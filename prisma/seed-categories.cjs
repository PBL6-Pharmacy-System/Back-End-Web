// Seed script để cập nhật bảng categories
// Chạy: node prisma/seed-categories.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Dữ liệu categories từ file categories.js
const MENU_DATA = {
  'thuc-pham-chuc-nang': {
    title: 'Thực phẩm chức năng',
    key: 'thuc-pham-chuc-nang',
    id: 128,
    categories: [
      {
        icon: '💊',
        title: 'Vitamin & Khoáng chất',
        key: 'vitamin-khoang-chat',
        id: 132,
        subcategories: [
          { icon: '💊', title: 'Vitamin tổng hợp', key: 'vitamin-tong-hop', id: 14 },
          { icon: '🦴', title: 'Bổ sung Canxi & Vitamin D', key: 'canxi-vitamin-d', id: 15 },
          { icon: '💊', title: 'Vitamin & Khoáng chất', key: 'vitamin-khoang-chat-sub', id: 16 },
          { icon: '🩸', title: 'Bổ sung Sắt & Axit Folic', key: 'sat-axit-folic', id: 17 },
          { icon: '🐟', title: 'Dầu cá, Omega 3, DHA', key: 'omega-3-dha', id: 35 },
          { icon: '🍊', title: 'Vitamin C các loại', key: 'vitamin-c', id: 36 }
        ]
      },
      {
        icon: '🧬',
        title: 'Sinh lý - Nội tiết tố',
        key: 'sinh-ly-noi-tiet',
        id: 133,
        subcategories: [
          { icon: '🌸', title: 'Hỗ trợ mãn kinh', key: 'ho-tro-man-kinh', id: 40 },
          { icon: '💑', title: 'Sức khoẻ tình dục', key: 'suc-khoe-tinh-duc', id: 44 },
          { icon: '⚖️', title: 'Cân bằng nội tiết tố', key: 'can-bang-noi-tiet-to', id: 87 },
          { icon: '👩', title: 'Sinh lý nữ', key: 'sinh-ly-nu', id: 102 },
          { icon: '👨', title: 'Sinh lý nam', key: 'sinh-ly-nam', id: 124 }
        ]
      },
      {
        icon: '💪',
        title: 'Cải thiện tăng cường chức năng',
        key: 'tang-cuong-chuc-nang',
        id: 134,
        subcategories: [
          { icon: '🫁', title: 'Hô hấp, ho, xoang', key: 'ho-hap-ho-xoang', id: 19 },
          { icon: '👁️', title: 'Bổ mắt, bảo vệ mắt', key: 'bo-mat-bao-ve-mat', id: 32 },
          { icon: '🔄', title: 'Hỗ trợ trao đổi chất', key: 'ho-tro-trao-doi-chat', id: 48 },
          { icon: '🍺', title: 'Giải rượu, cai rượu', key: 'giai-ruou-cai-ruou', id: 56 },
          { icon: '🛡️', title: 'Tăng sức đề kháng, miễn dịch', key: 'tang-suc-de-khang-mien-dich', id: 64 },
          { icon: '💊', title: 'Thuốc kháng virus', key: 'thuoc-khang-virus', id: 80 },
          { icon: '🫀', title: 'Chức năng gan', key: 'chuc-nang-gan', id: 101 },
          { icon: '✨', title: 'Chống lão hóa', key: 'chong-lao-hoa', id: 115 },
          { icon: '🏥', title: 'Thuốc trị bệnh gan', key: 'thuoc-tri-benh-gan', id: 120 }
        ]
      },
      {
        icon: '🏥',
        title: 'Hỗ trợ điều trị',
        key: 'ho-tro-dieu-tri',
        id: 135,
        subcategories: [
          { icon: '🦴', title: 'Cơ xương khớp', key: 'co-xuong-khop', id: 18 },
          { icon: '💢', title: 'Hỗ trợ điều trị trĩ', key: 'ho-tro-dieu-tri-tri', id: 20 },
          { icon: '🫘', title: 'Thận, tiền liệt tuyến', key: 'than-tien-liet-tuyen', id: 21 },
          { icon: '🩹', title: 'Hỗ trợ điều trị', key: 'ho-tro-dieu-tri-sub', id: 22 },
          { icon: '⚠️', title: 'Hỗ trợ điều trị gout', key: 'ho-tro-dieu-tri-gout', id: 59 },
          { icon: '🦠', title: 'Thuốc trị giun sán', key: 'thuoc-tri-giun-san', id: 81 },
          { icon: '💊', title: 'Thuốc kháng sinh, kháng nấm', key: 'thuoc-khang-sinh-khang-nam', id: 82 },
          { icon: '🍄', title: 'Thuốc kháng nấm', key: 'thuoc-khang-nam', id: 83 }
        ]
      },
      {
        icon: '🫃',
        title: 'Hỗ trợ tiêu hóa',
        key: 'ho-tro-tieu-hoa',
        id: 136,
        subcategories: [
          { icon: '🫁', title: 'Đại tràng', key: 'dai-trang', id: 46 },
          { icon: '🌿', title: 'Khó tiêu', key: 'kho-tieu', id: 90 },
          { icon: '💊', title: 'Táo bón', key: 'tao-bon', id: 96 },
          { icon: '🦠', title: 'Vi sinh - Probiotic', key: 'vi-sinh-probiotic', id: 108 },
          { icon: '💊', title: 'Thuốc dạ dày', key: 'thuoc-da-day', id: 118 },
          { icon: '🏥', title: 'Thuốc tiêu hoá', key: 'thuoc-tieu-hoa', id: 119 },
          { icon: '💊', title: 'Thuốc trị tiêu chảy', key: 'thuoc-tri-tieu-chay', id: 121 },
          { icon: '💊', title: 'Thuốc trị táo bón', key: 'thuoc-tri-tao-bon', id: 122 },
          { icon: '🫄', title: 'Dạ dày, tá tràng', key: 'da-day-ta-trang', id: 123 }
        ]
      },
      {
        icon: '🧠',
        title: 'Thần kinh não',
        key: 'than-kinh-nao',
        id: 137,
        subcategories: [
          { icon: '🧠', title: 'Bổ não - cải thiện trí nhớ', key: 'bo-nao-cai-thien-tri-nho', id: 23 },
          { icon: '💆', title: 'Hoạt huyết', key: 'hoat-huyet', id: 26 },
          { icon: '😴', title: 'Hỗ trợ giấc ngủ ngon', key: 'ho-tro-giac-ngu-ngon', id: 42 },
          { icon: '🧠', title: 'Thuốc tăng cường tuần hoàn não', key: 'thuoc-tang-cuong-tuan-hoan-nao', id: 57 },
          { icon: '🧘', title: 'Kiểm soát căng thẳng', key: 'kiem-soat-cang-thang', id: 99 },
          { icon: '💊', title: 'Thuốc thần kinh', key: 'thuoc-than-kinh', id: 110 },
          { icon: '🔄', title: 'Tuần hoàn máu', key: 'tuan-hoan-mau', id: 125 }
        ]
      },
      {
        icon: '✨',
        title: 'Hỗ trợ làm đẹp',
        key: 'ho-tro-lam-dep',
        id: 138,
        subcategories: [
          { icon: '💇', title: 'Tóc', key: 'toc', id: 53 },
          { icon: '🌟', title: 'Da', key: 'da', id: 103 }
        ]
      },
      {
        icon: '❤️',
        title: 'Sức khỏe tim mạch',
        key: 'suc-khoe-tim-mach',
        id: 139,
        subcategories: [
          { icon: '💊', title: 'Thuốc trị trĩ, suy giãn tĩnh mạch', key: 'thuoc-tri-tri-suy-gian-tinh-mach', id: 58 },
          { icon: '📉', title: 'Giảm Cholesterol', key: 'giam-cholesterol', id: 85 },
          { icon: '🩸', title: 'Suy giãn tĩnh mạch', key: 'suy-gian-tinh-mach', id: 98 },
          { icon: '🧦', title: 'Vớ ngăn tĩnh mạch', key: 'vo-ngan-tinh-mach', id: 104 },
          { icon: '💗', title: 'Huyết áp', key: 'huyet-ap', id: 109 },
          { icon: '📊', title: 'Máy đo huyết áp', key: 'may-do-huyet-ap', id: 111 }
        ]
      },
      {
        icon: '🍼',
        title: 'Dinh dưỡng',
        key: 'dinh-duong',
        id: 140,
        subcategories: [
          { icon: '🥛', title: 'Sữa', key: 'sua', id: 73 }
        ]
      }
    ]
  },
  'duoc-my-pham': {
    title: 'Dược mỹ phẩm',
    key: 'duoc-my-pham',
    id: 129,
    categories: [
      { 
        icon: '✨', 
        title: 'Chăm sóc da mặt', 
        key: 'cham-soc-da-mat',
        id: 141,
        subcategories: [
          { icon: '🧼', title: 'Sữa rửa mặt (Kem, gel, sữa)', key: 'sua-rua-mat', id: 5 },
          { icon: '🧽', title: 'Nước tẩy trang, dầu tẩy trang', key: 'nuoc-tay-trang-dau-tay-trang', id: 6 },
          { icon: '🎭', title: 'Mặt nạ', key: 'mat-na', id: 7 },
          { icon: '💆', title: 'Dưỡng da mặt', key: 'duong-da-mat', id: 8 },
          { icon: '✨', title: 'Chăm sóc da mặt', key: 'cham-soc-da-mat-sub', id: 9 },
          { icon: '💧', title: 'Serum, Essence hoặc Ampoule', key: 'serum-essence', id: 52 },
          { icon: '💄', title: 'Trang điểm mặt', key: 'trang-diem-mat', id: 66 },
          { icon: '☀️', title: 'Kem chống nắng da mặt', key: 'kem-chong-nang', id: 71 },
          { icon: '💋', title: 'Son môi', key: 'son-moi', id: 106 }
        ]
      },
      { 
        icon: '🧴', 
        title: 'Chăm sóc cơ thể', 
        key: 'cham-soc-co-the',
        id: 142,
        subcategories: [
          { icon: '🩹', title: 'Chăm sóc da nứt nẻ', key: 'cham-soc-da-nut-ne', id: 47 },
          { icon: '☀️', title: 'Chống nắng toàn thân', key: 'chong-nang-toan-than', id: 70 },
          { icon: '💧', title: 'Sữa dưỡng thể, kem dưỡng thể', key: 'sua-duong-the-kem-duong-the', id: 91 },
          { icon: '🚿', title: 'Sữa tắm, xà bông', key: 'sua-tam-xa-bong', id: 92 },
          { icon: '🌺', title: 'Lăn khử mùi, xịt khử mùi', key: 'lan-khu-mui-xit-khu-mui', id: 113 },
          { icon: '🤲', title: 'Kem dưỡng da tay, chân', key: 'kem-duong-da-tay-chan', id: 114 }
        ]
      },
      { 
        icon: '🎯', 
        title: 'Giải pháp làn da', 
        key: 'giai-phap-lan-da',
        id: 143,
        subcategories: [
          { icon: '🔴', title: 'Kem hỗ trợ giảm mụn, gel hỗ trợ giảm mụn', key: 'kem-ho-tro-giam-mun-gel-ho-tro-giam-mun', id: 2 },
          { icon: '🔍', title: 'Hỗ trợ mờ sẹo, mờ vết thâm', key: 'ho-tro-mo-seo-mo-vet-tham', id: 10 },
          { icon: '🌸', title: 'Da mẫn cảm, dễ kích ứng', key: 'da-man-cam-de-kich-ung', id: 11 },
          { icon: '💧', title: 'Dưỡng da bị khô, thiếu ẩm', key: 'duong-da-bi-kho-thieu-am', id: 12 },
          { icon: '✨', title: 'Kem hỗ trợ mờ nám, tàn nhang, đốm nâu', key: 'kem-ho-tro-mo-nam-tan-nhang-dom-nau', id: 95 }
        ]
      },
      { 
        icon: '💇', 
        title: 'Chăm sóc tóc - da đầu', 
        key: 'cham-soc-toc',
        id: 144,
        subcategories: [
          { icon: '🦠', title: 'Dầu gội giúp giảm nấm và ngứa da đầu', key: 'dau-goi-giup-giam-nam-va-ngua-da-dau', id: 3 },
          { icon: '💆', title: 'Chăm sóc chuyên sâu cho tóc', key: 'cham-soc-chuyen-sau-cho-toc', id: 24 },
          { icon: '✨', title: 'Dưỡng tóc, ủ tóc', key: 'duong-toc-u-toc', id: 51 },
          { icon: '🧴', title: 'Dầu gội dầu xả', key: 'dau-goi-dau-xa', id: 107 }
        ]
      },
      { 
        icon: '💄', 
        title: 'Mỹ phẩm trang điểm', 
        key: 'my-pham-trang-diem',
        id: 145,
        subcategories: []
      },
      { 
        icon: '👁️', 
        title: 'Chăm sóc da vùng mắt', 
        key: 'cham-soc-vung-mat',
        id: 146,
        subcategories: [
          { icon: '😴', title: 'Hỗ trợ cải thiện quầng thâm, bọng mắt', key: 'ho-tro-cai-thien-quang-tham-bong-mat', id: 41 },
          { icon: '✨', title: 'Hỗ trợ cải thiện nếp nhăn vùng mắt', key: 'ho-tro-cai-thien-nep-nhan-vung-mat', id: 63 },
          { icon: '💧', title: 'Dưỡng da mắt', key: 'duong-da-mat-vung-mat', id: 100 }
        ]
      },
      { 
        icon: '🌿', 
        title: 'Sản phẩm từ thiên nhiên', 
        key: 'thien-nhien',
        id: 147,
        subcategories: [
          { icon: '🌿', title: 'Tinh dầu', key: 'tinh-dau', id: 97 }
        ]
      }
    ]
  },
  'cham-soc-ca-nhan': {
    title: 'Chăm sóc cá nhân',
    key: 'cham-soc-ca-nhan',
    id: 130,
    categories: [
      { 
        icon: '💑', 
        title: 'Hỗ trợ tình dục', 
        key: 'ho-tro-tinh-duc',
        id: 148,
        subcategories: [
          { icon: '💧', title: 'Gel bôi trơn', key: 'gel-boi-tron', id: 4 },
          { icon: '🛡️', title: 'Bao cao su', key: 'bao-cao-su', id: 94 }
        ]
      },
      { 
        icon: '🍵', 
        title: 'Thực phẩm - Đồ uống', 
        key: 'thuc-pham-do-uong',
        id: 149,
        subcategories: [
          { icon: '🍵', title: 'Thực phẩm - Đồ uống', key: 'thuc-pham-do-uong-sub', id: 28 },
          { icon: '🐦', title: 'Nước Yến', key: 'nuoc-yen', id: 29 },
          { icon: '🍵', title: 'Trà thảo dược', key: 'tra-thao-duoc', id: 30 },
          { icon: '🥤', title: 'Nước uống không gas', key: 'nuoc-uong-khong-gas', id: 31 },
          { icon: '🍬', title: 'Kẹo cứng', key: 'keo-cung', id: 34 },
          { icon: '🧂', title: 'Đường ăn kiêng', key: 'duong-an-kieng', id: 105 }
        ]
      },
      { 
        icon: '🧼', 
        title: 'Vệ sinh cá nhân', 
        key: 've-sinh-ca-nhan',
        id: 150,
        subcategories: [
          { icon: '🩸', title: 'Băng vệ sinh', key: 'bang-ve-sinh', id: 33 },
          { icon: '👩', title: 'Dung dịch vệ sinh phụ nữ', key: 'dung-dich-ve-sinh-phu-nu', id: 61 },
          { icon: '👂', title: 'Vệ sinh tai', key: 've-sinh-tai', id: 76 },
          { icon: '🧴', title: 'Nước rửa tay', key: 'nuoc-rua-tay', id: 126 }
        ]
      },
      { 
        icon: '🦷', 
        title: 'Chăm sóc răng miệng', 
        key: 'cham-soc-rang-mieng',
        id: 151,
        subcategories: [
          { icon: '💦', title: 'Nước súc miệng', key: 'nuoc-suc-mieng', id: 38 },
          { icon: '🧵', title: 'Chỉ nha khoa', key: 'chi-nha-khoa', id: 60 },
          { icon: '✨', title: 'Chăm sóc răng', key: 'cham-soc-rang', id: 86 },
          { icon: '🪥', title: 'Kem đánh răng', key: 'kem-danh-rang', id: 93 },
          { icon: '🦷', title: 'Chăm sóc răng miệng', key: 'cham-soc-rang-mieng-sub', id: 112 },
          { icon: '⚡', title: 'Bàn chải điện', key: 'ban-chai-dien', id: 116 }
        ]
      },
      { 
        icon: '🏠', 
        title: 'Đồ dùng gia đình', 
        key: 'do-dung-gia-dinh',
        id: 152,
        subcategories: [
          { icon: '👶', title: 'Đồ dùng cho bé', key: 'do-dung-cho-be', id: 62 },
          { icon: '🤱', title: 'Đồ dùng cho mẹ', key: 'do-dung-cho-me', id: 65 },
          { icon: '🦟', title: 'Chống muỗi & côn trùng', key: 'chong-muoi-con-trung', id: 74 }
        ]
      },
      { 
        icon: '🎁', 
        title: 'Hàng tổng hợp', 
        key: 'hang-tong-hop',
        id: 153,
        subcategories: [
          { icon: '🧻', title: 'Khăn giấy, khăn ướt', key: 'khan-giay-khan-uot', id: 49 }
        ]
      },
      { 
        icon: '🌿', 
        title: 'Tinh dầu các loại', 
        key: 'tinh-dau-cac-loai',
        id: 154,
        subcategories: [
          { icon: '💨', title: 'Tinh dầu xông', key: 'tinh-dau-xong', id: 72 },
          { icon: '🤧', title: 'Tinh dầu trị cảm', key: 'tinh-dau-tri-cam', id: 88 },
          { icon: '💆', title: 'Tinh dầu massage', key: 'tinh-dau-massage', id: 89 }
        ]
      },
      { 
        icon: '💅', 
        title: 'Thiết bị làm đẹp', 
        key: 'thiet-bi-lam-dep',
        id: 155,
        subcategories: [
          { icon: '🪒', title: 'Dụng cụ tẩy lông', key: 'dung-cu-tay-long', id: 37 },
          { icon: '🧔', title: 'Dụng cụ cạo râu', key: 'dung-cu-cao-rau', id: 77 }
        ]
      }
    ]
  },
  'thiet-bi-y-te': {
    title: 'Thiết bị y tế',
    key: 'thiet-bi-y-te',
    id: 131,
    categories: [
      { 
        icon: '🩺', 
        title: 'Dụng cụ y tế', 
        key: 'dung-cu-y-te',
        id: 156,
        subcategories: [
          { icon: '💆', title: 'Máy massage', key: 'may-massage', id: 1 },
          { icon: '💉', title: 'Kim các loại', key: 'kim-cac-loai', id: 13 },
          { icon: '🧊', title: 'Túi chườm', key: 'tui-chuom', id: 25 },
          { icon: '👃', title: 'Dụng cụ vệ sinh mũi', key: 'dung-cu-ve-sinh-mui', id: 55 },
          { icon: '🔧', title: 'Các dụng cụ và sản phẩm khác', key: 'cac-dung-cu-va-san-pham-khac', id: 79 }
        ]
      },
      { 
        icon: '📊', 
        title: 'Dụng cụ theo dõi', 
        key: 'dung-cu-theo-doi',
        id: 157,
        subcategories: [
          { icon: '🫁', title: 'Máy đo SpO2', key: 'may-do-spo2', id: 27 },
          { icon: '🦠', title: 'Kit Test Covid', key: 'kit-test-covid', id: 39 },
          { icon: '🩸', title: 'Máy, que thử đường huyết', key: 'may-que-thu-duong-huyet', id: 50 },
          { icon: '🤰', title: 'Thử thai', key: 'thu-thai', id: 54 },
          { icon: '🌡️', title: 'Nhiệt kế', key: 'nhiet-ke', id: 127 }
        ]
      },
      { 
        icon: '🚑', 
        title: 'Dụng cụ sơ cứu', 
        key: 'dung-cu-so-cuu',
        id: 158,
        subcategories: [
          { icon: '🌡️', title: 'Miếng dán giảm đau, hạ sốt', key: 'mieng-dan-giam-dau-ha-sot', id: 67 },
          { icon: '🩹', title: 'Băng y tế', key: 'bang-y-te', id: 68 },
          { icon: '☁️', title: 'Bông y tế', key: 'bong-y-te', id: 69 },
          { icon: '🧴', title: 'Cồn, nước sát trùng, nước muối', key: 'con-nuoc-sat-trung-nuoc-muoi', id: 75 },
          { icon: '🩺', title: 'Dụng cụ sơ cứu', key: 'dung-cu-so-cuu-sub', id: 78 },
          { icon: '🩹', title: 'Chăm sóc vết thương', key: 'cham-soc-vet-thuong', id: 84 },
          { icon: '💊', title: 'Xịt giảm đau, kháng viêm', key: 'xit-giam-dau-khang-viem', id: 117 }
        ]
      },
      { 
        icon: '😷', 
        title: 'Khẩu trang', 
        key: 'khau-trang',
        id: 159,
        subcategories: [
          { icon: '🎭', title: 'Khẩu trang vải', key: 'khau-trang-vai', id: 43 },
          { icon: '😷', title: 'Khẩu trang y tế', key: 'khau-trang-y-te', id: 45 }
        ]
      }
    ]
  }
};

// Chuyển đổi dữ liệu thành mảng flat để insert
function buildCategoriesData() {
  const categories = [];
  
  // Level 0: Main categories (parent_id = null)
  Object.values(MENU_DATA).forEach(mainCat => {
    categories.push({
      id: mainCat.id,
      name: mainCat.title,
      parent_id: null
    });
    
    // Level 1: Categories (parent_id = main category id)
    if (mainCat.categories) {
      mainCat.categories.forEach(cat => {
        categories.push({
          id: cat.id,
          name: cat.title,
          parent_id: mainCat.id
        });
        
        // Level 2: Subcategories (parent_id = category id)
        if (cat.subcategories) {
          cat.subcategories.forEach(sub => {
            categories.push({
              id: sub.id,
              name: sub.title,
              parent_id: cat.id
            });
          });
        }
      });
    }
  });
  
  return categories;
}

async function main() {
  console.log('🚀 Bắt đầu seed categories...\n');
  
  try {
    // Bước 1: Kiểm tra products có đang reference đến categories không
    const productsWithCategory = await prisma.products.count({
      where: {
        category_id: { not: null }
      }
    });
    
    console.log(`📊 Số products đang có category_id: ${productsWithCategory}`);
    
    // Bước 2: Set category_id = null cho tất cả products (để tránh lỗi foreign key)
    if (productsWithCategory > 0) {
      console.log('🔄 Đang set category_id = null cho tất cả products...');
      await prisma.products.updateMany({
        where: { category_id: { not: null } },
        data: { category_id: null }
      });
      console.log('✅ Đã set category_id = null cho tất cả products\n');
    }
    
    // Bước 3: Truncate bảng categories
    console.log('🗑️  Đang xóa tất cả categories cũ...');
    await prisma.categories.deleteMany({});
    console.log('✅ Đã xóa tất cả categories cũ\n');
    
    // Bước 4: Reset sequence (auto increment)
    console.log('🔄 Đang reset sequence...');
    await prisma.$executeRaw`ALTER SEQUENCE categories_id_seq RESTART WITH 1`;
    console.log('✅ Đã reset sequence\n');
    
    // Bước 5: Insert dữ liệu mới
    const categoriesData = buildCategoriesData();
    console.log(`📝 Chuẩn bị insert ${categoriesData.length} categories...\n`);
    
    // Sắp xếp theo thứ tự: Level 0 trước, rồi Level 1, rồi Level 2
    // Để đảm bảo parent_id tồn tại trước khi insert child
    const level0 = categoriesData.filter(c => c.parent_id === null);
    const level1 = categoriesData.filter(c => c.parent_id !== null && c.id >= 132 && c.id <= 159);
    const level2 = categoriesData.filter(c => c.parent_id !== null && c.id >= 1 && c.id <= 127);
    
    console.log(`   - Level 0 (Main): ${level0.length} categories`);
    console.log(`   - Level 1 (Categories): ${level1.length} categories`);
    console.log(`   - Level 2 (Subcategories): ${level2.length} categories\n`);
    
    // Insert Level 0
    console.log('📥 Đang insert Level 0 (Main categories)...');
    for (const cat of level0) {
      await prisma.categories.create({
        data: {
          id: cat.id,
          name: cat.name,
          parent_id: cat.parent_id
        }
      });
    }
    console.log('✅ Đã insert Level 0\n');
    
    // Insert Level 1
    console.log('📥 Đang insert Level 1 (Categories)...');
    for (const cat of level1) {
      await prisma.categories.create({
        data: {
          id: cat.id,
          name: cat.name,
          parent_id: cat.parent_id
        }
      });
    }
    console.log('✅ Đã insert Level 1\n');
    
    // Insert Level 2
    console.log('📥 Đang insert Level 2 (Subcategories)...');
    for (const cat of level2) {
      await prisma.categories.create({
        data: {
          id: cat.id,
          name: cat.name,
          parent_id: cat.parent_id
        }
      });
    }
    console.log('✅ Đã insert Level 2\n');
    
    // Bước 6: Cập nhật sequence để id tiếp theo là max(id) + 1
    const maxId = Math.max(...categoriesData.map(c => c.id));
    await prisma.$executeRaw`SELECT setval('categories_id_seq', ${maxId}, true)`;
    console.log(`✅ Đã cập nhật sequence, next id sẽ là ${maxId + 1}\n`);
    
    // Bước 7: Verify
    const totalCategories = await prisma.categories.count();
    console.log('🎉 HOÀN THÀNH!');
    console.log(`📊 Tổng số categories trong database: ${totalCategories}`);
    
    // Hiển thị một số categories để verify
    console.log('\n📋 Một số categories mẫu:');
    const samples = await prisma.categories.findMany({
      take: 10,
      orderBy: { id: 'asc' }
    });
    samples.forEach(cat => {
      console.log(`   ID: ${cat.id} | Name: ${cat.name} | Parent: ${cat.parent_id || 'null'}`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
