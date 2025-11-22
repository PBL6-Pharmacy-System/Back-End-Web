# Comprehensive API Test Results

**Generated**: 2025-11-22 13:24:42

**Base URL**: http://localhost:3000/api

## Summary

- **Total Tests**: 24
- **Passed**: ✅ 19
- **Failed**: ❌ 5
- **Success Rate**: 79.17%

## Auth Module

### User Registration

- **Endpoint**: `POST /auth/register`
- **Status**: ✅ PASSED
- **HTTP Status**: 201
- **Request Body**:
```json
{
  "username": "testuser1763792660",
  "password": "Test@123456",
  "email": "testuser1763792660@example.com",
  "phone": "0963792660",
  "full_name": "Test User",
  "role_name": "customer"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 44,
      "username": "testuser1763792660",
      "email": "testuser1763792660@example.com",
      "phone": "0963792660",
      "role_id": 3,
      "full_name": "Test User",
      "avatar_url": null,
      "created_at": "2025-11-22T06:24:21.581Z",
      "updated_at": "2025-11-22T06:24:21.581Z",
      "is_active": true,
      "is_verified": false,
      "last_login": null,
      "roles": {
        "id": 3,
        "role_name": "customer",
        "description": "Customer with basic access",
        "created_at": "2025-11-19T13:12:03.451Z",
        "updated_at": "2025-11-19T13:12:03.451Z"
      },
      "customers": {
        "id": 26,
        "user_id": 44,
        "dob": null,
        "gender": null,
        "address": null,
        "created_at": "2025-11-22T06:24:22.020Z",
        "updated_at": "2025-11-22T06:24:22.020Z",
        "city": null,
        "city_id": null
      },
      "staff": null,
      "admin": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ0LCJ1c2VybmFtZSI6InRlc3R1c2VyMTc2Mzc5MjY2MCIsImVtYWlsIjoidGVzdHVzZXIxNzYzNzkyNjYwQGV4YW1wbGUuY29tIiwicm9sZV9pZCI6Mywicm9sZV9uYW1lIjoiY3VzdG9tZXIiLCJjdXN0b21lcl9pZCI6MjYsImlhdCI6MTc2Mzc5MjY2MywiZXhwIjoxNzYzODc5MDYzfQ.gLqjLcHsgfAj5c6SVMgB-34Ps1nKvZlAHLucmJPVY-0",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ0LCJpYXQiOjE3NjM3OTI2NjMsImV4cCI6MTc2NDM5NzQ2M30.WGZKwnKcrJFOJYcZwnEnAFd8jHg1uaMpxQelAO3VIFQ"
  }
}
```

---

### User Login

- **Endpoint**: `POST /auth/login`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Request Body**:
```json
{
  "username": "testuser1763792660",
  "password": "Test@123456"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 44,
      "username": "testuser1763792660",
      "email": "testuser1763792660@example.com",
      "phone": "0963792660",
      "role_id": 3,
      "full_name": "Test User",
      "avatar_url": null,
      "created_at": "2025-11-22T06:24:21.581Z",
      "updated_at": "2025-11-22T06:24:21.581Z",
      "is_active": true,
      "is_verified": false,
      "last_login": null,
      "roles": {
        "id": 3,
        "role_name": "customer",
        "description": "Customer with basic access",
        "created_at": "2025-11-19T13:12:03.451Z",
        "updated_at": "2025-11-19T13:12:03.451Z"
      },
      "customers": {
        "id": 26,
        "user_id": 44,
        "dob": null,
        "gender": null,
        "address": null,
        "created_at": "2025-11-22T06:24:22.020Z",
        "updated_at": "2025-11-22T06:24:22.020Z",
        "city": null,
        "city_id": null
      },
      "staff": null,
      "admin": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ0LCJ1c2VybmFtZSI6InRlc3R1c2VyMTc2Mzc5MjY2MCIsImVtYWlsIjoidGVzdHVzZXIxNzYzNzkyNjYwQGV4YW1wbGUuY29tIiwicm9sZV9pZCI6Mywicm9sZV9uYW1lIjoiY3VzdG9tZXIiLCJjdXN0b21lcl9pZCI6MjYsImlhdCI6MTc2Mzc5MjY2NCwiZXhwIjoxNzYzODc5MDY0fQ.B23Zz40SSXhIGSgJmWvEjGO-AAILTcxwszhugCwkrHo",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ0LCJpYXQiOjE3NjM3OTI2NjQsImV4cCI6MTc2NDM5NzQ2NH0.6xVO5osfagkvPDg3a9o3mGI6EBUij5lGxl_ly0sFSJI"
  }
}
```

---

### Get Current User

- **Endpoint**: `GET /auth/me`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": 44,
    "username": "testuser1763792660",
    "email": "testuser1763792660@example.com",
    "phone": "0963792660",
    "role_id": 3,
    "full_name": "Test User",
    "avatar_url": null,
    "created_at": "2025-11-22T06:24:21.581Z",
    "updated_at": "2025-11-22T06:24:21.581Z",
    "is_active": true,
    "is_verified": false,
    "last_login": "2025-11-22T06:24:24.240Z",
    "roles": {
      "id": 3,
      "role_name": "customer",
      "description": "Customer with basic access",
      "created_at": "2025-11-19T13:12:03.451Z",
      "updated_at": "2025-11-19T13:12:03.451Z"
    },
    "customers": {
      "id": 26,
      "user_id": 44,
      "dob": null,
      "gender": null,
      "address": null,
      "created_at": "2025-11-22T06:24:22.020Z",
      "updated_at": "2025-11-22T06:24:22.020Z",
      "city": null,
      "city_id": null
    },
    "staff": null,
    "admin": null
  }
}
```

---

### User Logout

- **Endpoint**: `POST /auth/logout`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

---

## Products Module

### Get All Products (Paginated)

- **Endpoint**: `GET /products?page=1&limit=10`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 909,
        "name": "Bàn chải đánh răng điện Oral-B Vitality Crossaction Blue làm sạch mảng bám trên răng",
        "description": "Bàn chải đánh răng điện Oral-B Vitality CrossAction Blue là một trong những sản phẩm của Oral-B được các nha sỹ tại Viện răng hàm mặt quốc tế khuyên dùng. Với thiết kế đầu bàn chải lông siêu mềm, an toàn và phù hợp với răng nướu, chế độ đầu bàn chải xoay tròn giúp cho việc làm sạch các mảng bám và vi khuẩn một cách toàn diện, nhanh chóng. ",
        "price": "499500",
        "category_id": 116,
        "supplier_id": 37,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503164_ban_chai_danh_rang_dien_oral_b_vitality_crossaction_blue_8974_63c4_large_8c46c8e883.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00212_075b7f4e1d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_04212_d9308525fc.png",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501362_dau_chai_rang_nguoi_lon_oral_b_sensi_ultrathin_eb_60_2_2559_62e3_large_f9bf5a581c.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501361_dau_chai_rang_tre_em_oral_b_eb_10_2_k_3560_62e3_large_29e7973c14.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501356_ban_chai_danh_rang_nguoi_lon_oral_b_pro_health_db4510_dung_pin_4243_62e3_large_d2f30b63f5.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501355_ban_chai_danh_rang_tre_em_oral_b_stages_power_db4510k_dung_pin_4056_62e3_large_55fb1e2be9.jpg"
        ],
        "manufacturer": "BRAUN",
        "usage": "<p>Bàn chải đánh răng điện Oral-B Vitality CrossAction Blue có thiết kế đầu bàn chải thích hợp, giúp làm sạch mảng bám trên răng một cách toàn diện, loại bỏ các vết ố răng, cải thiện sức khoẻ của nướu.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p><p><i>Sạc&nbsp;và vận hành máy:</i></p><p>Bàn chải đánh răng được thiết kế có tay cầm chống nước, an toàn về điện và có thể sử dụng trong phòng tắm.</p><ul><li>Cắm ổ sạc vào ổ cắm điện. Đặt thân bàn chải vào bộ phận sạc.</li><li>Một lần sạc mất khoảng 16 giờ và dùng được tới 8 ngày (hai lần một ngày, 2 phút).</li><li>Để sử dụng hàng ngày, thân bàn chải điện có thể được lưu trữ trên bộ sạc để đảm bảo luôn trong tình trạng đầy pin. Hãy yên tâm vì sẽ không xảy ra trường hợp pin bị quá tải.</li></ul><p><i>Sử dụng bàn chải điện:</i></p><ul><li>Làm ướt đầu bàn chải và cho kem đánh răng lên. Để tránh <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/kem-danh-rang\">kem đánh răng</a> bị bắn tung tóe, hãy đặt đầu bàn chải lên răng của bạn trước khi bật máy.</li><li>Chải từ từ từng chiếc răng một, dành vài giây cho mỗi bề mặt răng.</li><li>Bắt đầu chải bên ngoài, sau đó là bên trong và cuối cùng là bề mặt nhai. Chải tất cả bốn góc phần tư của miệng của bạn như nhau. Bạn cũng có thể tham khảo ý kiến ​​nha sĩ hoặc vệ sinh nha khoa về kỹ thuật phù hợp với bạn.</li></ul><p><u>* Lưu ý:</u></p><ul><li>Chải răng chậm từng cái răng một, từ ngoài vào trong, cuối cùng là bề mặt nhai. Không nên ấn bàn chải lên răng quá mạnh, dành một vài giây trên mỗi bề mặt răng.</li><li>Với bất kỳ đầu bàn chải nào, hãy bắt đầu chải bên ngoài, sau đó là mặt trong và cuối cùng là bề mặt nhai. Chải tất cả bốn góc phần tư của miệng.</li><li>Không nên sử dụng lực quá mạnh, chỉ cần để bàn chải Oral B làm công việc của nó. Chải ít nhất 2 phút để&nbsp;loại bỏ triệt để mảng bám.</li><li>Trong ngày đầu tiên sử dụng, nướu có thể chảy máu nhẹ. Nếu tình trạng cháy máu kéo dài trong 2 tuần, hãy liện hệ với nha sĩ để được tư vấn và chăm sóc.</li></ul><p><i>Hướng dẫn vệ sinh bàn chải điện Oral-B Vitality:</i></p><ul><li>Sau khi sử dụng, vệ sinh đầu bàn chải trực tiếp dưới vòi nước đang chảy.</li><li>Tháo đầu bàn chải và thân bàn chải tách rời nhau, rửa sạch và để khô.</li><li>Thỉnh thoảng, dùng khăn ẩm để lau các bộ phận của bàn chải.</li><li>Không được đặt bộ sạc trong nước. Giá đỡ bàn chải an toàn với máy rửa chén.</li></ul><p><strong>Đối tượng sử dụng</strong></p><p>Dùng cho người lớn.</p>",
        "specification": "Hộp",
        "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
        "registNum": "TCCS 06:2022/DTNH",
        "brand": "Oral-B",
        "producer": "BRAUN",
        "manufactor": "Trung Quốc",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "Trẻ em cần sử dụng b&agrave;n chải điện dưới sự hướng dẫn v&agrave; theo d&otilde;i của phụ huynh.",
            "question": "Trẻ em có nên sử dụng bàn chải điện không?"
          },
          {
            "answer": "B&agrave;n chải điện l&agrave; một sản phẩm v&ocirc; c&ugrave;ng th&iacute;ch hợp cho người niềng răng hoặc đang thực hiện c&aacute;c biện ph&aacute;p điều chỉnh răng, v&igrave; sản phẩm sẽ gi&uacute;p bạn l&agrave;m sạch triệt để c&aacute;c cặn thức ăn cũng như c&aacute;c mảng b&aacute;m tốt hơn so với b&agrave;n chải th&ocirc;ng thường.",
            "question": "Người niềng răng sử dụng được bàn chải điện không?"
          },
          {
            "answer": "Theo c&aacute;c chuy&ecirc;n gia về nha khoa, thời gian đ&aacute;nh răng trong v&ograve;ng 2 ph&uacute;t l&agrave; hợp l&yacute; nhất. Nếu &iacute;t hơn sẽ kh&ocirc;ng đủ l&agrave;m sạch răng, c&ograve;n nếu nhiều hơn sẽ g&acirc;y b&agrave;o m&ograve;n ch&acirc;n răng v&agrave; men răng.",
            "question": "Thời gian đánh răng bao lâu là hợp lý?"
          },
          {
            "answer": "Hiệp hội Nha khoa Mỹ khuyến nghị người ti&ecirc;u d&ugrave;ng n&ecirc;n thay đầu b&agrave;n chải đ&aacute;nh răng điện ba th&aacute;ng một lần hoặc sớm hơn nếu thấy cần thiết. Khi l&ocirc;ng đầu b&agrave;n chải trở n&ecirc;n xơ v&agrave; m&ograve;n th&igrave; hiệu quả l&agrave;m sạch răng sẽ bị suy giảm.",
            "question": "Dùng Bàn chải đánh răng điện Oral-B Vitality CrossAction Blue bao lâu thì thay đầu bàn chải?"
          },
          {
            "answer": "Sản phẩm n&agrave;y d&ugrave;ng cho người lớn v&agrave; trẻ em tr&ecirc;n 3 tuổi, kh&ocirc;ng n&ecirc;n sử dụng cho trẻ em dưới 3 tuổi.",
            "question": "Bàn chải đánh răng điện Oral-B Vitality CrossAction Blue có dùng cho trẻ em được không?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 116,
          "name": "Bàn chải điện",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 37,
          "name": "BRAUN",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 915,
        "name": "Bàn chải đánh răng điện Oral-B Vitality CrossAction White D100.413.1 loại bỏ được mảng bám và vết ố trên răng",
        "description": "Bàn chải điện Oral-B Vitality CrossAction White D100.413.1 sử dụng công nghệ làm sạch 2D, tốc độ vòng quay 7200 lần/phút, giúp làm sạch hiệu quả các mảng bám cứng đầu trên răng.",
        "price": "0",
        "category_id": 116,
        "supplier_id": 406,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501358_ban_chai_danh_rang_nguoi_lon_oral_b_vitality_crossaction_white_d1004131_sac_dien_1425_62e3_large_7a6cdce699.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00212_075b7f4e1d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_04212_d9308525fc.png",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503164_ban_chai_danh_rang_dien_oral_b_vitality_crossaction_blue_8974_63c4_large_8c46c8e883.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501362_dau_chai_rang_nguoi_lon_oral_b_sensi_ultrathin_eb_60_2_2559_62e3_large_f9bf5a581c.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501361_dau_chai_rang_tre_em_oral_b_eb_10_2_k_3560_62e3_large_29e7973c14.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501356_ban_chai_danh_rang_nguoi_lon_oral_b_pro_health_db4510_dung_pin_4243_62e3_large_d2f30b63f5.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501355_ban_chai_danh_rang_tre_em_oral_b_stages_power_db4510k_dung_pin_4056_62e3_large_55fb1e2be9.jpg"
        ],
        "manufacturer": "P&G",
        "usage": "<p>Loại bỏ được mảng bám và vết ố trên răng.</p>\n\n<p>Cải thiện sức khoẻ của nướu răng.</p>\n\n<p>Loại bỏ được mùi hôi của khoang miệng nhờ mặt sau của bàn chải khi tiếp xúc với lưỡi.</p>\n\n<p>Massage nướu răng hiệu quả.</p>\n\n<p>Làm sạch tốt nhưng vẫn đảm bảo nhẹ nhàng với nướu và răng.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p><p>Rửa đầu bàn chải Oral-B Vitality với nước lạnh.</p><p>Sau đó cho một lượng <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/kem-danh-rang\">kem đánh răng</a> vừa đủ lên lông bàn chải.</p><p>Cầm bàn chải theo góc 45 độ và đánh dọc theo đường viền cơ lợi.</p><p>Súc miệng bằng nước để không còn bọt kem trong miệng.</p><p><strong>Đối tượng sử dụng</strong></p><p>Dùng cho người lớn.</p>",
        "specification": "Hộp",
        "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
        "registNum": "TCCS 04:2019/DTNH",
        "brand": "Oral-B",
        "producer": "P&G",
        "manufactor": "Hungary",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "Chảy m&aacute;u ch&acirc;n răng l&agrave; do t&igrave;nh trạng vi&ecirc;m nhiễm ở nướu, g&acirc;y ra bởi mảng b&aacute;m t&iacute;ch tụ hoặc do chải răng qu&aacute; mạnh. Nếu bạn nhận thấy c&oacute; m&aacute;u chảy ra khi bạn chải răng hoặc sử dụng chỉ nha khoa, h&atilde;y đến gặp nha sĩ của bạn. Ngo&agrave;i ra c&ograve;n c&oacute; một số phương ph&aacute;p bạn c&oacute; thể tự thực hiện để ngăn ngừa chảy m&aacute;u ch&acirc;n răng.",
            "question": "Chảy máu chân răng là gì?"
          },
          {
            "answer": "V&ocirc;i răng thực chất l&agrave; những mảng b&aacute;m thức ăn b&aacute;m đầy tr&ecirc;n cổ răng, nướu, l&acirc;u ng&agrave;y h&igrave;nh th&agrave;ng. C&aacute;c mảng b&aacute;m b&aacute;m n&agrave;y tồn tại ng&agrave;y tr&ecirc;n bề mặt răng sẽ tạo th&agrave;nh một kết d&iacute;nh &ocirc;m chắc v&agrave;o răng.\r\n\r\nViệc cạo v&ocirc;i răng l&agrave; c&aacute;ch điều trị t&igrave;nh trạng răng miệng được nhiều bệnh nh&acirc;n cũng như b&aacute;c sĩ lựa chọn sử dụng. Việc l&agrave;m sạch v&ocirc;i răng kết hợp với vệ sinh răng miệng sạch sẽ h&agrave;ng ng&agrave;y c&oacute; t&aacute;c dụng cải thiện được m&ugrave;i h&ocirc;i trong miệng v&agrave; ph&ograve;ng ngừa t&igrave;nh trạng vi&ecirc;m nhiễm.",
            "question": "Cạo vôi răng có hết hôi miệng?"
          },
          {
            "answer": "H&ocirc;i miệng l&agrave; một vấn đề phổ biến ảnh hưởng đến c&aacute; nh&acirc;n ở tất cả c&aacute;c lứa tuổi. C&aacute;c yếu tố bệnh nguy&ecirc;n ch&iacute;nh bao gồm c&aacute;c vi khuẩn trong khoang miệng li&ecirc;n quan đặc biệt đến c&aacute;c bệnh nha chu v&agrave; bề mặt của lưỡi. Ngo&agrave;i ra c&ograve;n c&aacute;c vấn đề về tai - mũi - họng, hệ ti&ecirc;u ho&aacute;, t&acirc;m l&yacute;&hellip;",
            "question": "Tại sao lại hôi miệng?"
          },
          {
            "answer": "Nếu kh&ocirc;ng giữ cho khoang miệng sạch sẽ, c&aacute;c mảng b&aacute;m tr&ecirc;n răng tồn đọng tạo th&agrave;nh cao răng khiến bạn dễ c&oacute; nguy cơ bị bệnh răng miệng như s&acirc;u răng, nha chu &ndash; vi&ecirc;m nướu (nướu đỏ, sưng v&agrave; chảy m&aacute;u).",
            "question": "Tại sao phải cần vệ sinh răng miệng?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 116,
          "name": "Bàn chải điện",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 406,
          "name": "P&G",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 912,
        "name": "Bàn chải đánh răng pin Oral-B Pro Health DB4510 loại bỏ được mảng bám và vết ố trên răng",
        "description": "Bàn chải đánh răng người lớn Oral-B Pro Health DB4510 là sản phẩm chăm sóc răng miệng đến từ thương hiệu Oral-B. Sản phẩm được thiết kế với đầu bàn chải mềm mại, dễ dàng làm sạch mọi mảng bám bên trong khoang miệng, đồng thời không làm trầy xước đến nướu răng, giúp chăm sóc sức khỏe răng miệng một cách toàn diện.",
        "price": "357500",
        "category_id": 116,
        "supplier_id": 406,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501356_ban_chai_danh_rang_nguoi_lon_oral_b_pro_health_db4510_dung_pin_4243_62e3_large_d2f30b63f5.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00212_075b7f4e1d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_04212_d9308525fc.png",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503164_ban_chai_danh_rang_dien_oral_b_vitality_crossaction_blue_8974_63c4_large_8c46c8e883.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501362_dau_chai_rang_nguoi_lon_oral_b_sensi_ultrathin_eb_60_2_2559_62e3_large_f9bf5a581c.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501361_dau_chai_rang_tre_em_oral_b_eb_10_2_k_3560_62e3_large_29e7973c14.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501355_ban_chai_danh_rang_tre_em_oral_b_stages_power_db4510k_dung_pin_4056_62e3_large_55fb1e2be9.jpg"
        ],
        "manufacturer": "P&G",
        "usage": "<p>Loại bỏ được mảng bám và vết ố trên răng.</p>\n\n<p>Cải thiện sức khoẻ của nướu răng.</p>\n\n<p>Loại bỏ được mùi hôi của khoang miệng nhờ mặt sau của bàn chải khi tiếp xúc với lưỡi.</p>\n\n<p>Massage nướu răng hiệu quả.</p>\n\n<p>Làm sạch tốt nhưng vẫn đảm bảo nhẹ nhàng với nướu và răng.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p>\n\n<p>Rửa đầu bàn chải với nước lạnh.</p>\n\n<p>Sau đó cho một lượng kem vừa đủ lên lông bàn chải.</p>\n\n<p>Cầm bàn chải theo góc 45 độ và đánh dọc theo đường viền cơ lợi.</p>\n\n<p>Súc miệng bằng nước để không còn bọt kem trong miệng.</p>\n\n<p><strong>Đối tượng sử dụng</strong></p>\n\n<p>Dùng cho người lớn.</p>",
        "specification": "Hộp",
        "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
        "registNum": "TCCS 02:2019/DTNH",
        "brand": "Oral-B",
        "producer": "P&G",
        "manufactor": "Trung Quốc",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "Bàn chải Oral-B Pro Health DB4510 giúp loại bỏ mảng bám và vết ố trên răng, từ đó cải thiện sức khỏe nướu răng. Mặt sau của bàn chải khi tiếp xúc với lưỡi còn giúp loại bỏ mùi hôi trong khoang miệng. Bên cạnh đó, các động tác của bàn chải còn có tác dụng massage nướu răng một cách hiệu quả, đồng thời làm sạch răng nhẹ nhàng mà không gây hại cho nướu và răng.",
            "question": "Bàn chải Oral-B Pro Health DB4510 có giúp cải thiện các vấn đề răng miệng cụ thể nào không?"
          },
          {
            "answer": "Bàn chải pin Oral-B Pro Health DB4510 sử dụng pin AA, một loại pin thông dụng và dễ dàng tìm mua ở nhiều cửa hàng. Việc tháo lắp và thay thế pin AA rất đơn giản, mang lại sự tiện lợi cho người sử dụng mà không cần lo lắng về vấn đề sạc điện phức tạp. Sản phẩm thường đi kèm pin khi mua.",
            "question": "Bàn chải này sử dụng loại pin gì và có dễ dàng thay thế không?"
          },
          {
            "answer": "Đầu bàn chải của Oral-B Pro Health DB4510 có lông mềm mại với công nghệ Precision Clean, giúp loại bỏ mảng bám hiệu quả dọc theo đường viền nướu mà không gây trầy xước hay ảnh hưởng xấu đến nướu. Thiết kế nhỏ gọn của đầu bàn chải cho phép tiếp cận những vùng răng khó chải tới, mang lại hiệu quả làm sạch gấp 5 lần so với bàn chải thông thường. Đặc biệt, đầu bàn chải có thể tháo rời và thay thế sau mỗi 3 tháng theo khuyến cáo của nha sĩ.",
            "question": "Đầu bàn chải của Oral-B Pro Health DB4510 có đặc điểm gì?"
          },
          {
            "answer": "Công nghệ làm sạch 3D trên bàn chải Oral-B Pro Health DB4510 là sự kết hợp của ba loại chuyển động: Xoay, rung động và các xung động. Sự kết hợp này giúp đầu bàn chải làm sạch răng toàn diện hơn so với các công nghệ làm sạch khác. Với 9600 dao động mỗi phút, bàn chải có khả năng đánh bay mảng bám và vết ố vàng cứng đầu trên răng một cách hiệu quả.",
            "question": "Công nghệ làm sạch 3D trên bàn chải này hoạt động như thế nào?"
          },
          {
            "answer": "Bàn chải đánh răng pin Oral-B Pro Health DB4510 nổi bật với khả năng làm sạch mảng bám cứng đầu và vết ố trên răng hiệu quả nhờ công nghệ làm sạch 3D, kết hợp giữa xoay, rung động và các xung động. Công nghệ này được chứng minh là mang lại hiệu quả làm sạch gấp 2 lần so với bàn chải thông thường. Đầu bàn chải mềm mại với tính năng Precision Clean giúp làm sạch sâu dọc chân răng mà không gây tổn thương nướu. Thiết kế nhỏ gọn, trọng lượng nhẹ và tay cầm chống trơn trượt mang lại sự tiện lợi khi sử dụng hàng ngày cũng như khi đi du lịch.",
            "question": "Bàn chải đánh răng pin Oral-B Pro Health DB4510 có những ưu điểm nổi bật nào?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 116,
          "name": "Bàn chải điện",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 406,
          "name": "P&G",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 913,
        "name": "Bàn chải đánh răng trẻ em Oral-B Stages Power DB4510K làm sạch mảng bám trên răng (1 cây)",
        "description": "Bàn chải đánh răng trẻ em Oral-B Stages Power DB4510K là sản phẩm chăm sóc răng miệng dành cho trẻ em. Bàn chải hỗ trợ làm sạch mảng bám trên răng mà không ảnh hưởng xấu đến nướu răng, tính năng làm sạch với 9600 dao động trên một phút kết hợp cùng đầu bàn chải mềm mại giúp bảo vệ sức khỏe răng miệng của trẻ một cách toàn diện.",
        "price": "343000",
        "category_id": 116,
        "supplier_id": 406,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501355_ban_chai_danh_rang_tre_em_oral_b_stages_power_db4510k_dung_pin_4056_62e3_large_55fb1e2be9.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00212_075b7f4e1d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_04212_d9308525fc.png",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503164_ban_chai_danh_rang_dien_oral_b_vitality_crossaction_blue_8974_63c4_large_8c46c8e883.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501362_dau_chai_rang_nguoi_lon_oral_b_sensi_ultrathin_eb_60_2_2559_62e3_large_f9bf5a581c.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501361_dau_chai_rang_tre_em_oral_b_eb_10_2_k_3560_62e3_large_29e7973c14.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501356_ban_chai_danh_rang_nguoi_lon_oral_b_pro_health_db4510_dung_pin_4243_62e3_large_d2f30b63f5.jpg"
        ],
        "manufacturer": "P&G",
        "usage": "<p>Loại bỏ được mảng bám và vết ố trên răng.</p>\n\n<p>Cải thiện sức khoẻ của nướu răng.</p>\n\n<p>Loại bỏ được mùi hôi của khoang miệng nhờ mặt sau của bàn chải khi tiếp xúc với lưỡi.</p>\n\n<p>Massage nướu răng hiệu quả.</p>\n\n<p>Làm sạch tốt nhưng vẫn đảm bảo nhẹ nhàng với nướu và răng.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p><p>Rửa đầu bàn chải với nước lạnh.</p><p>Sau đó cho một lượng <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/kem-danh-rang\">kem đánh răng</a> vừa đủ lên lông bàn chải.</p><p>Cầm bàn chải theo góc 45 độ và đánh dọc theo đường viền cơ lợi.</p><p>Súc miệng bằng nước để không còn bọt kem trong miệng.</p><p><strong>Đối tượng sử dụng</strong></p><p>Trẻ em 3 tuổi trở lên.</p>",
        "specification": "Hộp",
        "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
        "registNum": "TCCS 03:2019/DTNH",
        "brand": "Oral-B",
        "producer": "P&G",
        "manufactor": "Trung Quốc",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "Chảy m&aacute;u ch&acirc;n răng l&agrave; do t&igrave;nh trạng vi&ecirc;m nhiễm ở nướu, g&acirc;y ra bởi mảng b&aacute;m t&iacute;ch tụ hoặc do chải răng qu&aacute; mạnh. Nếu bạn nhận thấy c&oacute; m&aacute;u chảy ra khi bạn chải răng hoặc sử dụng chỉ nha khoa, h&atilde;y đến gặp nha sĩ của bạn. Ngo&agrave;i ra c&ograve;n c&oacute; một số phương ph&aacute;p bạn c&oacute; thể tự thực hiện để ngăn ngừa chảy m&aacute;u ch&acirc;n răng.",
            "question": "Chảy máu chân răng là gì?"
          },
          {
            "answer": "V&ocirc;i răng thực chất l&agrave; những mảng b&aacute;m thức ăn b&aacute;m đầy tr&ecirc;n cổ răng, nướu, l&acirc;u ng&agrave;y h&igrave;nh th&agrave;ng. C&aacute;c mảng b&aacute;m b&aacute;m n&agrave;y tồn tại ng&agrave;y tr&ecirc;n bề mặt răng sẽ tạo th&agrave;nh một kết d&iacute;nh &ocirc;m chắc v&agrave;o răng.\r\n\r\nViệc cạo v&ocirc;i răng l&agrave; c&aacute;ch điều trị t&igrave;nh trạng răng miệng được nhiều bệnh nh&acirc;n cũng như b&aacute;c sĩ lựa chọn sử dụng. Việc l&agrave;m sạch v&ocirc;i răng kết hợp với vệ sinh răng miệng sạch sẽ h&agrave;ng ng&agrave;y c&oacute; t&aacute;c dụng cải thiện được m&ugrave;i h&ocirc;i trong miệng v&agrave; ph&ograve;ng ngừa t&igrave;nh trạng vi&ecirc;m nhiễm.",
            "question": "Cạo vôi răng có hết hôi miệng?"
          },
          {
            "answer": "H&ocirc;i miệng l&agrave; một vấn đề phổ biến ảnh hưởng đến c&aacute; nh&acirc;n ở tất cả c&aacute;c lứa tuổi. C&aacute;c yếu tố bệnh nguy&ecirc;n ch&iacute;nh bao gồm c&aacute;c vi khuẩn trong khoang miệng li&ecirc;n quan đặc biệt đến c&aacute;c bệnh nha chu v&agrave; bề mặt của lưỡi. Ngo&agrave;i ra c&ograve;n c&aacute;c vấn đề về tai - mũi - họng, hệ ti&ecirc;u ho&aacute;, t&acirc;m l&yacute;&hellip;",
            "question": "Tại sao lại hôi miệng?"
          },
          {
            "answer": "Nếu kh&ocirc;ng giữ cho khoang miệng sạch sẽ, c&aacute;c mảng b&aacute;m tr&ecirc;n răng tồn đọng tạo th&agrave;nh cao răng khiến bạn dễ c&oacute; nguy cơ bị bệnh răng miệng như s&acirc;u răng, nha chu &ndash; vi&ecirc;m nướu (nướu đỏ, sưng v&agrave; chảy m&aacute;u).",
            "question": "Tại sao phải cần vệ sinh răng miệng?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 116,
          "name": "Bàn chải điện",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 406,
          "name": "P&G",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 444,
        "name": "Bàn chải đánh răng trẻ em sạc điện Oral-B Vitality D12 Disney Cars giúp làm sạch mảng bám trên răng một cách toàn diện",
        "description": "Bàn chải đánh răng trẻ em Oral-B Vitality D12 Disney Cars là một trong những sản phẩm của Oral-B được các nha sĩ trên thế giới khuyến khích sử dụng. Với thiết kế đầu bàn chải xoay đảo hai chiều nên giúp làm sạch mảng bám chân răng, hỗ trợ bảo vệ răng nướu và hạn chế chảy máu chân răng.",
        "price": "499500",
        "category_id": 62,
        "supplier_id": 37,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_02831_34742d5e13.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09730_6ca1ccf34c.png",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00201_6a727fd55a.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/sudocream_d5fd9979ed.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00004275_lactacyd_bb_250ml_sanofi_lo_3437_62c6_large_b2049ce3cc.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00018206_bepanthen_balm_bayer_30g_3395_5d10_large_ce13b0e44f.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00000694_ami_bebe_250ml_2235_62ae_large_7a487b4bba.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00017950_phyto_bebe_opodis_250ml_dd_tam_rom_say_em_be_4514_62ae_large_2e5fea1be2.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_02974_ff6ee7e49e.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_05337_f4373eaa95.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00002231_dau_emcare_25ml_1227_62af_large_01c7815a7d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09077_1_daae1e96e4.jpg"
        ],
        "manufacturer": "BRAUN",
        "usage": "<p><a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/ban-chai-danh-rang-tre-em-oral-b-vitality-d12-disney-cars-sac-dien.html\">Bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars</a> có thiết kế đầu bàn chải thích hợp, giúp làm&nbsp;sạch mảng bám trên răng một cách toàn diện, loại bỏ các vết ố răng, cải thiện sức khoẻ của nướu.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p><p>Dùng để chải răng ít nhất 2 lần mỗi ngày.</p><ul><li>Làm ướt đầu bàn chải và cho <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/kem-danh-rang\">kem đánh răng</a> lên. Để tránh kem đánh răng bị bắn tung tóe, hãy đặt đầu bàn chải lên răng trước khi bật máy.</li><li>Chải từ từ từng chiếc răng một, dành vài giây cho mỗi bề mặt răng.</li><li>Bắt đầu chải bên ngoài, sau đó là bên trong và cuối cùng là bề mặt nhai. Chải tất cả bốn góc phần tư của miệng của bạn như nhau. Bạn cũng có thể tham khảo ý kiến ​​nha sĩ hoặc vệ sinh nha khoa về kỹ thuật phù hợp với bạn.</li></ul><p><strong>Đối tượng sử dụng</strong></p><p>Dùng cho trẻ em.</p>",
        "specification": "Hộp",
        "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/ban-chai-dien\">bàn chải điện</a>.</p>",
        "registNum": "TCCS 04:2021/PG",
        "brand": "Oral-B",
        "producer": "BRAUN",
        "manufactor": "Trung Quốc",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "Bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars không sử dụng cho trẻ dưới 3 tuổi. Trẻ nhỏ khi sử dụng cần có sự đồng hành, hướng dẫn của người lớn.",
            "question": "Bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars không dùng cho đối tượng nào?"
          },
          {
            "answer": "Bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars làm sạch và bảo vệ nướu vượt trội. Trải nghiệm bàn chải điện Oral-B được nha sĩ khuyên dùng đầu tiên trên toàn thế giới. Lông bàn chải đặc biệt mềm, phù hợp với khuôn miệng nhạy cảm. Giúp đánh bay các mảng bám, vi khuẩn tốt hơn rất nhiều lần so với bàn chải đánh răng thủ công thông thường.",
            "question": "Tại sao nên dùng bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars?"
          },
          {
            "answer": "Đầu bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars có thể tháo rời ra khỏi thân và thay mới sau mỗi 3 tháng theo khuyến cáo của các chuyên gia răng miệng. Bạn chỉ cần mua đầu chải răng để lắp vào thân máy cũ cho bé, giúp tiết kiệm chi phí trong thời gian sử dụng.",
            "question": "Bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars có thay đầu bàn chải được không?"
          },
          {
            "answer": "Bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars trang bị chức năng vận hành mạnh mẽ nhờ hệ thống làm sạch 2D chuyển động xoay dao động với tần số rung 7.600 vòng xoay/phút, cung cấp hiệu suất làm sạch nâng cao.",
            "question": "Chức năng vận hành 2D của bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars là gì?"
          },
          {
            "answer": "Bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars được trang bị với chức năng hẹn giờ 2 phút và có thể dùng được 5 ngày sau 1 lần sạc.",
            "question": "Bàn chải điện trẻ em Oral-B Vitality D12 Disney Cars có hẹn giờ được không?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 62,
          "name": "Đồ dùng cho bé",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 37,
          "name": "BRAUN",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 443,
        "name": "Bàn chải đánh răng trẻ em sạc điện Oral-B Vitality D12 Disney Frozen giúp làm sạch mảng bám trên răng một cách toàn diện",
        "description": "Bàn chải đánh răng trẻ em Oral-B Vitality D12 Disney Frozen là một trong những sản phẩm của Oral-B được các nha sĩ trên thế giới khuyến khích sử dụng. Với thiết kế đầu bàn chải xoay đảo hai chiều nên giúp làm sạch mảng bám chân răng, hỗ trợ bảo vệ răng nướu và hạn chế chảy máu chân răng.",
        "price": "499500",
        "category_id": 62,
        "supplier_id": 37,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09730_6ca1ccf34c.png",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_02831_34742d5e13.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00201_6a727fd55a.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/sudocream_d5fd9979ed.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00004275_lactacyd_bb_250ml_sanofi_lo_3437_62c6_large_b2049ce3cc.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00018206_bepanthen_balm_bayer_30g_3395_5d10_large_ce13b0e44f.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00000694_ami_bebe_250ml_2235_62ae_large_7a487b4bba.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00017950_phyto_bebe_opodis_250ml_dd_tam_rom_say_em_be_4514_62ae_large_2e5fea1be2.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_02974_ff6ee7e49e.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_05337_f4373eaa95.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00002231_dau_emcare_25ml_1227_62af_large_01c7815a7d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09077_1_daae1e96e4.jpg"
        ],
        "manufacturer": "BRAUN",
        "usage": "<p>Bàn chải điện trẻ em <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/ban-chai-danh-rang-tre-em-oral-b-vitality-d12-disney-frozen-sac-dien.html\">Oral-B Vitality D12 Disney Frozen</a> có thiết kế đầu bàn chải thích hợp, giúp làm&nbsp;sạch mảng bám trên răng một cách toàn diện, loại bỏ các vết ố răng.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p><p>Dùng để chải răng ít nhất 2 lần mỗi ngày.</p><p><strong>Đối tượng sử dụng</strong></p><p>Dùng cho trẻ em.</p>",
        "specification": "Hộp",
        "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
        "registNum": "TCCS 04:2021/PG",
        "brand": "Oral-B",
        "producer": "BRAUN",
        "manufactor": "Trung Quốc",
        "legalDeclaration": "",
        "faq": [
          {
            "answer": "Bàn chải điện trẻ em Oral-B Vitality D12 Disney Frozen làm sạch và bảo vệ nướu vượt trội. Trải nghiệm bàn chải điện Oral-B được nha sĩ khuyên dùng đầu tiên trên toàn thế giới. Lông bàn chải đặc biệt mềm, phù hợp với khuôn miệng nhạy cảm. Giúp đánh bay các mảng bám, vi khuẩn tốt hơn rất nhiều lần so với bàn chải đánh răng thủ công thông thường.",
            "question": "Tại sao nên dùng bàn chải điện trẻ em Oral-B Vitality D12 Disney Frozen?"
          },
          {
            "answer": "Bàn chải điện trẻ em Oral-B Vitality D12 Disney Frozen trang bị chức năng vận hành mạnh mẽ nhờ hệ thống làm sạch 2D chuyển động xoay dao động với tần số rung 7.600 vòng xoay/phút, cung cấp hiệu suất làm sạch nâng cao.",
            "question": "Chức năng vận hành 2D của bàn chải điện trẻ em Oral-B Vitality D12 Disney Frozen là gì?"
          },
          {
            "answer": "Đầu bàn chải đánh răng trẻ em Oral-B Vitality D12 Disney Frozen có thể tháo rời ra khỏi thân và thay mới sau mỗi 3 tháng theo khuyến cáo của các chuyên gia răng miệng. Bạn chỉ cần mua đầu chải răng để lắp vào thân máy cũ cho bé, giúp tiết kiệm chi phí trong thời gian sử dụng.",
            "question": "Bàn chải đánh răng trẻ em Oral-B Vitality D12 Disney Frozen có thay đầu bàn chải được không?"
          },
          {
            "answer": "Bàn chải đánh răng trẻ em Oral-B Vitality D12 Disney Frozen không sử dụng cho trẻ dưới 3 tuổi. Trẻ nhỏ khi dùng bàn chải điện cần có sự đồng hành và hướng dẫn của người lớn.",
            "question": "Bàn chải đánh răng trẻ em Oral-B Vitality D12 Disney Frozen không được dùng cho đối tượng nào?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 62,
          "name": "Đồ dùng cho bé",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 37,
          "name": "BRAUN",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 916,
        "name": "Bàn chải điện Halio Sonic Whitening Toothbrush Pro Periwinkle Limited Editon làm trắng răng",
        "description": "Bàn chải điện làm trắng răng Halio Sonic Whitening Toothbrush Pro Periwinkle Limited Edition với công nghệ sóng âm Sonic hiện đại, giúp làm sạch răng một cách tối đa, hạn chế sự hình thành các mảng bám, ngăn ngừa những chứng bệnh răng miệng phổ biến như tụt nướu, chảy máu chân răng, viêm nha chu, hôi miệng,... Sản phẩm là phiên bản giới hạn với màu sắc độc đáo và mới lạ.",
        "price": "0",
        "category_id": 116,
        "supplier_id": 338,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500020_ban_chai_dien_lam_trang_rang_halio_sonic_whitening_toothbrush_pro_periwinkle_limited_editon_5308_6272_large_8f26827af1.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00212_075b7f4e1d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_04212_d9308525fc.png",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503164_ban_chai_danh_rang_dien_oral_b_vitality_crossaction_blue_8974_63c4_large_8c46c8e883.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501362_dau_chai_rang_nguoi_lon_oral_b_sensi_ultrathin_eb_60_2_2559_62e3_large_f9bf5a581c.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501361_dau_chai_rang_tre_em_oral_b_eb_10_2_k_3560_62e3_large_29e7973c14.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501356_ban_chai_danh_rang_nguoi_lon_oral_b_pro_health_db4510_dung_pin_4243_62e3_large_d2f30b63f5.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501355_ban_chai_danh_rang_tre_em_oral_b_stages_power_db4510k_dung_pin_4056_62e3_large_55fb1e2be9.jpg"
        ],
        "manufacturer": "PACIFIC TRADING GROUP INC",
        "usage": "<p><a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/ban-chai-dien\">Bàn chải điện</a> làm trắng răng Halio Sonic Whitening Toothbrush Pro Periwinkle Limited Edition làm sạch thức ăn thừa và mảng bám trên răng, mang lại hàm răng trắng sáng.</p><p>Ngăn ngừa các bệnh về răng miệng như tụt nướu, chảy máu chân răng, viêm nha chu, hôi miệng,...</p><p>Êm dịu cho cả răng và nướu nhạy cảm.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p><p>Gắn đầu bàn chải, làm ướt bôi <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/kem-danh-rang\">kem đánh răng</a> và nhấn nút nguồn để khởi động máy.</p><p>Đặt bàn chải vào răng viền nướu. Chọn chế độ (có 5 chế độ) phù hợp.</p><p>White: Loại bỏ mảng bám, làm sáng mặt trước răng.</p><p>Clean: Dùng cho răng nướu nhạy cảm, sử dụng hàng ngày.</p><p>Polish: Làm sáng và bóng răng.</p><p>Massage: Massage lợi luôn chắc khỏe (sử dụng 1 - 2 lần/tuần).</p><p>Sensitive: Sức rung mạnh dần, phù hợp cho người mới sử dụng.</p><p>Di chuyển đầu bàn chải giữa kẽ răng với động tác lên xuống. Dùng lực rung từ bàn chải, không đè đầu bàn chải lên răng.</p><p><strong>Đối tượng sử dụng</strong></p><p>Bàn chải điện làm trắng răng Halio Sonic Whitening Toothbrush Pro Periwinkle Limited Edition dùng được cho mọi đối tượng.</p>",
        "specification": "Hộp",
        "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
        "registNum": "TCCS 05:2022/SACHI",
        "brand": "HALIO",
        "producer": "PACIFIC TRADING GROUP INC",
        "manufactor": "Trung Quốc",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "Sản phẩm sẽ được bảo hành 1 năm&nbsp;tính từ ngày mua sản phẩm.Sản phẩm được bảo hành 01 ĐỔI 01 nếu đảm bảo tất cả các điều kiện sau:Sản phẩm bị lỗi kỹ thuật do phía Nhà sản xuất.Thời hạn bảo hành sản phẩm vẫn còn hiệu lực.Mã bảo hành còn nguyên vẹn, có hóa đơn mua hàng hoặc có thông tin khách hàng trên hệ thống của nhà phân phối của Halio Việt Nam.Sản phẩm bảo hành phải có đầy đủ máy, hộp, cáp sạc (nếu có) và các phụ kiện đi kèm.Khách hàng lưu ý giữ lại mã bảo hành của máy, máy, hộp và dây sạc cùng&nbsp;đầy đủ các phụ kiện khác của máy để được bảo hành. Halio Việt Nam sẽ từ chối bảo hành nếu không đủ phụ kiện kèm theo và máy bị hư hỏng do có tác động ngoại lực.",
            "question": "Thời gian bảo hành bàn chải điện Halio Sonic Whitening Toothbrush Pro Periwinkle Limited Edition là bao lâu?"
          },
          {
            "answer": "Theo khuyến c&aacute;o của c&aacute;c b&aacute;c sĩ tại Nha Khoa Quốc Tế Westcoast, phụ huynh kh&ocirc;ng n&ecirc;n cho trẻ dưới 7 tuổi sử dụng b&agrave;n chải điện v&igrave; đối với trẻ nhỏ, nướu răng vẫn c&ograve;n mềm yếu, dễ bị tổn thương sẽ kh&ocirc;ng chịu được tốc độ quay nhanh của b&agrave;n chải. Trẻ thường dễ mắc phải trường hợp cầm b&agrave;n chải t&igrave; mạnh v&agrave;o 1 chỗ tr&ecirc;n răng, l&acirc;u dần sẽ g&acirc;y m&ograve;n răng v&agrave; tổn thương đến nướu.",
            "question": "Trẻ em có nên dùng bàn chải điện Halio Sonic Whitening Toothbrush Pro Periwinkle Limited Edition hay không?"
          },
          {
            "answer": "Bàn chải điện Halio Sonic Whitening Toothbrush Pro Periwinkle Limited Edition có những ưu điểm:Công nghệ sóng âm Sonic hiện đại, giúp làm sạch răng một cách tối đa.Ngăn ngừa những chứng bệnh liên quan đến sức khỏe răng miệng.Phù hợp cho cả răng và nướu nhạy cảm.Bàn chải có màu Periwinkle thời trang và hiện đại,&nbsp;là phiên bản giới hạn với thiết kế thời thượng.Sản phẩm tích hợp 5 chế độ làm sạch&nbsp;phù hợp với nhiều nhu cầu.",
            "question": "Bàn chải điện Halio Sonic Whitening Toothbrush Pro Periwinkle Limited Edition có ưu điểm gì?"
          },
          {
            "answer": "Bàn chải đánh răng điện được Hội Nha khoa Hoa Kỳ kiểm định và khuyên dùng. Bàn chải đánh răng điện là giải pháp chăm sóc răng miệng&nbsp;cho&nbsp;tình trạng nướu nhạy cảm, người có tật về tay, phù hợp cho các bé và rất an toàn. Ngoài ra, nó còn hạn chế hình thành cao răng, cải thiện vấn đề về răng miệng. Bàn chải đánh răng điện là một sản phẩm chứa nhiều lợi ích giúp tiết kiệm thời gian đến nha khoa của bạn mà vẫn đem lại cho bạn nụ cười rạng rỡ mỗi ngày.",
            "question": "Bàn chải điện mang lại hiệu quả cao như thế nào?"
          },
          {
            "answer": "B&agrave;n chải điện về cấu tạo gần như kh&ocirc;ng kh&aacute;c b&agrave;n chải thường, cũng gồm một c&aacute;n cầm v&agrave; phần đầu để chải sạch c&aacute;c mảng b&aacute;m tr&ecirc;n răng. Kh&aacute;c biệt duy nhất l&agrave; trong th&acirc;n m&aacute;y sẽ c&oacute; lắp c&aacute;c mạch điện tử để gi&uacute;p phần đầu b&agrave;n chải tự xoay, từ đ&oacute; người d&ugrave;ng chỉ cần đưa b&agrave;n chải v&agrave;o miệng l&agrave; b&agrave;n chải sẽ tự động di chuyển để l&agrave;m sạch răng.",
            "question": "Bàn chải điện khác gì bàn chải thường?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 116,
          "name": "Bàn chải điện",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 338,
          "name": "PACIFIC TRADING GROUP INC",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 917,
        "name": "Bàn chải điện làm trắng răng Halio Sonic Whitening Toothbrush Pro Rose Gold",
        "description": "Bàn chải điện Halio Sonic Whitening Toothbrush Pro Rose Gold với công nghệ sóng âm Sonic hiện đại, giúp làm sạch răng một cách tối đa, hạn chế sự hình thành các mảng bám, ngăn ngừa những chứng bệnh răng miệng phổ biến như tụt nướu, chảy máu chân răng, viêm nha chu, hôi miệng,...",
        "price": "0",
        "category_id": 116,
        "supplier_id": 338,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500019_ban_chai_dien_lam_trang_rang_halio_sonic_whitening_toothbrush_pro_rose_gold_2050_6271_large_d933b6ca16.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00212_075b7f4e1d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_04212_d9308525fc.png",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503164_ban_chai_danh_rang_dien_oral_b_vitality_crossaction_blue_8974_63c4_large_8c46c8e883.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501362_dau_chai_rang_nguoi_lon_oral_b_sensi_ultrathin_eb_60_2_2559_62e3_large_f9bf5a581c.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501361_dau_chai_rang_tre_em_oral_b_eb_10_2_k_3560_62e3_large_29e7973c14.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501356_ban_chai_danh_rang_nguoi_lon_oral_b_pro_health_db4510_dung_pin_4243_62e3_large_d2f30b63f5.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501355_ban_chai_danh_rang_tre_em_oral_b_stages_power_db4510k_dung_pin_4056_62e3_large_55fb1e2be9.jpg"
        ],
        "manufacturer": "PACIFIC TRADING GROUP INC",
        "usage": "<p>Bàn chải điện làm trắng răng Halio Sonic Whitening Toothbrush Pro Rose Gold làm sạch thức ăn thừa và mảng bám trên răng, mang lại hàm răng trắng sáng.</p><p>Ngăn ngừa các bệnh về răng miệng như tụt nướu, chảy máu chân răng, <a href=\"https://nhathuoclongchau.com.vn/benh/viem-nha-chu-1154.html\">viêm nha chu</a>, hôi miệng,...</p><p>Êm dịu cho cả răng và nướu nhạy cảm.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p><p>Gắn đầu bàn chải, làm ướt bôi kem đánh răng và nhấn nút nguồn để khởi động máy.</p><p>Đặt bàn chải vào răng viền nướu. Chọn chế độ (có 5 chế độ) phù hợp.</p><p>White: Loại bỏ mảng bám, làm sáng mặt trước răng.</p><p>Clean: Dùng cho răng nướu nhạy cảm, sử dụng hàng ngày.</p><p>Polish: Làm sáng và bóng răng.</p><p>Massage: Massage lợi luôn chắc khỏe (sử dụng 1 - 2 lần/tuần).</p><p>Sensitive: Sức rung mạnh dần, phù hợp cho người mới sử dụng.</p><p>Di chuyển đầu bàn chải giữa kẽ răng với động tác lên xuống. Dùng lực rung từ bàn chải, không đè đầu bàn chải lên răng.</p><p><strong>Đối tượng sử dụng</strong></p><p>Bàn chải điện Halio dùng được cho mọi đối tượng.</p>",
        "specification": "Hộp",
        "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
        "registNum": "TCCS 05:2022/SACHI",
        "brand": "HALIO",
        "producer": "PACIFIC TRADING GROUP INC",
        "manufactor": "Trung Quốc",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "Cũng như c&aacute;c loại b&agrave;n chải răng th&ocirc;ng thường kh&aacute;c, n&ecirc;n thay đầu b&agrave;n chải điện Halio Sonic Whitening Toothbrush Pro Rose Gold sau mỗi 3 th&aacute;ng sử dụng, để đảm bảo hiệu quả sử dụng sản phẩm. Đối với những người đang đeo c&aacute;c loại kh&iacute; cụ chỉnh nha, n&ecirc;n thay đầu b&agrave;n chải sau mỗi 2 th&aacute;ng. Nếu bạn vừa trải qua đợt c&uacute;m m&ugrave;a hoặc cảm sốt v&igrave; virus,&nbsp;n&ecirc;n thay đầu b&agrave;n chải để tr&aacute;nh bị t&aacute;i nhiễm bệnh do virus c&ograve;n t&iacute;ch tụ tr&ecirc;n sợi l&ocirc;ng.",
            "question": "Bao lâu thì nên thay đầu bàn chải điện Halio Sonic Whitening Toothbrush Pro Rose Gold?"
          },
          {
            "answer": "Sản phẩm d&ugrave;ng được cho răng nhạy cảm, với c&aacute;c trường hợp gặp c&aacute;c bệnh về nướu trong v&ograve;ng 2 th&aacute;ng cần đến nha sĩ tư vấn trước khi d&ugrave;ng.",
            "question": "Dùng bàn chải điện Halio Sonic Whitening Toothbrush Pro Rose Gold cho răng nhạy cảm được không?"
          },
          {
            "answer": "B&agrave;n chải d&ugrave;ng cho tất cả mọi người, những ai quan t&acirc;m đến sức khỏe răng miệng của m&igrave;nh v&agrave; đang t&igrave;m kiếm một b&agrave;n chải điện đ&atilde; được nghi&ecirc;n cứu v&agrave; ph&aacute;t triển bởi c&aacute;c chuy&ecirc;n gia để đảm bảo trải nghiệm chải răng &ecirc;m &aacute;i v&agrave; hiệu quả nhất. Với đầu b&agrave;n chải độc đ&aacute;o, Halio Sonic Whitening Toothbrush Pro Rose Gold l&agrave; thiết bị chăm s&oacute;c răng miệng&nbsp;ho&agrave;n hảo cho những người đang niềng răng hoặc cấy gh&eacute;p implant. Ngo&agrave;i ra, Halio Sonic Whitening Toothbrush Pro Rose Gold cũng l&agrave; d&ograve;ng sản phẩm ph&ugrave; hợp cho những người bị hạn chế hoạt động do bệnh l&yacute;.",
            "question": "Ai có thể sử dụng bàn chải điện Halio Sonic Whitening Toothbrush Pro Rose Gold?"
          },
          {
            "answer": "B&agrave;n chải điện d&ugrave;ng để đ&aacute;nh răng c&oacute; cấu tạo gồm phần th&acirc;n chứa nguồn điện v&agrave; phần đầu chứa l&ocirc;ng b&agrave;n chải được thiết kế rời, để bạn c&oacute; thể thay thế phần đầu kh&aacute;c. B&ecirc;n cạnh đ&oacute;, ch&uacute;ng c&ograve;n c&oacute; bộ đếm thời gian. Như c&aacute;c loại b&agrave;n chải bằng tay kh&aacute;c, b&agrave;n chải điện gi&uacute;p lấy đi những&nbsp;mảng b&aacute;m tr&ecirc;n răng, ph&ograve;ng ngừa s&acirc;u răng, giảm nguy cơ mắc c&aacute;c bệnh li&ecirc;n quan đến răng miệng.",
            "question": "Bàn chải điện là gì?"
          },
          {
            "answer": "Thời gian đ&aacute;nh răng cũng ảnh hưởng kh&aacute; nhiều đến sức khỏe răng miệng của bạn. Theo c&aacute;c chuy&ecirc;n gia về nha khoa, thời gian đ&aacute;nh răng trong v&ograve;ng 2 ph&uacute;t l&agrave; hợp l&yacute; nhất. Nếu &iacute;t hơn sẽ kh&ocirc;ng đủ l&agrave;m sạch răng, c&ograve;n nếu nhiều hơn sẽ g&acirc;y b&agrave;o m&ograve;n ch&acirc;n răng v&agrave; men răng.",
            "question": "Thời gian đánh răng bao lâu là hợp lý?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 116,
          "name": "Bàn chải điện",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 338,
          "name": "PACIFIC TRADING GROUP INC",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 907,
        "name": "Bàn chải điện Oral-B Vitality Ultrathin D12.513 giúp làm sạch mảng bám trên răng, loại bỏ các vết ố răng",
        "description": "Bàn chải đánh răng điện Oral-B Vitality Ultrathin D12.513 được trang bị lông bàn chải Ultra Thin siêu mềm, không gây tổn thương cho nướu. Sản phẩm đạt tới tốc độ xoay 7600/phút và 300 nhịp đập/phút, lông bàn chải hình trụ tròn, có thể lách sâu vào từng kẽ răng, giúp loại bỏ mảng bám, giữ khoang miệng được sạch sẽ.",
        "price": "499500",
        "category_id": 116,
        "supplier_id": 37,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00212_075b7f4e1d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_04212_d9308525fc.png",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503164_ban_chai_danh_rang_dien_oral_b_vitality_crossaction_blue_8974_63c4_large_8c46c8e883.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501362_dau_chai_rang_nguoi_lon_oral_b_sensi_ultrathin_eb_60_2_2559_62e3_large_f9bf5a581c.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501361_dau_chai_rang_tre_em_oral_b_eb_10_2_k_3560_62e3_large_29e7973c14.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501356_ban_chai_danh_rang_nguoi_lon_oral_b_pro_health_db4510_dung_pin_4243_62e3_large_d2f30b63f5.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00501355_ban_chai_danh_rang_tre_em_oral_b_stages_power_db4510k_dung_pin_4056_62e3_large_55fb1e2be9.jpg"
        ],
        "manufacturer": "BRAUN",
        "usage": "<p>Bàn chải đánh răng điện <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/ban-chai-danh-rang-dien-oral-b-vitality-ultrathin-d12-513.html\">Oral-B Vitality Ultrathin D12.513</a> có thiết kế đầu bàn chải thích hợp, giúp làm&nbsp;sạch mảng bám trên răng một cách toàn diện, loại bỏ các vết ố răng, cải thiện sức khỏe của nướu.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p><p><i>Sạc&nbsp;và vận hành máy:</i></p><p><a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/ban-chai-dien\">Bàn chải điện</a> được thiết kế có tay cầm chống nước, an toàn về điện và có thể sử dụng trong phòng tắm.</p><ul><li>Cắm ổ sạc vào ổ cắm điện. Đặt thân bàn chải vào bộ phận sạc.</li><li>Một lần sạc mất khoảng 16 giờ và dùng được tới 8 ngày (hai lần một ngày, 2 phút).</li><li>Để sử dụng hàng ngày, thân bàn chải điện có thể được lưu trữ trên bộ sạc để đảm bảo luôn trong tình trạng đầy pin. Hãy yên tâm vì sẽ không xảy ra trường hợp pin bị quá tải.</li></ul><p><i>Sử dụng bàn chải điện:</i></p><ul><li>Làm ướt đầu bàn chải và cho kem đánh răng lên. Để tránh <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/kem-danh-rang\">kem đánh răng</a> bị bắn tung tóe, hãy đặt đầu bàn chải lên răng của bạn trước khi bật máy.</li><li>Chải từ từ từng chiếc răng một, dành vài giây cho mỗi bề mặt răng.</li><li>Bắt đầu chải bên ngoài, sau đó là bên trong và cuối cùng là bề mặt nhai. Chải tất cả bốn góc phần tư của miệng của bạn như nhau. Bạn cũng có thể tham khảo ý kiến ​​nha sĩ hoặc vệ sinh nha khoa về kỹ thuật phù hợp với bạn.</li></ul><p><i>*Lưu ý:</i></p><ul><li>Chải răng chậm từng cái răng một, từ ngoài vào trong, cuối cùng là bề mặt nhai. Không nên ấn bàn chải lên răng quá mạnh, dành một vài giây trên mỗi bề mặt răng.</li><li>Với bất kỳ đầu bàn chải nào, hãy bắt đầu chải bên ngoài, sau đó là mặt trong và cuối cùng là bề mặt nhai. Chải tất cả bốn góc phần tư của miệng.</li><li>Không nên sử dụng lực quá mạnh, chỉ cần để bàn chải <a href=\"https://nhathuoclongchau.com.vn/thuong-hieu/oral-b\">Oral B</a> làm công việc của nó. Chải ít nhất 2 phút để&nbsp;loại bỏ triệt để mảng bám.</li><li>Trong ngày đầu tiên sử dụng, nướu có thể chảy máu nhẹ. Nếu tình trạng cháy máu kéo dài trong 2 tuần, hãy liện hệ với nha sĩ để được tư vấn và chăm sóc.</li></ul><p><i>Hướng dẫn vệ sinh bàn chải điện Oral-B Vitality:</i></p><ul><li>Sau khi sử dụng, vệ sinh đầu bàn chải trực tiếp dưới vòi nước đang chảy.</li><li>Tháo đầu bàn chải và thân bàn chải tách rời nhau, rửa sạch và để khô.</li><li>Thỉnh thoảng, dùng khăn ẩm để lau các bộ phận của bàn chải.</li><li>Không được đặt bộ sạc trong nước. Giá đỡ bàn chải an toàn với máy rửa chén.</li></ul><p><strong>Đối tượng sử dụng</strong></p><p>Dùng cho người lớn.</p>",
        "specification": "Hộp",
        "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
        "registNum": "TCCS 04:2021/PG",
        "brand": "Oral-B",
        "producer": "BRAUN",
        "manufactor": "Trung Quốc",
        "legalDeclaration": "",
        "faq": [
          {
            "answer": "Cứ khoảng 1 tuần bạn cần sạc điện 1 lần cho bàn chải đánh răng điện Oral-B Vitality Ultrathin D12.513. Máy này không có đèn báo sạc. Khi thấy bàn chải quay yếu hơn thì là sắp hết pin.",
            "question": "Bàn chải đánh răng điện Oral-B Vitality Ultrathin D12.513 có đèn báo hết pin không?"
          },
          {
            "answer": "Bàn chải đánh răng điện Oral-B Vitality Ultrathin D12.513 trang bị chức năng vận hành 2D với chuyển động lắc và xoay tốc độ cao 7600 vòng/1 phút – 300 nhịp đập/1 phút, loại bỏ mảng bám trên răng toàn diện và dễ dàng hơn.",
            "question": "Chức năng vận hành 2D của bàn chải đánh răng điện Oral-B Vitality Ultrathin D12.513 là gì?"
          },
          {
            "answer": "Để sạc đầy pin thường mất 16 giờ và thời gian sử dụng cho phép là khoảng 8 ngày.",
            "question": "Mất bao lâu để sạc đầy bàn chải đánh răng điện Oral-B Vitality Ultrathin D12.513?"
          },
          {
            "answer": "Cần thay (đầu) bàn chải đánh răng điện Oral-B Vitality Ultrathin D12.5133 khi màu chỉ thị trên lông mờ đi một nửa hoặc sau 3 tháng một lần (sớm hơn nếu bị mòn).",
            "question": "Khi nào cần thay đầu bàn chải đánh răng điện Oral-B Vitality Ultrathin D12.513?"
          },
          {
            "answer": "Bàn chải đánh răng điện Oral-B Vitality Ultrathin D12.513 không sử dụng cho trẻ dưới 3 tuổi. Khi dùng cho trẻ em, cần có sự hỗ trợ và hướng dẫn từ người lớn.",
            "question": "Bàn chải đánh răng điện Oral-B Vitality Ultrathin D12.513 có dùng cho trẻ em được không?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 116,
          "name": "Bàn chải điện",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 37,
          "name": "BRAUN",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 525,
        "name": "Băng cá nhân độ dính cao, co giãn tốt Urgo Family size 2cm x 6cm bảo vệ các vết thương nhỏ (10 miếng)",
        "description": "Urgo Family là băng cá nhân dạng gói dành cho gia đình với 2 loại: Băng cá nhân nền vải co giãn tốt, độ dính cao trên mọi vị trí, kể cả những vị trí khó và băng cá nhân không thấm nước. Sản phẩm tiện lợi để mang theo và lưu trữ.",
        "price": "16000",
        "category_id": 68,
        "supplier_id": 268,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 9,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0096_5c029ed8e7.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00021304_bang_keo_ca_nhan_kids_band_pororo_4_size_20_mieng_8299_5f7f_large_e169f8e923.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00021303_bang_keo_ca_nhan_kids_band_pororo_1_size_72mm_x_18mm_20_mieng_6312_5f7f_large_d83f53724d.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_5284_5c167dc646.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_5296_dae3dc668d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00030072_bang_keo_ca_nhan_trong_suot_ace_band_stransparent_72x18mm_1417_62b5_large_90ad18acb3.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00030073_bang_keo_ca_nhan_vai_ace_band_f_72x18mm_2061_62b5_large_be85353e18.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00030074_bang_keo_ca_nhan_khong_tham_nuoc_waterproof_plaster_4640_62b9_large_b016a0e7dc.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00030077_bang_gac_vo_trung_young_wound_dressing_6x7cm_4945_6425_large_e2438bc894.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00031339_gac_tam_con_quick_nurse_6x3cm_hop_100_mieng_1489_62b5_large_b6f3b192c8.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00030078_bang_gac_vo_trung_young_wound_dressing_6x10cm_4134_6055_large_e19cac7df2.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_04545_3ac012c775.jpg"
        ],
        "manufacturer": "URGO",
        "usage": "<p>Urgo Family được chỉ định dùng bảo vệ các vết thương nhỏ, vết trầy xước, rách da, vết kim đâm.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p><p>Làm vệ sinh da và lau khô trước khi dán băng.&nbsp;</p><p>Thay băng hàng ngày.</p><p><strong>Đối tượng sử dụng</strong></p><p>Thích hợp dùng cho mọi người có vết thương nhỏ,&nbsp;vết cắt, <a href=\"https://nhathuoclongchau.com.vn/bai-viet/cach-xu-ly-vet-tray-xuoc-da-tai-nha-58145.html\">vết trầy xước</a>…</p>",
        "specification": "Gói 10 Miếng",
        "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ sản phẩm.</p>",
        "registNum": "170000206/PCBA-HCM",
        "brand": "Urgo",
        "producer": "URGO",
        "manufactor": "Pháp",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "Việc miếng băng sau khi sử dụng bị dính vào vết thương là khá phổ biến. Đối với cả trẻ em lẫn người lớn, cách tốt nhất để xử lý khi băng cá nhân, gạc y tế bị dính vào vết thương, đó là hãy thấm một ít nước muối sinh lý lên băng, băng sẽ từ từ mềm ra và dễ gỡ hơn.",
            "question": "Làm sao tháo băng vết thương không bị đau?"
          },
          {
            "answer": "Urgo&nbsp;Family gồm 2 loại: Băng cá nhân nền vải co giãn tốt, độ dính cao trên mọi vị trí, kể cả những vị trí khó và băng cá nhân ít thấm nước, thích hợp dùng cho vết thương nhỏ trong gia đình. Sản phẩm dạng gói, dễ mang theo và lưu trữ, luôn bên bạn mọi lúc, mọi nơi.",
            "question": "Vì sao nên chọn Urgo Family?"
          },
          {
            "answer": "Theo thông tin từ urgo.vn, nên thay băng ít nhất hai lần một ngày.",
            "question": "Thay băng Urgo Family ít nhất mấy lần một ngày?"
          },
          {
            "answer": "Băng cá nhân bằng polyethylene hợp màu da, ít thấm nước, lỗ thông lớn, độ dính cao, số lượng 5 miếng và kích thước 2 x 7.2cm. Gạc màu trắng phủ bởi lớp lưới polyethylene không gây dính giúp thay băng không đau.",
            "question": "Băng cá nhân ít thấm nước của Urgo Family có đặc điểm gì?"
          },
          {
            "answer": "Băng cá nhân bằng vải co giãn tốt, thông thoáng, số lượng 5 miếng và kích thước 2.0cm x 6.0cm. Gạc màu trắng phủ bởi lớp lưới polyethylene không gây dính giúp thay băng không đau.",
            "question": "Băng cá nhân độ dính cao của Urgo Family có đặc điểm gì?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 68,
          "name": "Băng y tế",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 268,
          "name": "URGO",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 9,
          "name": "Gói"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 101,
      "totalRecords": 1006
    }
  }
}
```

---

### Get Product By ID

- **Endpoint**: `GET /products/1`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Máy xung điện trị liệu Omron HV-F013 giảm đau cơ và khớp",
    "description": "Máy massage xung điện trị liệu Omron HV-F013 là giải pháp trị liệu bằng xung điện tại nhà đơn giản, nhỏ gọn, dễ sử dụng với 5 chế độ massage giúp giảm đau cơ và khớp mọi lúc mọi nơi.",
    "price": "6000",
    "category_id": 1,
    "supplier_id": 1,
    "image_url": null,
    "prescription_required": false,
    "created_at": "2025-09-30T05:22:18.892Z",
    "updated_at": "2025-09-30T05:22:18.892Z",
    "tax_fee": "0",
    "base_unit_id": 1,
    "images": [
      "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
      "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
      "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
      "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
      "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
      "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
      "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
      "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
      "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
    ],
    "manufacturer": "OMRON HEALTHCARE MANUFACTURING VN",
    "usage": "<p>Máy xung điện trị liệu Omron HV-F013 sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:</p><ul><li>Chặn cơn đau.</li><li>Kích hoạt giải phóng endorphin (như thuốc giảm đau tự nhiên).</li><li>Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).</li></ul>",
    "dosage": "<p><strong>Cách dùng</strong></p><p><i>Hướng dẫn đặt miếng dán (để trị liệu tối ưu):</i></p><ul><li>Đặt các miếng dán trên mỗi phía bị đau.</li><li>Phải sử dụng HAI MIẾNG DÁN.</li><li>Đặt các miếng dán cách chỗ đau ít nhất 2,5cm.</li><li>Không xếp chồng các miếng dán.</li><li>Không xịt, bôi thuốc hoặc kem lên da hoặc miếng dán.</li><li>Không dùng chung miếng dán.</li><li>Không di chuyển miếng dán sang vị trí khác khi máy vẫn bật.</li></ul><p><i>Bước 1:&nbsp;</i></p><p>Tắt máy, lắp pin: Đọc kỹ toàn bộ hướng dẫn sử dụng để đảm bảo an toàn và sử dụng đúng máy xung điện trị liệu này.</p><p><i>Bước 2:</i></p><p>Cắm dây vào phần bên dưới của máy và mỗi đầu dây còn lại được gắn với một miếng dán.</p><p><i>Bước 3:</i></p><p>Kiểm soát và đánh giá mức đau trước và sau trị liệu (là mức đau nhẹ đến 10 mức đau nhất). Đặt 2 miếng dán cách chỗ đau ít nhất 2,5cm. Không xếp chồng lên nhau. Để miếng dán trên vùng da sạch, khô và không bị thương tổn.</p><p><i>Bước 4:</i></p><ul><li>Ấn nút nguồn.</li><li>Ấn ▲ (lên) hoặc ▼ (xuống) để chọn 1 trong 5 chế độ. Không kết hợp được các chế độ với nhau.</li><li>Ấn nút Set Start (Cài đặt/Khởi động) để chọn chế độ. Máy sẽ bắt đầu liệu trình tại mức cường độ 1.</li></ul><p><i>Bước 5:</i></p><p>Ấn nút ▲ (lên) để tăng cường độ. Thiết lập cường độ cho cơn đau của bạn. Có đến 10 cường độ khác nhau.</p><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=SqX6iW4NbQY\"><iframe src=\"https://www.youtube.com/embed/SqX6iW4NbQY\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Người trưởng thành bị đau cấp tính hoặc mãn tính.</p>",
    "specification": "Hộp",
    "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
    "registNum": "240001004/PCBB-BYT",
    "brand": "OMRON",
    "producer": "OMRON HEALTHCARE MANUFACTURING VN",
    "manufactor": "Việt Nam",
    "legalDeclaration": null,
    "faq": [
      {
        "answer": "Ngừng sử dụng máy xung điện trị liệu Omron HV-F013 trong các trường hợp sau:Nếu bạn gặp phản ứng bất lợi (kích ứng da/đỏ/bỏng, đau đầu hoặc cảm giác đau đớn khác, hoặc nếu bạn cảm thấy bất thường khó chịu).Nếu cơn đau của bạn không cải thiện, trở nên nghiêm trọng mãn tính và nặng hơn, hoặc kéo dài trong hơn năm ngày.",
        "question": "Khi nào ngừng sử dụng máy xung điện trị liệu Omron HV-F013?"
      },
      {
        "answer": "Bắt đầu bằng một liệu trình 15 phút. Phải luôn tắt máy khi miếng dán vẫn đang còn lắp trên máy. Đánh giá cơn đau để kiểm tra xem có cải thiện hay không. Dừng điều trị nếu cơn đau đã giảm hoặc hết hẳn. Ấn nút nguồn để tiếp tục liệu trình 15 phút tiếp theo.",
        "question": "Nên sử dụng máy xung điện trị liệu Omron HV-F013 trong bao lâu?"
      },
      {
        "answer": "Sử dụng ngay khi bạn thấy đau. Bắt đầu sử dụng máy với 1 liệu trình (máy sẽ tự động tắt sau 15 phút). Hãy sử dụng máy để điều trị chỗ đau sớm để ngăn ngừa cơn đau trở nên tồi tệ hơn, hoặc thậm chí là trở thành bệnh mãn tính. Bạn nên kiểm soát chỗ đau sớm hơn để nó không đạt đến ngưỡng chịu đau cao, dẫn tới hạn chế các hoạt động hàng ngày của bạn.",
        "question": "Khi nào nên bắt đầu dùng máy xung điện trị liệu Omron HV-F013?"
      },
      {
        "answer": "Sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:Chặn cơn đau.Kích hoạt giải phóng endorphin (bằng thuốc giảm đau tự nhiên).Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).",
        "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 có tính năng gì?"
      },
      {
        "answer": "TENS (xung điện trị liệu kích thích thần kinh) là liệu pháp sử dụng các điện cực được đặt trên da để kích thích các dây thần kinh dưới da xung quanh giúp giảm đau, được các nhà vật lý trị liệu sử dụng trong vòng hơn 30 năm qua.",
        "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 là gì?"
      }
    ],
    "sold_count": 5,
    "categories": {
      "id": 1,
      "name": "Máy massage",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    "suppliers": {
      "id": 1,
      "name": "OMRON HEALTHCARE MANUFACTURING VN",
      "contact_info": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    "unittype": {
      "id": 1,
      "name": "Hộp"
    },
    "productunits": [
      {
        "id": 1,
        "product_id": 1,
        "unit_name": "Hộp",
        "conversion_factor": "1",
        "price": "25000",
        "created_at": "2025-10-15T16:00:07.037Z",
        "updated_at": "2025-10-15T16:00:07.037Z"
      },
      {
        "id": 2,
        "product_id": 1,
        "unit_name": "Viên",
        "conversion_factor": "10",
        "price": "2500",
        "created_at": "2025-10-15T16:00:07.037Z",
        "updated_at": "2025-10-15T16:00:07.037Z"
      }
    ]
  }
}
```

---

### Search Products

- **Endpoint**: `GET /products/search?keyword=thuốc&page=1&limit=5`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 527,
        "name": "Băng keo cá nhân in hình Pororo Kids Band 72mm x 18mm Young Chemical bảo vệ vết thương dành cho trẻ nhỏ (20 miếng)",
        "description": "Băng Keo Cá Nhân Kids Band (Pororo) là dòng sản phẩm dành cho trẻ nhỏ và đối tượng người dùng có da nhạy cảm phân phối dành cho thị trường Việt Nam. Bề mặt sản phẩm được in hình nhận vật hoạt hình Pororo dễ thương, đi kèm với vải băng gạc có chứa Benzalkonium giúp mau làm lành vết thương. Đây là sản phẩm mà các bậc phụ huynh nên cân nhắc bổ sung cho tủ thuốc – dụng cụ y tế gia đình mình.",
        "price": "27000",
        "category_id": 68,
        "supplier_id": 269,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00021303_bang_keo_ca_nhan_kids_band_pororo_1_size_72mm_x_18mm_20_mieng_6312_5f7f_large_d83f53724d.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0096_5c029ed8e7.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00021304_bang_keo_ca_nhan_kids_band_pororo_4_size_20_mieng_8299_5f7f_large_e169f8e923.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_5284_5c167dc646.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_5296_dae3dc668d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00030072_bang_keo_ca_nhan_trong_suot_ace_band_stransparent_72x18mm_1417_62b5_large_90ad18acb3.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00030073_bang_keo_ca_nhan_vai_ace_band_f_72x18mm_2061_62b5_large_be85353e18.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00030074_bang_keo_ca_nhan_khong_tham_nuoc_waterproof_plaster_4640_62b9_large_b016a0e7dc.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00030077_bang_gac_vo_trung_young_wound_dressing_6x7cm_4945_6425_large_e2438bc894.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00031339_gac_tam_con_quick_nurse_6x3cm_hop_100_mieng_1489_62b5_large_b6f3b192c8.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00030078_bang_gac_vo_trung_young_wound_dressing_6x10cm_4134_6055_large_e19cac7df2.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_04545_3ac012c775.jpg"
        ],
        "manufacturer": "CÔNG TY TNHH YOUNG CHEMICAL VINA",
        "usage": "<p>Sử dụng để bảo vệ vết thương hở nhỏ, vết cắt, vết thương bị trầy xước,…</p>",
        "dosage": "<p><strong>Cách dùng</strong></p>\n\n<p>Bước 1: Dùng miếng bông tẩm cồn trong hộp để sát trùng vết thương.</p>\n\n<p>Bước 2: Dán băng keo cá nhân vào vết thương đã được tiệt trùng, thay băng dán khi cần thiết.</p>\n\n<p><strong>Đối tượng sử dụng</strong></p>\n\n<p>Dùng được cho mọi đối tượng.</p>",
        "specification": "Hộp",
        "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
        "registNum": "190000005/PCBA-LA",
        "brand": "YOUNG CHEMICAL",
        "producer": "CÔNG TY TNHH YOUNG CHEMICAL VINA",
        "manufactor": "Việt Nam",
        "legalDeclaration": "",
        "faq": [
          {
            "answer": "Sản phẩm nên được bảo quản ở nơi khô ráo, thoáng mát và tránh ánh nắng trực tiếp.",
            "question": "Nên bảo quản Băng Keo Cá Nhân Pororo Kids Band ở đâu?"
          },
          {
            "answer": "Không sử dụng băng keo này cho vết thương hở lớn, khu vực vùng mắt, hoặc vết thương do động vật cắn.",
            "question": "Có những lưu ý quan trọng nào khi sử dụng sản phẩm này?"
          },
          {
            "answer": "Đầu tiên, sát trùng vết thương bằng miếng bông tẩm cồn. Sau đó, dán băng keo cá nhân vào vết thương đã được tiệt trùng. Thay băng dán khi cần thiết.",
            "question": "Cách sử dụng Băng Keo Cá Nhân Pororo Kids Band như thế nào?"
          },
          {
            "answer": "Sản phẩm được sử dụng để bảo vệ các vết thương hở nhỏ, vết cắt, và vết trầy xước để tránh nhiễm khuẩn, giúp vết thương mau lành hơn.",
            "question": "Công dụng của Băng Keo Cá Nhân Pororo Kids Band là gì?"
          },
          {
            "answer": "Các thành phần chính bao gồm Băng: Polyvinyl clorua in hình Pororo; Gạc: Vải không dệt màu trắng; Keo: Acrylic. Gạc còn chứa Benzalkonium giúp mau làm lành vết thương.",
            "question": "Chất liệu chính của Băng Keo Cá Nhân Pororo Kids Band là gì?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 68,
          "name": "Băng y tế",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 269,
          "name": "CÔNG TY TNHH YOUNG CHEMICAL VINA",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 1022,
        "name": "bbbbbb",
        "description": "Thuốc giảm đau, hạ sốt",
        "price": "15000",
        "category_id": 2,
        "supplier_id": 2,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-11-20T12:50:33.784Z",
        "updated_at": "2025-11-20T12:50:33.784Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://example.com/image1.jpg"
        ],
        "manufacturer": "Công ty Dược ABC",
        "usage": "Uống sau bữa ăn",
        "dosage": "1-2 viên/lần, 3 lần/ngày",
        "specification": "Hộp 10 vỉ x 10 viên",
        "adverseEffect": null,
        "registNum": null,
        "brand": "Paracetamol",
        "producer": null,
        "manufactor": null,
        "legalDeclaration": null,
        "faq": null,
        "sold_count": 0,
        "categories": {
          "id": 2,
          "name": "Kem hỗ trợ giảm mụn, gel hỗ trợ giảm mụn",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 2,
          "name": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      },
      {
        "id": 546,
        "name": "Bông gòn viên y tế thấm nước Bảo Thạch dùng để làm sạch vết thương, thấm máu và dịch tiết (50g)",
        "description": "Bông gòn viên Bảo Thạch 50g được làm từ 100% bông tự nhiên, dùng để làm sạch vết thương, thấm máu và dịch tiết, để thấm thuốc và bôi lên vết thương, được sử dụng rộng rãi trong bệnh viện, phòng khám, trung tâm y tế, phòng nha khoa và nhà điều dưỡng...",
        "price": "19000",
        "category_id": 69,
        "supplier_id": 275,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 9,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_5145_7788a7384a.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00029577_bong_vien_niva_100_vien_7316_62ad_large_8e4aed993a.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500739_bong_y_te_quick_nurse_1kg_5805_62b3_large_72cd282c0d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500742_bong_y_te_quick_nurse_25g_2716_62b3_large_61ba07efb7.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500741_bong_y_te_quick_nurse_50g_8958_62b4_large_0931085f8b.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500740_bong_y_te_cat_mieng_quick_nurse_6x6_50g_8105_62b3_large_23ecb0ecfd.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500738_bong_y_te_quick_nurse_100g_8236_62b3_large_d33677c7ee.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_4832_4d663318ff.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_5127_32b3bd99ac.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00010665_gon_bach_tuyet_cat_san_zigzag_3563_62ae_large_719d6e78b4.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00017314_que_gon_20_que_bao_thach_6796_62ae_large_f2bc7d45d7.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00017885_bong_gac_dap_vet_thuong_bao_thach_8cm_x_12cm_6790_62ae_large_192c80b520.jpg"
        ],
        "manufacturer": "CÔNG TY CỔ PHẨN THIẾT BỊ Y TẾ BẢO THẠCH",
        "usage": "<p><a href=\"https://nhathuoclongchau.com.vn/trang-thiet-bi-y-te/bong-y-te\">Bông y tế</a> được dùng để làm sạch vết thương, thấm máu và dịch tiết.</p><p>Dùng để thấm thuốc và bôi lên vết thương.</p><p>Được sử dụng rộng rãi trong bệnh viện, phòng khám, trung tâm y tế, phòng nha khoa và nhà điều dưỡng.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p><p>Xé bao bì theo đường cắt sẵn</p><p>Dùng bông gòn để thấm máu và dịch, hoặc thấm bông với <a href=\"https://nhathuoclongchau.com.vn/bai-viet/nhung-loai-thuoc-sat-trung-vet-thuong-ho-pho-bien-hien-nay-58067.html\">thuốc sát trùng</a> để lau rửa vết thương.</p><p><strong>Đối tượng sử dụng</strong></p><p>Dùng được cho mọi đối tượng.</p>",
        "specification": "Gói",
        "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
        "registNum": "170000046/PCBA-BD",
        "brand": "Bảo Thạch",
        "producer": "CÔNG TY CỔ PHẨN THIẾT BỊ Y TẾ BẢO THẠCH",
        "manufactor": "Việt Nam",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "Bạn nên trang bị bông gòn viên y tế Bảo Thạch vì các ưu điểm nổi bật sau:Được làm từ 100% bông tự nhiên.Sản xuất theo tiêu chuẩn Dược Điển Việt Nam.Đường kính 2cm, 3cm.Đồng đều về kích thước và trọng lượng.Khả năng thấm hút cao và nhanh.Mịn màng, mềm mại, không gây kích ứng da.Thân thiện môi trường, bông trắng và sạch.",
            "question": "Tại sao nên dùng bông gòn viên y tế Bảo Thạch?"
          },
          {
            "answer": "Bông gòn viên y tế được đóng gói kín và có khả năng kháng khuẩn cao. Sử dụng gói bông còn nguyên, không bị xẹp, bị rách.Xé bao bì theo các đường cắt có sẵn.Sử dụng bông gòn viên y tế Bảo Thạch để cầm máu và dịch. Thẩm thấu bông với thuốc sát trùng để rửa vết thương.",
            "question": "Cách dùng bông gòn viên y tế Bảo Thạch như thế nào?"
          },
          {
            "answer": "Bông gòn viên y tế nên được bảo quản trong túi bóng kính kháng khuẩn. Nên cất giữ trong thùng hoặc tủ kính trên cao để đảm bảo không dính bụi bẩn. Tránh côn trùng, vi khuẩn xâm nhập và cắn xé gói bông.Bông gòn viên y tế nên được bảo quản ở những khu vực thoáng mát. Sau khi mở gói, không sử dụng hết nên gói kín lại để có thể sử dụng lại. Hạn chế các khu vực nhiều bụi bẩn dễ khiến bông bị ẩm mốc.Nên đặt bông gòn viên y tế ở những nơi khó tiếp xúc với ánh mặt trời.",
            "question": "Cần lưu ý điều gì khi dùng bông gòn viên y tế Bảo Thạch?"
          },
          {
            "answer": "Với tính kháng khuẩn tuyệt đối, bông gòn viên y tế Bảo Thạch hoàn toàn không chứa chất gây hại, đảm bảo lành tính với mọi đối tượng sử dụng.",
            "question": "Bông gòn viên y tế Bảo Thạch có an toàn khi sử dụng không?"
          },
          {
            "answer": "Bông gòn viên y tế Bảo Thạch là sản phẩm bông kháng khuẩn chuyên dụng được sử dụng trong y tế. Được chế tác từ 100% bông gòn tự nhiên. Bông Bảo Thạch có độ mềm mại và mịn đặc trưng phù hợp với ngành y tế.",
            "question": "Bông gòn viên y tế Bảo Thạch là loại bông gì?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 69,
          "name": "Bông y tế",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 275,
          "name": "CÔNG TY CỔ PHẨN THIẾT BỊ Y TẾ BẢO THẠCH",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 9,
          "name": "Gói"
        }
      },
      {
        "id": 537,
        "name": "Bông viên Niva YB2 dùng trong phòng khám, vệ sinh cá nhân, vệ sinh vết thương, tẩy trang (100 viên)",
        "description": "Bông viên Niva được làm từ 100% bông thiên nhiên​, có sợi sơ dài và chắc chắn nên khi sử dụng sẽ không bị đổ bụi. Sản phẩm được dùng để làm sạch vết thương, thấm máu và dịch tiết hoặc để thấm thuốc bôi lên vết thương.",
        "price": "32000",
        "category_id": 69,
        "supplier_id": 145,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 12,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00029577_bong_vien_niva_100_vien_7316_62ad_large_8e4aed993a.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500739_bong_y_te_quick_nurse_1kg_5805_62b3_large_72cd282c0d.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500742_bong_y_te_quick_nurse_25g_2716_62b3_large_61ba07efb7.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500741_bong_y_te_quick_nurse_50g_8958_62b4_large_0931085f8b.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500740_bong_y_te_cat_mieng_quick_nurse_6x6_50g_8105_62b3_large_23ecb0ecfd.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00500738_bong_y_te_quick_nurse_100g_8236_62b3_large_d33677c7ee.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_4832_4d663318ff.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_5127_32b3bd99ac.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00010665_gon_bach_tuyet_cat_san_zigzag_3563_62ae_large_719d6e78b4.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_5145_7788a7384a.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00017314_que_gon_20_que_bao_thach_6796_62ae_large_f2bc7d45d7.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00017885_bong_gac_dap_vet_thuong_bao_thach_8cm_x_12cm_6790_62ae_large_192c80b520.jpg"
        ],
        "manufacturer": "DILIGO HOLDINGS",
        "usage": "<p>Sản phẩm giúp làm sạch vết thương, thấm máu và dịch tiết hoặc để thấm thuốc và bôi lên vết thương.</p>",
        "dosage": "<p><strong>Cách dùng</strong></p>\n\n<p>Dùng trong phòng khám, vệ sinh cá nhân, vệ sinh vết thương, tẩy trang.</p>\n\n<p><strong>Đối tượng sử dụng</strong></p>\n\n<p>Dùng cho mọi đối tượng.</p>",
        "specification": "Túi",
        "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
        "registNum": "06:2018/DILIGO HOLDINGS.,JSC",
        "brand": "Niva",
        "producer": "DILIGO HOLDINGS",
        "manufactor": "Việt Nam",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "B&ocirc;ng g&ograve;n y tế được sản xuất từ ​​sợi b&ocirc;ng rất mịn, mềm mại v&agrave; thoải m&aacute;i. Được chế biến 100% từ b&ocirc;ng xơ tự nhi&ecirc;n, trải qua nhiều bước sản xuất để ph&ugrave; hợp cho việc sử dụng trong y tế. Để l&agrave;m cho b&ocirc;ng an to&agrave;n v&agrave; kh&ocirc;ng c&oacute; chất nguy hại, b&ocirc;ng được xử l&yacute; bằng c&ocirc;ng nghệ Spunlace n&ecirc;n kh&ocirc;ng c&oacute; xơ b&ocirc;ng tr&ecirc;n bề mặt, đảm bảo b&ocirc;ng được tinh khiết.\r\n\r\n",
            "question": "Bông gòn y tế được sản xuất từ đâu?"
          },
          {
            "answer": "Về bản chất, nếu hết b&ocirc;ng tẩy trang bạn c&oacute; thể sử dụng b&ocirc;ng g&ograve;n để thay thế. Cả hai đều được l&agrave;m từ b&ocirc;ng hoặc chất liệu mềm mại n&ecirc;n c&oacute; độ thấm h&uacute;t, an to&agrave;n cho da tương tự nhau.&nbsp;\r\n\r\n",
            "question": "Dùng bông y tế thay bông tẩy trang được không?"
          },
          {
            "answer": "V&igrave; c&aacute;c sợi b&ocirc;ng c&oacute; chức năng thấm h&uacute;t m&aacute;u v&agrave; dịch tiết hiệu quả, n&ecirc;n b&ocirc;ng y tế thường được sử dụng để thấm thuốc b&ocirc;i l&ecirc;n c&aacute;c vết thương, b&ocirc;ng mềm mại giảm cảm gi&aacute;c đau khi tiếp x&uacute;c với vị tr&iacute; bị tổn thương. Ngo&agrave;i ra, b&ocirc;ng c&ograve;n c&oacute; c&ocirc;ng dụng cầm m&aacute;u khi ti&ecirc;m ch&iacute;ch thuốc v&agrave; được sử dụng rất phổ biến cho c&aacute;c nhu cầu trong cuộc sống.\r\n\r\n",
            "question": "Bông y tế có công dụng gì?"
          },
          {
            "answer": "B&ocirc;ng c&oacute; khả năng thấm h&uacute;t nhanh, chỉ dưới khoảng 10 gi&acirc;y.\r\n\r\n",
            "question": "Bông viên Niva Yb2 thấm hút có nhanh không?"
          },
          {
            "answer": "Được, bạn c&oacute; thể d&ugrave;ng sản phẩm để vệ sinh cho em b&eacute;, b&ocirc;ng mềm mại kh&ocirc;ng g&acirc;y k&iacute;ch ứng.\r\n\r\n",
            "question": "Dùng bông viên Niva Yb2 vệ sinh cho trẻ sơ sinh được không?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 69,
          "name": "Bông y tế",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 145,
          "name": "DILIGO HOLDINGS",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 12,
          "name": "Túi"
        }
      },
      {
        "id": 878,
        "name": "Dung dịch uống Laferine 80mg Cho-A điều trị suy giảm trí nhớ, kém tập trung, thiểu năng (20 ống x 20ml)",
        "description": "Thuốc Laferine là sản phẩm của CHO-A Pharm, có thành phần chính là Cao khô lá Bạch quả. Đây là thuốc được sử dụng trong các trường hợp suy giảm khả năng ghi nhớ, kém tập trung, giảm trí nhớ và đặc biệt ở người lớn tuổi; thiểu năng chức năng tuần hoàn máu não; chóng mặt, đau đầu, đau nửa đầu, ù tai, giảm thính lực; chân đi kiểu chân cao, chân thấp, loạng choạng; một số người bị thiếu máu võng mạc; nhược dương.",
        "price": "60000",
        "category_id": 110,
        "supplier_id": 396,
        "image_url": null,
        "prescription_required": false,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z",
        "tax_fee": "0",
        "base_unit_id": 1,
        "images": [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/laerine_db8ca08d6e.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00146_7d022b2ddd.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00029346_teburap_120mg_dongkoo_10x10_5076_60af_large_2712737258.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/savi_leucin_k4580_5c989ee087.jpg"
        ],
        "manufacturer": "CHO-A PHARM CO., LTD",
        "usage": "<h3>Chỉ định</h3><p><a href=\"https://nhathuoclongchau.com.vn/thuoc/laferine-80mg-cho-a-pharm-20-ong-x-20ml-36456.html\">Thuốc Laferine</a> được chỉ định dùng trong các trường hợp sau:</p><ul><li>Người bị suy giảm khả năng ghi nhớ, <a href=\"https://nhathuoclongchau.com.vn/bai-viet/nguyen-nhan-va-cach-khac-phuc-tinh-trang-kho-tap-trung.html\">kém tập trung</a>, giảm trí nhớ và đặc biệt ở người lớn tuổi.</li><li>Thiểu năng chức năng tuần hoàn máu não.</li><li><a href=\"https://nhathuoclongchau.com.vn/benh/chong-mat-763.html\">Chóng mặt</a>, đau đầu, đau nửa đầu, ù tai, giảm thính lực.</li><li>Chân đi kiểu chân cao, chân thấp, loạng choạng.</li><li>Một số người bị thiếu máu võng mạc.</li><li>Nhược dương.</li></ul><h3>Dược lực học</h3><p>Chưa có dữ liệu.</p><h3>Dược động học</h3><p>Chưa có dữ liệu.</p>",
        "dosage": "<h3>Cách dùng</h3><p dir=\"ltr\">Thuốc dạng dung dịch dùng đường uống.</p><h3 dir=\"ltr\">Liều dùng</h3><p dir=\"ltr\">Liều dùng cụ thể tùy thuộc vào thể trạng và mức độ diễn tiến của bệnh. Để có liều dùng phù hợp, bạn cần tham khảo ý kiến bác sĩ hoặc chuyên viên y tế.</p><h3 dir=\"ltr\">Làm gì khi dùng quá liều?</h3><p dir=\"ltr\">Trong trường hợp khẩn cấp, hãy gọi ngay cho Trung tâm cấp cứu 115 hoặc đến trạm Y tế địa phương gần nhất.</p><h3 dir=\"ltr\">Làm gì khi quên 1 liều?</h3><p dir=\"ltr\">Bổ sung liều ngay khi nhớ ra. Tuy nhiên, nếu thời gian giãn cách với liều tiếp theo quá ngắn thì bỏ qua liều đã quên và tiếp tục lịch dùng thuốc. Không dùng liều gấp đôi để bù cho liều đã bị bỏ lỡ.</p>",
        "specification": "Hộp 20 Ống x 20ml",
        "adverseEffect": "<p>Thông báo cho thầy thuốc các tác dụng không mong muốn gặp phải khi sử dụng thuốc.</p>",
        "registNum": "VN-21996-19",
        "brand": "CHO-A",
        "producer": "CHO-A PHARM CO., LTD",
        "manufactor": "Hàn Quốc",
        "legalDeclaration": null,
        "faq": [
          {
            "answer": "\r\n\r\nDược lực học l&agrave; nghi&ecirc;n cứu c&aacute;c ảnh hưởng sinh h&oacute;a, sinh l&yacute;, v&agrave; ph&acirc;n tử của thuốc tr&ecirc;n cơ thể v&agrave; li&ecirc;n quan đến thụ thể li&ecirc;n kết, hiệu ứng sau thụ thể, v&agrave; tương t&aacute;c h&oacute;a học. Dược lực học, với dược động học, gi&uacute;p giải th&iacute;ch mối quan hệ giữa liều v&agrave; đ&aacute;p ứng, tức l&agrave; c&aacute;c t&aacute;c dụng của thuốc. Đ&aacute;p ứng dược l&yacute; phụ thuộc v&agrave;o sự li&ecirc;n kết của thuốc với đ&iacute;ch t&aacute;c dụng. Nồng độ thuốc ở vị tr&iacute; thụ thể ảnh hưởng đến t&aacute;c dụng của thuốc.",
            "question": "Dược lực học là gì?"
          },
          {
            "answer": "\r\n\r\nDược động học l&agrave; những t&aacute;c động của cơ thể đối với thuốc trong suốt qu&aacute; tr&igrave;nh thuốc đi v&agrave;o, ở trong v&agrave; đi ra khỏi cơ thể- bao gồm c&aacute;c qu&aacute; tr&igrave;nh hấp thụ, sinh khả dụng, ph&acirc;n bố, chuyển h&oacute;a, v&agrave; thải trừ.",
            "question": "Dược động học là gì?"
          },
          {
            "answer": "\r\n\r\nT&aacute;c dụng phụ l&agrave; những triệu chứng kh&ocirc;ng mong muốn xảy ra khi ch&uacute;ng ta uống thuốc. C&aacute;c t&aacute;c dụng phụ n&agrave;y c&oacute; thể kh&ocirc;ng nghi&ecirc;m trọng, chẳng hạn chỉ g&acirc;y đau đầu hoặc kh&ocirc; miệng. Nhưng cũng c&oacute; những t&aacute;c dụng phụ đe dọa t&iacute;nh mạng. Cẩn ph&ograve;ng tr&aacute;nh t&aacute;c dụng phụ của thuốc như: Th&ocirc;ng b&aacute;o c&aacute;c loại thuốc đang sử dụng với b&aacute;c sĩ, c&aacute;c bệnh l&yacute; nền hiện tại, c&aacute;c tương t&aacute;c của thuốc đến thực phẩm hằng ng&agrave;y. Đọc kỹ hướng dẫn sử dụng thuốc v&agrave; nếu gặp t&aacute;c dụng phụ cần b&aacute;o ngay cho b&aacute;c sĩ.",
            "question": "Tác dụng phụ của thuốc là gì? Cách phòng tránh tác dụng phụ của thuốc"
          },
          {
            "answer": "\r\n\r\nSử dụng thuốc đ&uacute;ng c&aacute;ch l&agrave; uống thuốc theo chỉ dẫn của dược sĩ, b&aacute;c sĩ. Ngo&agrave;i ra kh&ocirc;ng d&ugrave;ng nước quả, nước kho&aacute;ng hoặc c&aacute;c loại nước ngọt đ&oacute;ng hộp c&oacute; gas để uống thuốc. Kh&ocirc;ng d&ugrave;ng sữa để uống thuốc v&igrave; trong th&agrave;nh phần của sữa c&oacute; chứa canxi. Kh&ocirc;ng d&ugrave;ng c&agrave; ph&ecirc; hay nước ch&egrave; để uống thuốc. Chỉ n&ecirc;n uống c&ugrave;ng nước lọc.",
            "question": "Sử dụng thuốc đúng cách như thế nào?"
          },
          {
            "answer": "\r\n\r\nC&oacute; c&aacute;c dạng b&agrave;o chế thuốc như\r\nTheo thể chất:\r\n\r\n\r\n\tC&aacute;c dạng thuốc thể rắn (thuốc bột, thuốc vi&ecirc;n).\r\n\tC&aacute;c dạng thuốc thể mềm (thuốc cao, thuốc mỡ, gel).\r\n\tC&aacute;c dạng thuốc thể lỏng (dung dịch, hỗn dịch, nhũ dịch, xiro).\r\n\r\n\r\nTheo đường d&ugrave;ng:\r\n\r\n\r\n\tC&aacute;c dạng thuốc uống (vi&ecirc;n, bột, dung dịch, nhũ dịch, hỗn dịch).\r\n\tC&aacute;c dạng thuốc ti&ecirc;m (dung dịch, hỗn dịch, nhũ dịch, bột pha ti&ecirc;m, dịch truyền).\r\n\tC&aacute;c dạng thuốc d&ugrave;ng ngo&agrave;i (thuốc b&ocirc;i tr&ecirc;n da, thuốc nhỏ l&ecirc;n ni&ecirc;m mạc, thuốc s&uacute;c miệng).\r\n\tC&aacute;c dạng thuốc đặt v&agrave;o c&aacute;c hốc tự nhi&ecirc;n tr&ecirc;n cơ thể (thuốc đặt hậu m&ocirc;n, thuốc trứng đặt &acirc;m đạo...).\r\n",
            "question": "Các dạng bào chế của thuốc?"
          }
        ],
        "sold_count": 0,
        "categories": {
          "id": 110,
          "name": "Thuốc thần kinh",
          "description": null,
          "parent_id": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "suppliers": {
          "id": 396,
          "name": "CHO-A PHARM CO., LTD",
          "contact_info": null,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z"
        },
        "unittype": {
          "id": 1,
          "name": "Hộp"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "totalPages": 11,
      "totalRecords": 51
    }
  }
}
```

---

### Get Best Sellers

- **Endpoint**: `GET /products/best-sellers?limit=5`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Máy xung điện trị liệu Omron HV-F013 giảm đau cơ và khớp",
      "description": "Máy massage xung điện trị liệu Omron HV-F013 là giải pháp trị liệu bằng xung điện tại nhà đơn giản, nhỏ gọn, dễ sử dụng với 5 chế độ massage giúp giảm đau cơ và khớp mọi lúc mọi nơi.",
      "price": "6000",
      "category_id": 1,
      "supplier_id": 1,
      "image_url": null,
      "prescription_required": false,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z",
      "tax_fee": "0",
      "base_unit_id": 1,
      "images": [
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
      ],
      "manufacturer": "OMRON HEALTHCARE MANUFACTURING VN",
      "usage": "<p>Máy xung điện trị liệu Omron HV-F013 sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:</p><ul><li>Chặn cơn đau.</li><li>Kích hoạt giải phóng endorphin (như thuốc giảm đau tự nhiên).</li><li>Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).</li></ul>",
      "dosage": "<p><strong>Cách dùng</strong></p><p><i>Hướng dẫn đặt miếng dán (để trị liệu tối ưu):</i></p><ul><li>Đặt các miếng dán trên mỗi phía bị đau.</li><li>Phải sử dụng HAI MIẾNG DÁN.</li><li>Đặt các miếng dán cách chỗ đau ít nhất 2,5cm.</li><li>Không xếp chồng các miếng dán.</li><li>Không xịt, bôi thuốc hoặc kem lên da hoặc miếng dán.</li><li>Không dùng chung miếng dán.</li><li>Không di chuyển miếng dán sang vị trí khác khi máy vẫn bật.</li></ul><p><i>Bước 1:&nbsp;</i></p><p>Tắt máy, lắp pin: Đọc kỹ toàn bộ hướng dẫn sử dụng để đảm bảo an toàn và sử dụng đúng máy xung điện trị liệu này.</p><p><i>Bước 2:</i></p><p>Cắm dây vào phần bên dưới của máy và mỗi đầu dây còn lại được gắn với một miếng dán.</p><p><i>Bước 3:</i></p><p>Kiểm soát và đánh giá mức đau trước và sau trị liệu (là mức đau nhẹ đến 10 mức đau nhất). Đặt 2 miếng dán cách chỗ đau ít nhất 2,5cm. Không xếp chồng lên nhau. Để miếng dán trên vùng da sạch, khô và không bị thương tổn.</p><p><i>Bước 4:</i></p><ul><li>Ấn nút nguồn.</li><li>Ấn ▲ (lên) hoặc ▼ (xuống) để chọn 1 trong 5 chế độ. Không kết hợp được các chế độ với nhau.</li><li>Ấn nút Set Start (Cài đặt/Khởi động) để chọn chế độ. Máy sẽ bắt đầu liệu trình tại mức cường độ 1.</li></ul><p><i>Bước 5:</i></p><p>Ấn nút ▲ (lên) để tăng cường độ. Thiết lập cường độ cho cơn đau của bạn. Có đến 10 cường độ khác nhau.</p><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=SqX6iW4NbQY\"><iframe src=\"https://www.youtube.com/embed/SqX6iW4NbQY\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Người trưởng thành bị đau cấp tính hoặc mãn tính.</p>",
      "specification": "Hộp",
      "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
      "registNum": "240001004/PCBB-BYT",
      "brand": "OMRON",
      "producer": "OMRON HEALTHCARE MANUFACTURING VN",
      "manufactor": "Việt Nam",
      "legalDeclaration": null,
      "faq": [
        {
          "answer": "Ngừng sử dụng máy xung điện trị liệu Omron HV-F013 trong các trường hợp sau:Nếu bạn gặp phản ứng bất lợi (kích ứng da/đỏ/bỏng, đau đầu hoặc cảm giác đau đớn khác, hoặc nếu bạn cảm thấy bất thường khó chịu).Nếu cơn đau của bạn không cải thiện, trở nên nghiêm trọng mãn tính và nặng hơn, hoặc kéo dài trong hơn năm ngày.",
          "question": "Khi nào ngừng sử dụng máy xung điện trị liệu Omron HV-F013?"
        },
        {
          "answer": "Bắt đầu bằng một liệu trình 15 phút. Phải luôn tắt máy khi miếng dán vẫn đang còn lắp trên máy. Đánh giá cơn đau để kiểm tra xem có cải thiện hay không. Dừng điều trị nếu cơn đau đã giảm hoặc hết hẳn. Ấn nút nguồn để tiếp tục liệu trình 15 phút tiếp theo.",
          "question": "Nên sử dụng máy xung điện trị liệu Omron HV-F013 trong bao lâu?"
        },
        {
          "answer": "Sử dụng ngay khi bạn thấy đau. Bắt đầu sử dụng máy với 1 liệu trình (máy sẽ tự động tắt sau 15 phút). Hãy sử dụng máy để điều trị chỗ đau sớm để ngăn ngừa cơn đau trở nên tồi tệ hơn, hoặc thậm chí là trở thành bệnh mãn tính. Bạn nên kiểm soát chỗ đau sớm hơn để nó không đạt đến ngưỡng chịu đau cao, dẫn tới hạn chế các hoạt động hàng ngày của bạn.",
          "question": "Khi nào nên bắt đầu dùng máy xung điện trị liệu Omron HV-F013?"
        },
        {
          "answer": "Sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:Chặn cơn đau.Kích hoạt giải phóng endorphin (bằng thuốc giảm đau tự nhiên).Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).",
          "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 có tính năng gì?"
        },
        {
          "answer": "TENS (xung điện trị liệu kích thích thần kinh) là liệu pháp sử dụng các điện cực được đặt trên da để kích thích các dây thần kinh dưới da xung quanh giúp giảm đau, được các nhà vật lý trị liệu sử dụng trong vòng hơn 30 năm qua.",
          "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 là gì?"
        }
      ],
      "sold_count": 30,
      "categories": {
        "id": 1,
        "name": "Máy massage",
        "description": null,
        "parent_id": null,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z"
      },
      "suppliers": {
        "id": 1,
        "name": "OMRON HEALTHCARE MANUFACTURING VN",
        "contact_info": null,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z"
      },
      "unittype": {
        "id": 1,
        "name": "Hộp"
      },
      "productunits": [
        {
          "id": 1,
          "product_id": 1,
          "unit_name": "Hộp",
          "conversion_factor": "1",
          "price": "25000",
          "created_at": "2025-10-15T16:00:07.037Z",
          "updated_at": "2025-10-15T16:00:07.037Z"
        },
        {
          "id": 2,
          "product_id": 1,
          "unit_name": "Viên",
          "conversion_factor": "10",
          "price": "2500",
          "created_at": "2025-10-15T16:00:07.037Z",
          "updated_at": "2025-10-15T16:00:07.037Z"
        }
      ],
      "reviews": [
        {
          "rating": 4
        }
      ],
      "rank": 1,
      "average_rating": 4,
      "review_count": 1
    },
    {
      "id": 2,
      "name": "Máy mát xa bụng Fuji PG-2507 hỗ trợ làm ấm đều toàn thân, mang lại cảm giác dễ chịu cho cơ thể",
      "description": "Máy massage bụng Fuji PG-2507 có chất liệu bề mặt là sợi carbon tạo cảm giác rất thoải mái, thiết kế phù hợp với đường cong bụng, thẩm mỹ và khoa học. Sản phẩm kết hợp massage rung đa tầng và các tính năng sưởi ấm hồng ngoại, làm ấm tử cung, mang lại cảm giác dễ chịu và thư thái khi sử dụng.",
      "price": "792000",
      "category_id": 1,
      "supplier_id": 2,
      "image_url": null,
      "prescription_required": false,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z",
      "tax_fee": "0",
      "base_unit_id": 1,
      "images": [
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
      ],
      "manufacturer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
      "usage": "<p>Máy massage bụng Fuji PG-2507 được sử dụng để massage vùng bụng, làm ấm đều toàn thân, mang lại cảm giác dễ chịu cho cơ thể. Với công nghệ rung đa tầng và các tính năng sưởi ấm hồng ngoại, làm ấm tử cung, an toàn với nhiệt độ không đổi, sản phẩm là thiết bị hỗ trợ chăm sóc phụ nữ toàn diện hơn.</p>",
      "dosage": "<p><strong>Cách dùng</strong></p><ol><li>Sạc thiết bị bằng cách gắn cáp USB trực tiếp vào máy, chờ khoảng 2 - 3 giờ để sạc đầy.</li><li>Đeo thiết bị, điều chỉnh dây đàn hồi phù hợp.</li><li>Nhấn nút nguồn (power) để bật máy.</li><li>Nhấn nút nguồn (power) lần lượt để chọn chế độ rung 1 2 3.</li><li>Nhấn nút biểu tượng nhiệt độ lần lượt để điều chỉnh nhiệt độ 1 2 3.</li><li>Nhấn và giữ nút nguồn (power) trong 3 giây để tắt máy.</li></ol><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=634e1zqIYZE\"><iframe src=\"https://www.youtube.com/embed/634e1zqIYZE\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Máy massage bụng Fuji PG-2507 thích hợp cho phụ nữ, kể cả người đang trong thời kỳ kinh nguyệt và nhóm người bị thừa cân, táo bón.</p>",
      "specification": "Hộp",
      "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
      "registNum": "HK2209214219-1ER",
      "brand": "FUJI",
      "producer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
      "manufactor": "Trung Quốc",
      "legalDeclaration": null,
      "faq": [
        {
          "answer": "Sản phẩm đã vượt qua kiểm nghiệm, độ bức xạ thấp đến mức không đáng kể, chỉ 0.4, thấp hơn 1500 so với điện thoại di động. Vì vậy mọi người có thể yên tâm trong quá trình sử dụng.",
          "question": "Máy mát xa bụng Fuji PG-2507 có bức xạ điện từ không?"
        },
        {
          "answer": "Máy mát xa bụng Fuji PG-2507 có tới 3 mức điều chỉnh nhiệt độ linh hoạt và dễ dàng: 40°, 45°, 50°.",
          "question": "Máy mát xa bụng Fuji PG-2507 có các mức nhiệt độ nào?"
        },
        {
          "answer": "Những người mắc bệnh tim, bệnh tăng huyết áp, bệnh ung thư, khối u, bệnh rối loạn đông máu, bệnh mạch máu não, bệnh động kinh hoặc bệnh cấp tính và khẩn cấp khác đang được bác sĩ điều trị, không được sử dụng máy mát xa bụng Fuji PG-2507.",
          "question": "Những đối tượng nào không được dùng máy mát xa bụng Fuji PG-2507?"
        },
        {
          "answer": "Phụ nữ đang mang thai không nên dùng máy mát xa bụng Fuji PG-2507.",
          "question": "Phụ nữ mang thai có dùng được máy mát xa bụng Fuji PG-2507 không?"
        },
        {
          "answer": "Sạc thiết bị bằng cách gắn cáp USB trực tiếp vào máy, chờ khoảng 2 - 3 giờ để sạc đầy.",
          "question": "Sạc máy mát xa bụng Fuji PG-2507 trong bao lâu?"
        }
      ],
      "sold_count": 2,
      "categories": {
        "id": 1,
        "name": "Máy massage",
        "description": null,
        "parent_id": null,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z"
      },
      "suppliers": {
        "id": 2,
        "name": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
        "contact_info": null,
        "created_at": "2025-09-30T05:22:18.892Z",
        "updated_at": "2025-09-30T05:22:18.892Z"
      },
      "unittype": {
        "id": 1,
        "name": "Hộp"
      },
      "productunits": [
        {
          "id": 3,
          "product_id": 2,
          "unit_name": "Tuýp",
          "conversion_factor": "1",
          "price": "30000",
          "created_at": "2025-10-15T16:00:07.037Z",
          "updated_at": "2025-10-15T16:00:07.037Z"
        }
      ],
      "reviews": [
        {
          "rating": 5
        }
      ],
      "rank": 2,
      "average_rating": 5,
      "review_count": 1
    }
  ]
}
```

---

## Categories Module

### Get All Categories

- **Endpoint**: `GET /categories`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Máy massage",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 2,
      "name": "Kem hỗ trợ giảm mụn, gel hỗ trợ giảm mụn",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 3,
      "name": "Dầu gội giúp giảm nấm và ngứa da đầu",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 4,
      "name": "Gel bôi trơn",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 5,
      "name": "Sữa rửa mặt (Kem, gel, sữa)",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 6,
      "name": "Nước tẩy trang, dầu tẩy trang",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 7,
      "name": "Mặt nạ",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 8,
      "name": "Dưỡng da mặt",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 9,
      "name": "Chăm sóc da mặt",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 10,
      "name": "Hỗ trợ mờ sẹo, mờ vết thâm",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 11,
      "name": "Da mẫn cảm, dễ kích ứng",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 12,
      "name": "Dưỡng da bị khô, thiếu ẩm",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 13,
      "name": "Kim các loại",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 14,
      "name": "Vitamin tổng hợp",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 15,
      "name": "Bổ sung Canxi & Vitamin D",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 16,
      "name": "Vitamin & Khoáng chất",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 17,
      "name": "Bổ sung Sắt & Axit Folic",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 18,
      "name": "Cơ xương khớp",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 19,
      "name": "Hô hấp, ho, xoang",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 20,
      "name": "Hỗ trợ điều trị trĩ",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 21,
      "name": "Thận, tiền liệt tuyến",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 22,
      "name": "Hỗ trợ điều trị",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 23,
      "name": "Bổ não - cải thiện trí nhớ",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 24,
      "name": "Chăm sóc chuyên sâu cho tóc",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 25,
      "name": "Túi chườm",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 26,
      "name": "Hoạt huyết",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 27,
      "name": "Máy đo SpO2",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 28,
      "name": "Thực phẩm - Đồ uống",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 29,
      "name": "Nước Yến",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 30,
      "name": "Trà thảo dược",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 31,
      "name": "Nước uống không gas",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 32,
      "name": "Bổ mắt, bảo vệ mắt",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 33,
      "name": "Băng vệ sinh",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 34,
      "name": "Kẹo cứng",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 35,
      "name": "Dầu cá, Omega 3, DHA",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 36,
      "name": "Vitamin C các loại",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 37,
      "name": "Dụng cụ tẩy lông",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 38,
      "name": "Nước súc miệng",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 39,
      "name": "Kit Test Covid",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 40,
      "name": "Hỗ trợ mãn kinh",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 41,
      "name": "Hỗ trợ cải thiện quầng thâm, bọng mắt",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 42,
      "name": "Hỗ trợ giấc ngủ ngon",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 43,
      "name": "Khẩu trang vải",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 44,
      "name": "Sức khoẻ tình dục",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 45,
      "name": "Khẩu trang y tế",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 46,
      "name": "Đại tràng",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 47,
      "name": "Chăm sóc da nứt nẻ",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 48,
      "name": "Hỗ trợ trao đổi chất",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 49,
      "name": "Khăn giấy, khăn ướt",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    },
    {
      "id": 50,
      "name": "Máy, que thử đường huyết",
      "description": null,
      "parent_id": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 50,
    "totalPages": 4
  }
}
```

---

### Get Category By ID

- **Endpoint**: `GET /categories/1`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Máy massage",
    "description": null,
    "parent_id": null,
    "created_at": "2025-09-30T05:22:18.892Z",
    "updated_at": "2025-09-30T05:22:18.892Z"
  }
}
```

---

## Cart Module

### Get Cart

- **Endpoint**: `GET /cart/26`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": 28,
    "customer_id": 26,
    "voucher_id": null,
    "shipping_address_id": null,
    "total_amount": "0",
    "discount_amount": "0",
    "final_amount": "0",
    "status": "cart",
    "order_date": "2025-11-22T06:24:32.927Z",
    "updated_at": "2025-11-22T06:24:32.928Z",
    "orderitems": []
  }
}
```

---

### Get Cart Summary

- **Endpoint**: `GET /cart/26/summary`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "cartId": 28,
    "itemCount": 0,
    "subtotal": 0,
    "discount": 0,
    "total": 0,
    "items": []
  }
}
```

---

### Add Product to Cart

- **Endpoint**: `POST /cart/26/add`
- **Status**: ✅ PASSED
- **HTTP Status**: 201
- **Request Body**:
```json
{
  "productId": 1,
  "productUnitId": 1,
  "quantity": 2
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Đã thêm sản phẩm vào giỏ hàng",
  "data": {
    "id": 29,
    "order_id": 28,
    "product_id": 1,
    "unit_id": 1,
    "quantity": 2,
    "price": "25000",
    "subtotal": "50000",
    "created_at": "2025-11-22T06:24:37.141Z",
    "updated_at": "2025-11-22T06:24:37.141Z",
    "products": {
      "id": 1,
      "name": "Máy xung điện trị liệu Omron HV-F013 giảm đau cơ và khớp",
      "description": "Máy massage xung điện trị liệu Omron HV-F013 là giải pháp trị liệu bằng xung điện tại nhà đơn giản, nhỏ gọn, dễ sử dụng với 5 chế độ massage giúp giảm đau cơ và khớp mọi lúc mọi nơi.",
      "price": "6000",
      "category_id": 1,
      "supplier_id": 1,
      "image_url": null,
      "prescription_required": false,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z",
      "tax_fee": "0",
      "base_unit_id": 1,
      "images": [
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
        "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
      ],
      "manufacturer": "OMRON HEALTHCARE MANUFACTURING VN",
      "usage": "<p>Máy xung điện trị liệu Omron HV-F013 sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:</p><ul><li>Chặn cơn đau.</li><li>Kích hoạt giải phóng endorphin (như thuốc giảm đau tự nhiên).</li><li>Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).</li></ul>",
      "dosage": "<p><strong>Cách dùng</strong></p><p><i>Hướng dẫn đặt miếng dán (để trị liệu tối ưu):</i></p><ul><li>Đặt các miếng dán trên mỗi phía bị đau.</li><li>Phải sử dụng HAI MIẾNG DÁN.</li><li>Đặt các miếng dán cách chỗ đau ít nhất 2,5cm.</li><li>Không xếp chồng các miếng dán.</li><li>Không xịt, bôi thuốc hoặc kem lên da hoặc miếng dán.</li><li>Không dùng chung miếng dán.</li><li>Không di chuyển miếng dán sang vị trí khác khi máy vẫn bật.</li></ul><p><i>Bước 1:&nbsp;</i></p><p>Tắt máy, lắp pin: Đọc kỹ toàn bộ hướng dẫn sử dụng để đảm bảo an toàn và sử dụng đúng máy xung điện trị liệu này.</p><p><i>Bước 2:</i></p><p>Cắm dây vào phần bên dưới của máy và mỗi đầu dây còn lại được gắn với một miếng dán.</p><p><i>Bước 3:</i></p><p>Kiểm soát và đánh giá mức đau trước và sau trị liệu (là mức đau nhẹ đến 10 mức đau nhất). Đặt 2 miếng dán cách chỗ đau ít nhất 2,5cm. Không xếp chồng lên nhau. Để miếng dán trên vùng da sạch, khô và không bị thương tổn.</p><p><i>Bước 4:</i></p><ul><li>Ấn nút nguồn.</li><li>Ấn ▲ (lên) hoặc ▼ (xuống) để chọn 1 trong 5 chế độ. Không kết hợp được các chế độ với nhau.</li><li>Ấn nút Set Start (Cài đặt/Khởi động) để chọn chế độ. Máy sẽ bắt đầu liệu trình tại mức cường độ 1.</li></ul><p><i>Bước 5:</i></p><p>Ấn nút ▲ (lên) để tăng cường độ. Thiết lập cường độ cho cơn đau của bạn. Có đến 10 cường độ khác nhau.</p><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=SqX6iW4NbQY\"><iframe src=\"https://www.youtube.com/embed/SqX6iW4NbQY\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Người trưởng thành bị đau cấp tính hoặc mãn tính.</p>",
      "specification": "Hộp",
      "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
      "registNum": "240001004/PCBB-BYT",
      "brand": "OMRON",
      "producer": "OMRON HEALTHCARE MANUFACTURING VN",
      "manufactor": "Việt Nam",
      "legalDeclaration": null,
      "faq": [
        {
          "answer": "Ngừng sử dụng máy xung điện trị liệu Omron HV-F013 trong các trường hợp sau:Nếu bạn gặp phản ứng bất lợi (kích ứng da/đỏ/bỏng, đau đầu hoặc cảm giác đau đớn khác, hoặc nếu bạn cảm thấy bất thường khó chịu).Nếu cơn đau của bạn không cải thiện, trở nên nghiêm trọng mãn tính và nặng hơn, hoặc kéo dài trong hơn năm ngày.",
          "question": "Khi nào ngừng sử dụng máy xung điện trị liệu Omron HV-F013?"
        },
        {
          "answer": "Bắt đầu bằng một liệu trình 15 phút. Phải luôn tắt máy khi miếng dán vẫn đang còn lắp trên máy. Đánh giá cơn đau để kiểm tra xem có cải thiện hay không. Dừng điều trị nếu cơn đau đã giảm hoặc hết hẳn. Ấn nút nguồn để tiếp tục liệu trình 15 phút tiếp theo.",
          "question": "Nên sử dụng máy xung điện trị liệu Omron HV-F013 trong bao lâu?"
        },
        {
          "answer": "Sử dụng ngay khi bạn thấy đau. Bắt đầu sử dụng máy với 1 liệu trình (máy sẽ tự động tắt sau 15 phút). Hãy sử dụng máy để điều trị chỗ đau sớm để ngăn ngừa cơn đau trở nên tồi tệ hơn, hoặc thậm chí là trở thành bệnh mãn tính. Bạn nên kiểm soát chỗ đau sớm hơn để nó không đạt đến ngưỡng chịu đau cao, dẫn tới hạn chế các hoạt động hàng ngày của bạn.",
          "question": "Khi nào nên bắt đầu dùng máy xung điện trị liệu Omron HV-F013?"
        },
        {
          "answer": "Sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:Chặn cơn đau.Kích hoạt giải phóng endorphin (bằng thuốc giảm đau tự nhiên).Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).",
          "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 có tính năng gì?"
        },
        {
          "answer": "TENS (xung điện trị liệu kích thích thần kinh) là liệu pháp sử dụng các điện cực được đặt trên da để kích thích các dây thần kinh dưới da xung quanh giúp giảm đau, được các nhà vật lý trị liệu sử dụng trong vòng hơn 30 năm qua.",
          "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 là gì?"
        }
      ],
      "sold_count": 5
    },
    "productunits": {
      "id": 1,
      "product_id": 1,
      "unit_name": "Hộp",
      "conversion_factor": "1",
      "price": "25000",
      "created_at": "2025-10-15T16:00:07.037Z",
      "updated_at": "2025-10-15T16:00:07.037Z"
    }
  }
}
```

---

### Get Cart After Adding

- **Endpoint**: `GET /cart/26`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": 28,
    "customer_id": 26,
    "voucher_id": null,
    "shipping_address_id": null,
    "total_amount": "50000",
    "discount_amount": "0",
    "final_amount": "50000",
    "status": "cart",
    "order_date": "2025-11-22T06:24:32.927Z",
    "updated_at": "2025-11-22T06:24:37.899Z",
    "orderitems": [
      {
        "id": 29,
        "order_id": 28,
        "product_id": 1,
        "unit_id": 1,
        "quantity": 2,
        "price": "25000",
        "subtotal": "50000",
        "created_at": "2025-11-22T06:24:37.141Z",
        "updated_at": "2025-11-22T06:24:37.141Z",
        "products": {
          "id": 1,
          "name": "Máy xung điện trị liệu Omron HV-F013 giảm đau cơ và khớp",
          "description": "Máy massage xung điện trị liệu Omron HV-F013 là giải pháp trị liệu bằng xung điện tại nhà đơn giản, nhỏ gọn, dễ sử dụng với 5 chế độ massage giúp giảm đau cơ và khớp mọi lúc mọi nơi.",
          "price": "6000",
          "category_id": 1,
          "supplier_id": 1,
          "image_url": null,
          "prescription_required": false,
          "created_at": "2025-09-30T05:22:18.892Z",
          "updated_at": "2025-09-30T05:22:18.892Z",
          "tax_fee": "0",
          "base_unit_id": 1,
          "images": [
            "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
            "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
            "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
            "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
            "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
            "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
            "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
            "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
            "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
          ],
          "manufacturer": "OMRON HEALTHCARE MANUFACTURING VN",
          "usage": "<p>Máy xung điện trị liệu Omron HV-F013 sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:</p><ul><li>Chặn cơn đau.</li><li>Kích hoạt giải phóng endorphin (như thuốc giảm đau tự nhiên).</li><li>Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).</li></ul>",
          "dosage": "<p><strong>Cách dùng</strong></p><p><i>Hướng dẫn đặt miếng dán (để trị liệu tối ưu):</i></p><ul><li>Đặt các miếng dán trên mỗi phía bị đau.</li><li>Phải sử dụng HAI MIẾNG DÁN.</li><li>Đặt các miếng dán cách chỗ đau ít nhất 2,5cm.</li><li>Không xếp chồng các miếng dán.</li><li>Không xịt, bôi thuốc hoặc kem lên da hoặc miếng dán.</li><li>Không dùng chung miếng dán.</li><li>Không di chuyển miếng dán sang vị trí khác khi máy vẫn bật.</li></ul><p><i>Bước 1:&nbsp;</i></p><p>Tắt máy, lắp pin: Đọc kỹ toàn bộ hướng dẫn sử dụng để đảm bảo an toàn và sử dụng đúng máy xung điện trị liệu này.</p><p><i>Bước 2:</i></p><p>Cắm dây vào phần bên dưới của máy và mỗi đầu dây còn lại được gắn với một miếng dán.</p><p><i>Bước 3:</i></p><p>Kiểm soát và đánh giá mức đau trước và sau trị liệu (là mức đau nhẹ đến 10 mức đau nhất). Đặt 2 miếng dán cách chỗ đau ít nhất 2,5cm. Không xếp chồng lên nhau. Để miếng dán trên vùng da sạch, khô và không bị thương tổn.</p><p><i>Bước 4:</i></p><ul><li>Ấn nút nguồn.</li><li>Ấn ▲ (lên) hoặc ▼ (xuống) để chọn 1 trong 5 chế độ. Không kết hợp được các chế độ với nhau.</li><li>Ấn nút Set Start (Cài đặt/Khởi động) để chọn chế độ. Máy sẽ bắt đầu liệu trình tại mức cường độ 1.</li></ul><p><i>Bước 5:</i></p><p>Ấn nút ▲ (lên) để tăng cường độ. Thiết lập cường độ cho cơn đau của bạn. Có đến 10 cường độ khác nhau.</p><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=SqX6iW4NbQY\"><iframe src=\"https://www.youtube.com/embed/SqX6iW4NbQY\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Người trưởng thành bị đau cấp tính hoặc mãn tính.</p>",
          "specification": "Hộp",
          "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
          "registNum": "240001004/PCBB-BYT",
          "brand": "OMRON",
          "producer": "OMRON HEALTHCARE MANUFACTURING VN",
          "manufactor": "Việt Nam",
          "legalDeclaration": null,
          "faq": [
            {
              "answer": "Ngừng sử dụng máy xung điện trị liệu Omron HV-F013 trong các trường hợp sau:Nếu bạn gặp phản ứng bất lợi (kích ứng da/đỏ/bỏng, đau đầu hoặc cảm giác đau đớn khác, hoặc nếu bạn cảm thấy bất thường khó chịu).Nếu cơn đau của bạn không cải thiện, trở nên nghiêm trọng mãn tính và nặng hơn, hoặc kéo dài trong hơn năm ngày.",
              "question": "Khi nào ngừng sử dụng máy xung điện trị liệu Omron HV-F013?"
            },
            {
              "answer": "Bắt đầu bằng một liệu trình 15 phút. Phải luôn tắt máy khi miếng dán vẫn đang còn lắp trên máy. Đánh giá cơn đau để kiểm tra xem có cải thiện hay không. Dừng điều trị nếu cơn đau đã giảm hoặc hết hẳn. Ấn nút nguồn để tiếp tục liệu trình 15 phút tiếp theo.",
              "question": "Nên sử dụng máy xung điện trị liệu Omron HV-F013 trong bao lâu?"
            },
            {
              "answer": "Sử dụng ngay khi bạn thấy đau. Bắt đầu sử dụng máy với 1 liệu trình (máy sẽ tự động tắt sau 15 phút). Hãy sử dụng máy để điều trị chỗ đau sớm để ngăn ngừa cơn đau trở nên tồi tệ hơn, hoặc thậm chí là trở thành bệnh mãn tính. Bạn nên kiểm soát chỗ đau sớm hơn để nó không đạt đến ngưỡng chịu đau cao, dẫn tới hạn chế các hoạt động hàng ngày của bạn.",
              "question": "Khi nào nên bắt đầu dùng máy xung điện trị liệu Omron HV-F013?"
            },
            {
              "answer": "Sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:Chặn cơn đau.Kích hoạt giải phóng endorphin (bằng thuốc giảm đau tự nhiên).Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).",
              "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 có tính năng gì?"
            },
            {
              "answer": "TENS (xung điện trị liệu kích thích thần kinh) là liệu pháp sử dụng các điện cực được đặt trên da để kích thích các dây thần kinh dưới da xung quanh giúp giảm đau, được các nhà vật lý trị liệu sử dụng trong vòng hơn 30 năm qua.",
              "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 là gì?"
            }
          ],
          "sold_count": 5
        },
        "productunits": {
          "id": 1,
          "product_id": 1,
          "unit_name": "Hộp",
          "conversion_factor": "1",
          "price": "25000",
          "created_at": "2025-10-15T16:00:07.037Z",
          "updated_at": "2025-10-15T16:00:07.037Z"
        }
      }
    ]
  }
}
```

---

## Branches Module

### Get All Branches

- **Endpoint**: `GET /branches`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "branches": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 0,
      "totalRecords": 0
    }
  }
}
```

---

### Get Branch By ID

- **Endpoint**: `GET /branches/1`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Chi nhánh Đà Nẵng",
    "address": "123 Lê Thanh Nghị, Đà Nẵng",
    "phone": "0905123456",
    "manager_id": null,
    "created_at": "2025-10-29T08:46:52.724Z",
    "updated_at": "2025-10-29T08:46:52.724Z",
    "is_active": true,
    "city": "Da Nang",
    "city_id": 1
  }
}
```

---

## Cities Module

### Get All Cities

- **Endpoint**: `GET /cities`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "name": "Biên Hòa",
      "code": "BH",
      "region": "Miền Nam",
      "created_at": "2025-11-22T06:03:33.112Z",
      "updated_at": "2025-11-22T06:03:33.112Z"
    },
    {
      "id": 12,
      "name": "Buôn Ma Thuột",
      "code": "BMT",
      "region": "Miền Trung",
      "created_at": "2025-11-22T06:03:35.761Z",
      "updated_at": "2025-11-22T06:03:35.761Z"
    },
    {
      "id": 6,
      "name": "Cần Thơ",
      "code": "CT",
      "region": "Miền Nam",
      "created_at": "2025-11-22T06:03:31.735Z",
      "updated_at": "2025-11-22T06:03:31.735Z"
    },
    {
      "id": 1,
      "name": "Da Nang",
      "code": null,
      "region": null,
      "created_at": "2025-11-22T04:35:29.624Z",
      "updated_at": "2025-11-22T04:35:29.624Z"
    },
    {
      "id": 5,
      "name": "Đà Nẵng",
      "code": "DN",
      "region": "Miền Trung",
      "created_at": "2025-11-22T06:03:31.090Z",
      "updated_at": "2025-11-22T06:03:31.090Z"
    },
    {
      "id": 4,
      "name": "Hà Nội",
      "code": "HN",
      "region": "Miền Bắc",
      "created_at": "2025-11-22T06:03:30.376Z",
      "updated_at": "2025-11-22T06:03:30.376Z"
    },
    {
      "id": 7,
      "name": "Hải Phòng",
      "code": "HP",
      "region": "Miền Bắc",
      "created_at": "2025-11-22T06:03:32.417Z",
      "updated_at": "2025-11-22T06:03:32.417Z"
    },
    {
      "id": 2,
      "name": "Ho Chi Minh",
      "code": null,
      "region": null,
      "created_at": "2025-11-22T04:35:29.983Z",
      "updated_at": "2025-11-22T04:35:29.983Z"
    },
    {
      "id": 3,
      "name": "Hồ Chí Minh",
      "code": "HCM",
      "region": "Miền Nam",
      "created_at": "2025-11-22T06:03:29.650Z",
      "updated_at": "2025-11-22T06:03:29.650Z"
    },
    {
      "id": 10,
      "name": "Huế",
      "code": "HU",
      "region": "Miền Trung",
      "created_at": "2025-11-22T06:03:34.443Z",
      "updated_at": "2025-11-22T06:03:34.443Z"
    },
    {
      "id": 9,
      "name": "Nha Trang",
      "code": "NT",
      "region": "Miền Trung",
      "created_at": "2025-11-22T06:03:33.780Z",
      "updated_at": "2025-11-22T06:03:33.780Z"
    },
    {
      "id": 11,
      "name": "Vũng Tàu",
      "code": "VT",
      "region": "Miền Nam",
      "created_at": "2025-11-22T06:03:35.104Z",
      "updated_at": "2025-11-22T06:03:35.104Z"
    }
  ]
}
```

---

## Reviews Module

### Get All Reviews

- **Endpoint**: `GET /reviews`
- **Status**: ❌ FAILED
- **HTTP Status**: 401
- **Response**:
```json
{
  "success": false,
  "error": "Token không được cung cấp"
}
```

---

### Get Product Reviews

- **Endpoint**: `GET /products/1/reviews`
- **Status**: ❌ FAILED
- **HTTP Status**: 401
- **Response**:
```json
{
  "success": false,
  "error": "Token không được cung cấp"
}
```

---

### Get Product Rating Stats

- **Endpoint**: `GET /products/1/rating-stats`
- **Status**: ❌ FAILED
- **HTTP Status**: 401
- **Response**:
```json
{
  "success": false,
  "error": "Token không được cung cấp"
}
```

---

## Orders Module

### Get All Orders

- **Endpoint**: `GET /orders`
- **Status**: ❌ FAILED
- **HTTP Status**: 403
- **Response**:
```json
{
  "success": false,
  "error": "Không có quyền truy cập. Yêu cầu vai trò: admin, staff"
}
```

---

## Vouchers Module

### Get All Vouchers

- **Endpoint**: `GET /vouchers`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "vouchers": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 0,
      "totalRecords": 0
    }
  }
}
```

---

## Flashsales Module

### Get All Flashsales

- **Endpoint**: `GET /flashsales`
- **Status**: ✅ PASSED
- **HTTP Status**: 200
- **Response**:
```json
{
  "success": true,
  "data": {
    "flashsales": [
      {
        "id": 6,
        "name": "Flash Sale Đầu Tháng",
        "description": "Khuyến mãi đặc biệt đầu tháng",
        "start_time": "2025-11-27T06:06:02.486Z",
        "end_time": "2025-12-02T06:06:02.486Z",
        "status": "pending",
        "created_at": "2025-11-22T06:06:06.015Z",
        "updated_at": "2025-11-22T06:06:06.015Z",
        "flashsale_products": [
          {
            "id": 20,
            "flashsale_id": 6,
            "product_id": 1,
            "flash_price": "4200",
            "stock_limit": 100,
            "sold_count": 6,
            "created_at": "2025-11-22T06:06:06.924Z",
            "updated_at": "2025-11-22T06:06:06.924Z",
            "products": {
              "id": 1,
              "name": "Máy xung điện trị liệu Omron HV-F013 giảm đau cơ và khớp",
              "description": "Máy massage xung điện trị liệu Omron HV-F013 là giải pháp trị liệu bằng xung điện tại nhà đơn giản, nhỏ gọn, dễ sử dụng với 5 chế độ massage giúp giảm đau cơ và khớp mọi lúc mọi nơi.",
              "price": "6000",
              "category_id": 1,
              "supplier_id": 1,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "OMRON HEALTHCARE MANUFACTURING VN",
              "usage": "<p>Máy xung điện trị liệu Omron HV-F013 sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:</p><ul><li>Chặn cơn đau.</li><li>Kích hoạt giải phóng endorphin (như thuốc giảm đau tự nhiên).</li><li>Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).</li></ul>",
              "dosage": "<p><strong>Cách dùng</strong></p><p><i>Hướng dẫn đặt miếng dán (để trị liệu tối ưu):</i></p><ul><li>Đặt các miếng dán trên mỗi phía bị đau.</li><li>Phải sử dụng HAI MIẾNG DÁN.</li><li>Đặt các miếng dán cách chỗ đau ít nhất 2,5cm.</li><li>Không xếp chồng các miếng dán.</li><li>Không xịt, bôi thuốc hoặc kem lên da hoặc miếng dán.</li><li>Không dùng chung miếng dán.</li><li>Không di chuyển miếng dán sang vị trí khác khi máy vẫn bật.</li></ul><p><i>Bước 1:&nbsp;</i></p><p>Tắt máy, lắp pin: Đọc kỹ toàn bộ hướng dẫn sử dụng để đảm bảo an toàn và sử dụng đúng máy xung điện trị liệu này.</p><p><i>Bước 2:</i></p><p>Cắm dây vào phần bên dưới của máy và mỗi đầu dây còn lại được gắn với một miếng dán.</p><p><i>Bước 3:</i></p><p>Kiểm soát và đánh giá mức đau trước và sau trị liệu (là mức đau nhẹ đến 10 mức đau nhất). Đặt 2 miếng dán cách chỗ đau ít nhất 2,5cm. Không xếp chồng lên nhau. Để miếng dán trên vùng da sạch, khô và không bị thương tổn.</p><p><i>Bước 4:</i></p><ul><li>Ấn nút nguồn.</li><li>Ấn ▲ (lên) hoặc ▼ (xuống) để chọn 1 trong 5 chế độ. Không kết hợp được các chế độ với nhau.</li><li>Ấn nút Set Start (Cài đặt/Khởi động) để chọn chế độ. Máy sẽ bắt đầu liệu trình tại mức cường độ 1.</li></ul><p><i>Bước 5:</i></p><p>Ấn nút ▲ (lên) để tăng cường độ. Thiết lập cường độ cho cơn đau của bạn. Có đến 10 cường độ khác nhau.</p><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=SqX6iW4NbQY\"><iframe src=\"https://www.youtube.com/embed/SqX6iW4NbQY\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Người trưởng thành bị đau cấp tính hoặc mãn tính.</p>",
              "specification": "Hộp",
              "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
              "registNum": "240001004/PCBB-BYT",
              "brand": "OMRON",
              "producer": "OMRON HEALTHCARE MANUFACTURING VN",
              "manufactor": "Việt Nam",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "Ngừng sử dụng máy xung điện trị liệu Omron HV-F013 trong các trường hợp sau:Nếu bạn gặp phản ứng bất lợi (kích ứng da/đỏ/bỏng, đau đầu hoặc cảm giác đau đớn khác, hoặc nếu bạn cảm thấy bất thường khó chịu).Nếu cơn đau của bạn không cải thiện, trở nên nghiêm trọng mãn tính và nặng hơn, hoặc kéo dài trong hơn năm ngày.",
                  "question": "Khi nào ngừng sử dụng máy xung điện trị liệu Omron HV-F013?"
                },
                {
                  "answer": "Bắt đầu bằng một liệu trình 15 phút. Phải luôn tắt máy khi miếng dán vẫn đang còn lắp trên máy. Đánh giá cơn đau để kiểm tra xem có cải thiện hay không. Dừng điều trị nếu cơn đau đã giảm hoặc hết hẳn. Ấn nút nguồn để tiếp tục liệu trình 15 phút tiếp theo.",
                  "question": "Nên sử dụng máy xung điện trị liệu Omron HV-F013 trong bao lâu?"
                },
                {
                  "answer": "Sử dụng ngay khi bạn thấy đau. Bắt đầu sử dụng máy với 1 liệu trình (máy sẽ tự động tắt sau 15 phút). Hãy sử dụng máy để điều trị chỗ đau sớm để ngăn ngừa cơn đau trở nên tồi tệ hơn, hoặc thậm chí là trở thành bệnh mãn tính. Bạn nên kiểm soát chỗ đau sớm hơn để nó không đạt đến ngưỡng chịu đau cao, dẫn tới hạn chế các hoạt động hàng ngày của bạn.",
                  "question": "Khi nào nên bắt đầu dùng máy xung điện trị liệu Omron HV-F013?"
                },
                {
                  "answer": "Sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:Chặn cơn đau.Kích hoạt giải phóng endorphin (bằng thuốc giảm đau tự nhiên).Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).",
                  "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 có tính năng gì?"
                },
                {
                  "answer": "TENS (xung điện trị liệu kích thích thần kinh) là liệu pháp sử dụng các điện cực được đặt trên da để kích thích các dây thần kinh dưới da xung quanh giúp giảm đau, được các nhà vật lý trị liệu sử dụng trong vòng hơn 30 năm qua.",
                  "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 là gì?"
                }
              ],
              "sold_count": 5
            }
          },
          {
            "id": 21,
            "flashsale_id": 6,
            "product_id": 2,
            "flash_price": "554400",
            "stock_limit": 100,
            "sold_count": 24,
            "created_at": "2025-11-22T06:06:07.296Z",
            "updated_at": "2025-11-22T06:06:07.296Z",
            "products": {
              "id": 2,
              "name": "Máy mát xa bụng Fuji PG-2507 hỗ trợ làm ấm đều toàn thân, mang lại cảm giác dễ chịu cho cơ thể",
              "description": "Máy massage bụng Fuji PG-2507 có chất liệu bề mặt là sợi carbon tạo cảm giác rất thoải mái, thiết kế phù hợp với đường cong bụng, thẩm mỹ và khoa học. Sản phẩm kết hợp massage rung đa tầng và các tính năng sưởi ấm hồng ngoại, làm ấm tử cung, mang lại cảm giác dễ chịu và thư thái khi sử dụng.",
              "price": "792000",
              "category_id": 1,
              "supplier_id": 2,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "usage": "<p>Máy massage bụng Fuji PG-2507 được sử dụng để massage vùng bụng, làm ấm đều toàn thân, mang lại cảm giác dễ chịu cho cơ thể. Với công nghệ rung đa tầng và các tính năng sưởi ấm hồng ngoại, làm ấm tử cung, an toàn với nhiệt độ không đổi, sản phẩm là thiết bị hỗ trợ chăm sóc phụ nữ toàn diện hơn.</p>",
              "dosage": "<p><strong>Cách dùng</strong></p><ol><li>Sạc thiết bị bằng cách gắn cáp USB trực tiếp vào máy, chờ khoảng 2 - 3 giờ để sạc đầy.</li><li>Đeo thiết bị, điều chỉnh dây đàn hồi phù hợp.</li><li>Nhấn nút nguồn (power) để bật máy.</li><li>Nhấn nút nguồn (power) lần lượt để chọn chế độ rung 1 2 3.</li><li>Nhấn nút biểu tượng nhiệt độ lần lượt để điều chỉnh nhiệt độ 1 2 3.</li><li>Nhấn và giữ nút nguồn (power) trong 3 giây để tắt máy.</li></ol><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=634e1zqIYZE\"><iframe src=\"https://www.youtube.com/embed/634e1zqIYZE\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Máy massage bụng Fuji PG-2507 thích hợp cho phụ nữ, kể cả người đang trong thời kỳ kinh nguyệt và nhóm người bị thừa cân, táo bón.</p>",
              "specification": "Hộp",
              "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
              "registNum": "HK2209214219-1ER",
              "brand": "FUJI",
              "producer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "manufactor": "Trung Quốc",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "Sản phẩm đã vượt qua kiểm nghiệm, độ bức xạ thấp đến mức không đáng kể, chỉ 0.4, thấp hơn 1500 so với điện thoại di động. Vì vậy mọi người có thể yên tâm trong quá trình sử dụng.",
                  "question": "Máy mát xa bụng Fuji PG-2507 có bức xạ điện từ không?"
                },
                {
                  "answer": "Máy mát xa bụng Fuji PG-2507 có tới 3 mức điều chỉnh nhiệt độ linh hoạt và dễ dàng: 40°, 45°, 50°.",
                  "question": "Máy mát xa bụng Fuji PG-2507 có các mức nhiệt độ nào?"
                },
                {
                  "answer": "Những người mắc bệnh tim, bệnh tăng huyết áp, bệnh ung thư, khối u, bệnh rối loạn đông máu, bệnh mạch máu não, bệnh động kinh hoặc bệnh cấp tính và khẩn cấp khác đang được bác sĩ điều trị, không được sử dụng máy mát xa bụng Fuji PG-2507.",
                  "question": "Những đối tượng nào không được dùng máy mát xa bụng Fuji PG-2507?"
                },
                {
                  "answer": "Phụ nữ đang mang thai không nên dùng máy mát xa bụng Fuji PG-2507.",
                  "question": "Phụ nữ mang thai có dùng được máy mát xa bụng Fuji PG-2507 không?"
                },
                {
                  "answer": "Sạc thiết bị bằng cách gắn cáp USB trực tiếp vào máy, chờ khoảng 2 - 3 giờ để sạc đầy.",
                  "question": "Sạc máy mát xa bụng Fuji PG-2507 trong bao lâu?"
                }
              ],
              "sold_count": 2
            }
          },
          {
            "id": 22,
            "flashsale_id": 6,
            "product_id": 3,
            "flash_price": "1108100",
            "stock_limit": 100,
            "sold_count": 27,
            "created_at": "2025-11-22T06:06:07.662Z",
            "updated_at": "2025-11-22T06:06:07.662Z",
            "products": {
              "id": 3,
              "name": "Máy mát xa mắt Fuji PG-2404G15 giúp massage thái dương và các huyệt đạo khác ở vùng mắt",
              "description": "Máy massage mắt Fuji PG-2404G15 được thiết kế dựa trên cơ thể con người và phù hợp với mọi khuôn mặt. Sản phẩm nâng cấp đa dạng tính năng, công nghệ cốt lõi với cấu hình cao, giúp massage thái dương và các huyệt đạo khác ở vùng quanh mắt trên cơ sở tuần hoàn thông qua các chức năng khí nén, sưởi ấm và rung.",
              "price": "1583000",
              "category_id": 1,
              "supplier_id": 2,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "usage": "<p>Máy massage mắt Fuji PG-2404G15 được dùng để massage thái dương và <a href=\"https://nhathuoclongchau.com.vn/bai-viet/cac-huyet-dao-tren-co-the-bam-dung-huyet-chua-bach-benh-63948.html\">các huyệt đạo</a> khác ở vùng quanh mắt trên cơ sở tuần hoàn thông qua các chức năng khí nén, sưởi ấm và rung.</p>",
              "dosage": "<p><strong>Cách dùng</strong></p><p>1. Sạc thiết bị <a href=\"https://nhathuoclongchau.com.vn/trang-thiet-bi-y-te/may-massage\">máy massage</a> bằng cáp USB đi kèm theo máy, chờ khoảng 2 giờ để sạc đầy trước khi sử dụng.</p><p>2. Đeo thiết bị vào vùng mắt (như hình minh họa từ tờ HDSD đính kèm bên trong hộp).</p><p>3. Nhấn nút nguồn (power) để KHỞI ĐỘNG thiết bị.</p><p>4. Nhấn nút nguồn (power) lần lượt để THAY ĐỔI các phương pháp massage.</p><p>5. Nhấn nút nguồn (power) liên tiếp 2 lần để TẮT/MỞ chức năng hướng dẫn bằng giọng nói.</p><p>6. Nhấn nút biểu tượng nốt nhạc để ĐIỀU KHIỂN âm nhạc:</p><ul><li>Nhấn 1 lần để bắt đầu chơi nhạc.</li><li>Nhấn 1 lần để chuyển bài.</li><li>Nhấn 2 lần liên tiếp để chỉnh âm lượng.</li><li>Nhấn giữ 3 giây để ngừng chơi nhạc.</li></ul><p>7. Nhấn giữ nút nguồn (power) trong 3 giây để TẮT thiết bị.</p><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=uMxW2Frl0-k\"><iframe src=\"https://www.youtube.com/embed/uMxW2Frl0-k\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Máy massage mắt Fuji PG-2404G15 thích hợp sử dụng cho nhân viên văn phòng, học sinh – sinh viên, người bị thiếu ngủ, người lớn tuổi.</p>",
              "specification": "Hộp",
              "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
              "registNum": "ATE20171839",
              "brand": "FUJI",
              "producer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "manufactor": "Trung Quốc",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "Máy mát xa mắt Fuji PG-2404G15 thích hợp sử dụng cho nhân viên văn phòng, học sinh – sinh viên, người bị thiếu ngủ, người lớn tuổi.",
                  "question": "Máy mát xa mắt Fuji PG-2404G15 thích hợp sử dụng cho đối tượng nào?"
                },
                {
                  "answer": "Máy mát xa mắt Fuji PG-2404G15 được thiết kế theo cấu trúc của nhãn cầu, được điều khiển bởi các rung động vật lý có tần số khác nhau. Các kỹ thuật xoa bóp bao gồm: Mô phỏng bàn tay, lắc, búa, bấm huyệt và con lăn",
                  "question": "Máy mát xa mắt Fuji PG-2404G15 mát xa đa điểm với những kỹ thuật nào?"
                },
                {
                  "answer": "Nhấn nút biểu tượng nốt nhạc để ĐIỀU KHIỂN âm nhạc:Nhấn 1 lần để bắt đầu chơi nhạc.Nhấn 1 lần để chuyển bài.Nhấn 2 lần liên tiếp để chỉnh âm lượng.Nhấn giữ 3 giây để ngừng chơi nhạc.",
                  "question": "Cách điều khiển âm nhạc khi dùng máy mát xa mắt Fuji PG-2404G15 như thế nào?"
                },
                {
                  "answer": "Sạc thiết bị bằng cáp USB đi kèm theo máy, chờ khoảng 2 giờ để sạc đầy trước khi sử dụng.",
                  "question": "Sạc đầy máy mát xa mắt Fuji PG-2404G15 trong bao lâu?"
                },
                {
                  "answer": "Máy mát xa mắt Fuji PG-2404G15 có những tính năng nổi bật:Hướng dẫn sử dụng bằng giọng nói.Dung lượng pin lớn bền bỉ, cổng sạc Type C.Vải cotton thân thiện với da, thiết kế có thể tháo rời và giặt sạch.Nhiệt độ không đổi 42 độ C, mát xa áp suất, rung đa điểm.Thiết kế gập 180°.6 bài hát tích hợp sẵn, thư giãn khi dùng.",
                  "question": "Máy mát xa mắt Fuji PG-2404G15 có những tính năng nổi bật gì?"
                }
              ],
              "sold_count": 0
            }
          },
          {
            "id": 23,
            "flashsale_id": 6,
            "product_id": 4,
            "flash_price": "103600",
            "stock_limit": 100,
            "sold_count": 15,
            "created_at": "2025-11-22T06:06:08.024Z",
            "updated_at": "2025-11-22T06:06:08.024Z",
            "products": {
              "id": 4,
              "name": "Dụng cụ massage bàn chân Duy Thành ngăn ngừa bệnh tật, phong thấp, thấp khớp (1 cái x 620gr)",
              "description": "Dụng cụ massage bàn chân Duy Thành là dụng cụ điều hòa kinh mạch chân, có thiết kế nhỏ gọn và dễ dàng sử dụng. Dụng cụ gồm 1 trục lăn được thiết kế đặc biệt để massage điểm phản ứng trong lòng bàn chân, kích thích thần kinh và cải thiện tuần hoàn máu, từ trường cân bằng thân thể và một huyệt “Dũng Tuyền” diên niên ích thọ.",
              "price": "148000",
              "category_id": 1,
              "supplier_id": 3,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "DUY THÀNH",
              "usage": "<p>Dụng cụ massage bàn chân Duy Thành có các chức năng trị bệnh như:</p>\n\n<ul>\n\t<li>Chà vùng bao tử để điều trị các chứng ăn không tiêu – đau nhức bao tử - kích thích hệ thần kinh bao tử (chà chân trái nhiều hơn chân mặt).</li>\n\t<li>Chà vùng tim để điều trị bệnh tim, giảm huyết áp.</li>\n\t<li>Chà vùng thận để điều trị bệnh <a href=\"https://nhathuoclongchau.com.vn/benh/tieu-dem-575.html\">tiểu đêm</a> và đau lưng.</li>\n\t<li>Chà hai bàn chân từ 10 – 20 phút (gót chân) để trị bệnh táo bón kinh niên. Khi đã đi cầu được thường xuyên (hằng ngày) thì ngưng chà.</li>\n\t<li>Chà hai bàn chân trị bệnh táo bón (gót chân).</li>\n\t<li>Chà vùng gan để trị bệnh làm biếng ăn – mất ngủ - suy nhược cơ thể.</li>\n\t<li>Chà vùng vàng (xem trên hình HDSD đính kèm bên trong hộp) có hiệu quả tốt cho lá lách.</li>\n</ul>",
              "dosage": "<p><strong>Cách dùng</strong></p>\n\n<p>1. Ngồi trên ghế, đặt hai chân trên trục lăn, lăn qua lăn lại 5 phút (khoảng 30 – 40 lần/phút).</p>\n\n<p>2. Đặt 2 chân lên 2 đầu dụng cụ, ma sát bàn chân để đạt được hiệu quả trị liệu từ trường.</p>\n\n<p>3. Uống 1 ly nước sau khi sử dụng bàn lăn chân.</p>\n\n<p><strong>Đối tượng sử dụng</strong></p>\n\n<p>Sản phẩm phù hợp với nhiều độ tuổi và đối tượng khác nhau.</p>",
              "specification": "Hộp x 620gr",
              "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
              "registNum": "190000313/PCBA-HCM",
              "brand": "Duy Thành",
              "producer": "DUY THÀNH",
              "manufactor": "Việt Nam",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "\r\n\r\nViệc massage ch&acirc;n được khuyến kh&iacute;ch cho những người ngồi l&acirc;u một chỗ, như:\r\n\r\n\r\n\t\r\n\tNh&acirc;n vi&ecirc;n văn ph&ograve;ng, t&agrave;i xế;\r\n\t\r\n\t\r\n\tHay đứng nhiều như gi&aacute;o vi&ecirc;n;&nbsp;\r\n\t\r\n\t\r\n\tNgười cao tuổi &iacute;t vận động;\r\n\t\r\n\t\r\n\tNgười c&oacute; tiền sử bệnh tim mạch hay thấp khớp.\r\n\t\r\n",
                  "question": "Massage chân thích hợp dùng cho những đối tượng nào?"
                },
                {
                  "answer": "Y học phương Đ&ocirc;ng cho rằng ch&acirc;n l&agrave; một bộ phận rất quan trọng. L&ograve;ng b&agrave;n ch&acirc;n l&agrave; nơi tập trung nhiều huyệt đạo trọng yếu nhất. Mỗi huyệt đạo tương ứng với một bộ phận trong nội tạng con người. V&igrave; thế việc xoa , ấn mỗi huyệt đạo ở b&agrave;n ch&acirc;n sẽ gi&uacute;p k&iacute;ch th&iacute;ch c&aacute;c bộ phận nội tạng trong cơ thể con người. Ngo&agrave;i ra, b&agrave;n ch&acirc;n l&agrave; những vị tr&iacute; xa tim nhất, v&igrave; vậy, việc bơm m&aacute;u đến ch&acirc;n kh&oacute; khăn hơn, đặc biệt đối với người cao tuổi n&ecirc;n thường dẫn đến c&aacute;c chứng t&ecirc; ch&acirc;n, đau khớp, nhứt mỏi, lạnh ch&acirc;n&hellip; V&igrave; thế massage l&ograve;ng b&agrave;n ch&acirc;n l&agrave; điều rất cần thiết, gi&uacute;p lưu th&ocirc;ng m&aacute;u v&agrave; t&aacute;c dụng thư gi&atilde;n to&agrave;n bộ hệ thần kinh tr&ecirc;n cơ thể.",
                  "question": "Tại sao nên massage lòng bàn chân?"
                },
                {
                  "answer": "Dụng cụ massage b&agrave;n ch&acirc;n chỉ ph&aacute;t huy t&aacute;c dụng nếu sử dụng đ&uacute;ng c&aacute;ch, đ&uacute;ng mức: Thời gian đầu khi bắt đầu sử dụng kh&ocirc;ng n&ecirc;n massage qu&aacute; 05 ph&uacute;t mỗi lần. Việc n&agrave;y l&agrave; cần thiết để mạch m&aacute;u ch&acirc;n v&agrave; cơ thể n&oacute;i chung th&iacute;ch nghi với t&aacute;c động li&ecirc;n tục của c&aacute;c gai massage t&aacute;c động trực tiếp l&ecirc;n huyệt đạo. C&oacute; thể tăng dần thời gian khi đ&atilde; quen, nhưng kh&ocirc;ng d&ugrave;ng qu&aacute; 15 ph&uacute;t mỗi lần, v&igrave; sẽ g&acirc;y k&iacute;ch th&iacute;ch qu&aacute; mức l&ecirc;n huyệt đạo g&acirc;y hại, phản t&aacute;c dụng.\r\n\r\n",
                  "question": "Nên dùng dụng cụ massage chân trong bao lâu?"
                },
                {
                  "answer": "Dụng cụ massage ch&acirc;n l&agrave; dụng cụ l&yacute; tưởng tăng cường sức khỏe bạn, gồm một trục lăn được thiết kế đặc biệt để massage điểm phản ứng trong l&ograve;ng b&agrave;n ch&acirc;n. K&iacute;ch th&iacute;ch thần kinh v&agrave; cải thiện sự tuần ho&agrave;n m&aacute;u, từ trường c&acirc;n bằng th&acirc;n thể v&agrave; một huyệt &quot;Dũng Tuyền&quot; di&ecirc;n ni&ecirc;n &iacute;ch thọ.\r\n\r\n",
                  "question": "Dụng cụ massage bàn chân có thiết kế thế nào?"
                },
                {
                  "answer": "Dụng cụ n&agrave;y rất dễ sử dụng, d&ugrave;ng được bất cứ l&uacute;c n&agrave;o, ở đ&acirc;u. V&iacute; dụ: L&uacute;c coi tivi, trong văn ph&ograve;ng l&agrave;m việc hoặc l&uacute;c nghỉ ngơi ở nh&agrave;.",
                  "question": "Khi nào nên dùng dụng cụ massage bàn chân?"
                }
              ],
              "sold_count": 0
            }
          },
          {
            "id": 24,
            "flashsale_id": 6,
            "product_id": 5,
            "flash_price": "1528100",
            "stock_limit": 100,
            "sold_count": 7,
            "created_at": "2025-11-22T06:06:08.432Z",
            "updated_at": "2025-11-22T06:06:08.432Z",
            "products": {
              "id": 5,
              "name": "Máy mát xa đầu gối Fuji PG-2015F3 hỗ trợ cải thiện lưu thông máu và giảm bớt sự khó chịu của khớp gối",
              "description": "Máy massage đầu gối Fuji PG-2015F3 được thiết kế theo nguyên tắc công thái học và kỹ thuật massage vật lý. Sản phẩm có thể cải thiện lưu thông máu và giảm bớt sự khó chịu của khớp gối thông qua massage bằng khí nén, massage rung, điều chỉnh thông minh và nén nóng nhiệt độ không đổi, kết hợp với ánh sáng đỏ có bước sóng 600nm-700nm.",
              "price": "2183000",
              "category_id": 1,
              "supplier_id": 2,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "usage": "<p>Máy massage đầu gối Fuji PG-2015F3 giúp cải thiện lưu thông máu và giảm bớt sự khó chịu của khớp gối thông qua massage bằng khí nén, massage rung, điều chỉnh thông minh và nén nóng nhiệt độ không đổi, kết hợp với ánh sáng đỏ có bước sóng 600nm-700nm.</p>",
              "dosage": "<p><strong>Cách dùng</strong></p><p><i>Cách đeo sản phẩm:</i></p><ol><li>Đặt sản phẩm lên đầu gối.</li><li>Sử dụng dây đeo số 1 luồn phía bên dưới, tăng đơ theo kích thước người sử dụng.</li><li>Dán cố định dây số 2 lần nữa phía dưới gối để sản phẩm được tiếp xúc chặt chẽ hơn.</li></ol><p><i>Cách sử dụng:</i></p><ol><li>Sạc thiết bị bằng cáp USB đi theo máy, chờ khoảng 4 giờ để sạc đầy trước khi sử dụng.</li><li>Nhấn và giữ nút nguồn (power) trong 2 giây để BẬT/TẮT máy.</li><li>Nhấn nút biểu tượng nhiệt độ \"heat\" để điều chỉnh các chế độ sưởi.</li><li>Nhấn nút biểu tượng \"air\" để điều chỉnh các chế độ áp suất không khí.</li><li>Nhấn nút biểu tượng \"vib\" để điều chỉnh các chế độ rung khác nhau.</li><li>Nhấn nút biểu tượng đồng hồ \"time\" để điều chỉnh các mức hẹn giờ hoạt động.</li></ol><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=uCLcXuITYaM\"><iframe src=\"https://www.youtube.com/embed/uCLcXuITYaM\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Máy massage đầu gối Fuji PG-2015F3 thích hợp cho nhiều người khác nhau: Người luyện tập thể thao, thường xuyên đứng và di chuyển, người có bệnh lý về khớp gối, người lớn tuổi,...</p>",
              "specification": "Hộp",
              "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
              "registNum": "ATE20200276",
              "brand": "FUJI",
              "producer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "manufactor": "Trung Quốc",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "Máy mát xa đầu gối Fuji PG-2015F3 với thiết kế 8 bóng đèn đỏ được sắp xếp để tạo ra ánh sáng mạnh mẽ, từ đó giúp làm giảm đau nhanh chóng. Bước sóng: 600nm – 700nm.",
                  "question": "Liệu pháp ánh sáng đỏ của máy mát xa đầu gối Fuji PG-2015F3 hoạt động như thế nào?"
                },
                {
                  "answer": "Làm sạch sản phẩm trước khi sử dụng.Không được sử dụng sản phẩm ở những nơi có nhiệt độ cao, dễ cháy, bức xạ điện từ hoặc độ ẩm.Không để sản phẩm bị va chạm hoặc ngâm trong nước và không được tháo rời trái phép sản phẩm.Bảo quản nơi khô thoáng, tránh nhiệt độ và độ ẩm cao. Để xa tầm tay trẻ em.",
                  "question": "Bảo quản máy mát xa đầu gối Fuji PG-2015F3 như thế nào?"
                },
                {
                  "answer": "Máy mát xa đầu gối Fuji PG-2015F3 có chức năng hẹn giờ 10/20/30 phút.",
                  "question": "Máy mát xa đầu gối Fuji PG-2015F3 có hẹn giờ được không?"
                },
                {
                  "answer": "Sạc thiết bị bằng cáp USB đi theo máy, chờ khoảng 4 giờ để sạc đầy trước khi sử dụng.",
                  "question": "Sạc máy mát xa đầu gối Fuji PG-2015F3 trong bao lâu?"
                },
                {
                  "answer": "Máy mát xa đầu gối Fuji PG-2015F3 không được sử dụng cho phụ nữ mang thai và những người mắc bệnh tim, huyết áp bất thường, khối u ác tính, bệnh mạch máu não, bệnh cấp tính hoặc đang điều trị.",
                  "question": "Máy mát xa đầu gối Fuji PG-2015F3 không dùng cho những đối tượng nào?"
                }
              ],
              "sold_count": 0
            }
          }
        ]
      },
      {
        "id": 5,
        "name": "Flash Sale Cuối Tuần",
        "description": "Giảm giá sốc cuối tuần",
        "start_time": "2025-11-20T06:06:02.486Z",
        "end_time": "2025-11-24T06:06:02.486Z",
        "status": "active",
        "created_at": "2025-11-22T06:06:02.979Z",
        "updated_at": "2025-11-22T06:06:02.979Z",
        "flashsale_products": [
          {
            "id": 15,
            "flashsale_id": 5,
            "product_id": 1,
            "flash_price": "4200",
            "stock_limit": 100,
            "sold_count": 22,
            "created_at": "2025-11-22T06:06:03.728Z",
            "updated_at": "2025-11-22T06:06:03.728Z",
            "products": {
              "id": 1,
              "name": "Máy xung điện trị liệu Omron HV-F013 giảm đau cơ và khớp",
              "description": "Máy massage xung điện trị liệu Omron HV-F013 là giải pháp trị liệu bằng xung điện tại nhà đơn giản, nhỏ gọn, dễ sử dụng với 5 chế độ massage giúp giảm đau cơ và khớp mọi lúc mọi nơi.",
              "price": "6000",
              "category_id": 1,
              "supplier_id": 1,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "OMRON HEALTHCARE MANUFACTURING VN",
              "usage": "<p>Máy xung điện trị liệu Omron HV-F013 sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:</p><ul><li>Chặn cơn đau.</li><li>Kích hoạt giải phóng endorphin (như thuốc giảm đau tự nhiên).</li><li>Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).</li></ul>",
              "dosage": "<p><strong>Cách dùng</strong></p><p><i>Hướng dẫn đặt miếng dán (để trị liệu tối ưu):</i></p><ul><li>Đặt các miếng dán trên mỗi phía bị đau.</li><li>Phải sử dụng HAI MIẾNG DÁN.</li><li>Đặt các miếng dán cách chỗ đau ít nhất 2,5cm.</li><li>Không xếp chồng các miếng dán.</li><li>Không xịt, bôi thuốc hoặc kem lên da hoặc miếng dán.</li><li>Không dùng chung miếng dán.</li><li>Không di chuyển miếng dán sang vị trí khác khi máy vẫn bật.</li></ul><p><i>Bước 1:&nbsp;</i></p><p>Tắt máy, lắp pin: Đọc kỹ toàn bộ hướng dẫn sử dụng để đảm bảo an toàn và sử dụng đúng máy xung điện trị liệu này.</p><p><i>Bước 2:</i></p><p>Cắm dây vào phần bên dưới của máy và mỗi đầu dây còn lại được gắn với một miếng dán.</p><p><i>Bước 3:</i></p><p>Kiểm soát và đánh giá mức đau trước và sau trị liệu (là mức đau nhẹ đến 10 mức đau nhất). Đặt 2 miếng dán cách chỗ đau ít nhất 2,5cm. Không xếp chồng lên nhau. Để miếng dán trên vùng da sạch, khô và không bị thương tổn.</p><p><i>Bước 4:</i></p><ul><li>Ấn nút nguồn.</li><li>Ấn ▲ (lên) hoặc ▼ (xuống) để chọn 1 trong 5 chế độ. Không kết hợp được các chế độ với nhau.</li><li>Ấn nút Set Start (Cài đặt/Khởi động) để chọn chế độ. Máy sẽ bắt đầu liệu trình tại mức cường độ 1.</li></ul><p><i>Bước 5:</i></p><p>Ấn nút ▲ (lên) để tăng cường độ. Thiết lập cường độ cho cơn đau của bạn. Có đến 10 cường độ khác nhau.</p><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=SqX6iW4NbQY\"><iframe src=\"https://www.youtube.com/embed/SqX6iW4NbQY\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Người trưởng thành bị đau cấp tính hoặc mãn tính.</p>",
              "specification": "Hộp",
              "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
              "registNum": "240001004/PCBB-BYT",
              "brand": "OMRON",
              "producer": "OMRON HEALTHCARE MANUFACTURING VN",
              "manufactor": "Việt Nam",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "Ngừng sử dụng máy xung điện trị liệu Omron HV-F013 trong các trường hợp sau:Nếu bạn gặp phản ứng bất lợi (kích ứng da/đỏ/bỏng, đau đầu hoặc cảm giác đau đớn khác, hoặc nếu bạn cảm thấy bất thường khó chịu).Nếu cơn đau của bạn không cải thiện, trở nên nghiêm trọng mãn tính và nặng hơn, hoặc kéo dài trong hơn năm ngày.",
                  "question": "Khi nào ngừng sử dụng máy xung điện trị liệu Omron HV-F013?"
                },
                {
                  "answer": "Bắt đầu bằng một liệu trình 15 phút. Phải luôn tắt máy khi miếng dán vẫn đang còn lắp trên máy. Đánh giá cơn đau để kiểm tra xem có cải thiện hay không. Dừng điều trị nếu cơn đau đã giảm hoặc hết hẳn. Ấn nút nguồn để tiếp tục liệu trình 15 phút tiếp theo.",
                  "question": "Nên sử dụng máy xung điện trị liệu Omron HV-F013 trong bao lâu?"
                },
                {
                  "answer": "Sử dụng ngay khi bạn thấy đau. Bắt đầu sử dụng máy với 1 liệu trình (máy sẽ tự động tắt sau 15 phút). Hãy sử dụng máy để điều trị chỗ đau sớm để ngăn ngừa cơn đau trở nên tồi tệ hơn, hoặc thậm chí là trở thành bệnh mãn tính. Bạn nên kiểm soát chỗ đau sớm hơn để nó không đạt đến ngưỡng chịu đau cao, dẫn tới hạn chế các hoạt động hàng ngày của bạn.",
                  "question": "Khi nào nên bắt đầu dùng máy xung điện trị liệu Omron HV-F013?"
                },
                {
                  "answer": "Sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:Chặn cơn đau.Kích hoạt giải phóng endorphin (bằng thuốc giảm đau tự nhiên).Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).",
                  "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 có tính năng gì?"
                },
                {
                  "answer": "TENS (xung điện trị liệu kích thích thần kinh) là liệu pháp sử dụng các điện cực được đặt trên da để kích thích các dây thần kinh dưới da xung quanh giúp giảm đau, được các nhà vật lý trị liệu sử dụng trong vòng hơn 30 năm qua.",
                  "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 là gì?"
                }
              ],
              "sold_count": 5
            }
          },
          {
            "id": 16,
            "flashsale_id": 5,
            "product_id": 2,
            "flash_price": "554400",
            "stock_limit": 100,
            "sold_count": 20,
            "created_at": "2025-11-22T06:06:04.102Z",
            "updated_at": "2025-11-22T06:06:04.102Z",
            "products": {
              "id": 2,
              "name": "Máy mát xa bụng Fuji PG-2507 hỗ trợ làm ấm đều toàn thân, mang lại cảm giác dễ chịu cho cơ thể",
              "description": "Máy massage bụng Fuji PG-2507 có chất liệu bề mặt là sợi carbon tạo cảm giác rất thoải mái, thiết kế phù hợp với đường cong bụng, thẩm mỹ và khoa học. Sản phẩm kết hợp massage rung đa tầng và các tính năng sưởi ấm hồng ngoại, làm ấm tử cung, mang lại cảm giác dễ chịu và thư thái khi sử dụng.",
              "price": "792000",
              "category_id": 1,
              "supplier_id": 2,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "usage": "<p>Máy massage bụng Fuji PG-2507 được sử dụng để massage vùng bụng, làm ấm đều toàn thân, mang lại cảm giác dễ chịu cho cơ thể. Với công nghệ rung đa tầng và các tính năng sưởi ấm hồng ngoại, làm ấm tử cung, an toàn với nhiệt độ không đổi, sản phẩm là thiết bị hỗ trợ chăm sóc phụ nữ toàn diện hơn.</p>",
              "dosage": "<p><strong>Cách dùng</strong></p><ol><li>Sạc thiết bị bằng cách gắn cáp USB trực tiếp vào máy, chờ khoảng 2 - 3 giờ để sạc đầy.</li><li>Đeo thiết bị, điều chỉnh dây đàn hồi phù hợp.</li><li>Nhấn nút nguồn (power) để bật máy.</li><li>Nhấn nút nguồn (power) lần lượt để chọn chế độ rung 1 2 3.</li><li>Nhấn nút biểu tượng nhiệt độ lần lượt để điều chỉnh nhiệt độ 1 2 3.</li><li>Nhấn và giữ nút nguồn (power) trong 3 giây để tắt máy.</li></ol><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=634e1zqIYZE\"><iframe src=\"https://www.youtube.com/embed/634e1zqIYZE\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Máy massage bụng Fuji PG-2507 thích hợp cho phụ nữ, kể cả người đang trong thời kỳ kinh nguyệt và nhóm người bị thừa cân, táo bón.</p>",
              "specification": "Hộp",
              "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
              "registNum": "HK2209214219-1ER",
              "brand": "FUJI",
              "producer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "manufactor": "Trung Quốc",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "Sản phẩm đã vượt qua kiểm nghiệm, độ bức xạ thấp đến mức không đáng kể, chỉ 0.4, thấp hơn 1500 so với điện thoại di động. Vì vậy mọi người có thể yên tâm trong quá trình sử dụng.",
                  "question": "Máy mát xa bụng Fuji PG-2507 có bức xạ điện từ không?"
                },
                {
                  "answer": "Máy mát xa bụng Fuji PG-2507 có tới 3 mức điều chỉnh nhiệt độ linh hoạt và dễ dàng: 40°, 45°, 50°.",
                  "question": "Máy mát xa bụng Fuji PG-2507 có các mức nhiệt độ nào?"
                },
                {
                  "answer": "Những người mắc bệnh tim, bệnh tăng huyết áp, bệnh ung thư, khối u, bệnh rối loạn đông máu, bệnh mạch máu não, bệnh động kinh hoặc bệnh cấp tính và khẩn cấp khác đang được bác sĩ điều trị, không được sử dụng máy mát xa bụng Fuji PG-2507.",
                  "question": "Những đối tượng nào không được dùng máy mát xa bụng Fuji PG-2507?"
                },
                {
                  "answer": "Phụ nữ đang mang thai không nên dùng máy mát xa bụng Fuji PG-2507.",
                  "question": "Phụ nữ mang thai có dùng được máy mát xa bụng Fuji PG-2507 không?"
                },
                {
                  "answer": "Sạc thiết bị bằng cách gắn cáp USB trực tiếp vào máy, chờ khoảng 2 - 3 giờ để sạc đầy.",
                  "question": "Sạc máy mát xa bụng Fuji PG-2507 trong bao lâu?"
                }
              ],
              "sold_count": 2
            }
          },
          {
            "id": 17,
            "flashsale_id": 5,
            "product_id": 3,
            "flash_price": "1108100",
            "stock_limit": 100,
            "sold_count": 26,
            "created_at": "2025-11-22T06:06:04.469Z",
            "updated_at": "2025-11-22T06:06:04.469Z",
            "products": {
              "id": 3,
              "name": "Máy mát xa mắt Fuji PG-2404G15 giúp massage thái dương và các huyệt đạo khác ở vùng mắt",
              "description": "Máy massage mắt Fuji PG-2404G15 được thiết kế dựa trên cơ thể con người và phù hợp với mọi khuôn mặt. Sản phẩm nâng cấp đa dạng tính năng, công nghệ cốt lõi với cấu hình cao, giúp massage thái dương và các huyệt đạo khác ở vùng quanh mắt trên cơ sở tuần hoàn thông qua các chức năng khí nén, sưởi ấm và rung.",
              "price": "1583000",
              "category_id": 1,
              "supplier_id": 2,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "usage": "<p>Máy massage mắt Fuji PG-2404G15 được dùng để massage thái dương và <a href=\"https://nhathuoclongchau.com.vn/bai-viet/cac-huyet-dao-tren-co-the-bam-dung-huyet-chua-bach-benh-63948.html\">các huyệt đạo</a> khác ở vùng quanh mắt trên cơ sở tuần hoàn thông qua các chức năng khí nén, sưởi ấm và rung.</p>",
              "dosage": "<p><strong>Cách dùng</strong></p><p>1. Sạc thiết bị <a href=\"https://nhathuoclongchau.com.vn/trang-thiet-bi-y-te/may-massage\">máy massage</a> bằng cáp USB đi kèm theo máy, chờ khoảng 2 giờ để sạc đầy trước khi sử dụng.</p><p>2. Đeo thiết bị vào vùng mắt (như hình minh họa từ tờ HDSD đính kèm bên trong hộp).</p><p>3. Nhấn nút nguồn (power) để KHỞI ĐỘNG thiết bị.</p><p>4. Nhấn nút nguồn (power) lần lượt để THAY ĐỔI các phương pháp massage.</p><p>5. Nhấn nút nguồn (power) liên tiếp 2 lần để TẮT/MỞ chức năng hướng dẫn bằng giọng nói.</p><p>6. Nhấn nút biểu tượng nốt nhạc để ĐIỀU KHIỂN âm nhạc:</p><ul><li>Nhấn 1 lần để bắt đầu chơi nhạc.</li><li>Nhấn 1 lần để chuyển bài.</li><li>Nhấn 2 lần liên tiếp để chỉnh âm lượng.</li><li>Nhấn giữ 3 giây để ngừng chơi nhạc.</li></ul><p>7. Nhấn giữ nút nguồn (power) trong 3 giây để TẮT thiết bị.</p><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=uMxW2Frl0-k\"><iframe src=\"https://www.youtube.com/embed/uMxW2Frl0-k\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Máy massage mắt Fuji PG-2404G15 thích hợp sử dụng cho nhân viên văn phòng, học sinh – sinh viên, người bị thiếu ngủ, người lớn tuổi.</p>",
              "specification": "Hộp",
              "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
              "registNum": "ATE20171839",
              "brand": "FUJI",
              "producer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "manufactor": "Trung Quốc",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "Máy mát xa mắt Fuji PG-2404G15 thích hợp sử dụng cho nhân viên văn phòng, học sinh – sinh viên, người bị thiếu ngủ, người lớn tuổi.",
                  "question": "Máy mát xa mắt Fuji PG-2404G15 thích hợp sử dụng cho đối tượng nào?"
                },
                {
                  "answer": "Máy mát xa mắt Fuji PG-2404G15 được thiết kế theo cấu trúc của nhãn cầu, được điều khiển bởi các rung động vật lý có tần số khác nhau. Các kỹ thuật xoa bóp bao gồm: Mô phỏng bàn tay, lắc, búa, bấm huyệt và con lăn",
                  "question": "Máy mát xa mắt Fuji PG-2404G15 mát xa đa điểm với những kỹ thuật nào?"
                },
                {
                  "answer": "Nhấn nút biểu tượng nốt nhạc để ĐIỀU KHIỂN âm nhạc:Nhấn 1 lần để bắt đầu chơi nhạc.Nhấn 1 lần để chuyển bài.Nhấn 2 lần liên tiếp để chỉnh âm lượng.Nhấn giữ 3 giây để ngừng chơi nhạc.",
                  "question": "Cách điều khiển âm nhạc khi dùng máy mát xa mắt Fuji PG-2404G15 như thế nào?"
                },
                {
                  "answer": "Sạc thiết bị bằng cáp USB đi kèm theo máy, chờ khoảng 2 giờ để sạc đầy trước khi sử dụng.",
                  "question": "Sạc đầy máy mát xa mắt Fuji PG-2404G15 trong bao lâu?"
                },
                {
                  "answer": "Máy mát xa mắt Fuji PG-2404G15 có những tính năng nổi bật:Hướng dẫn sử dụng bằng giọng nói.Dung lượng pin lớn bền bỉ, cổng sạc Type C.Vải cotton thân thiện với da, thiết kế có thể tháo rời và giặt sạch.Nhiệt độ không đổi 42 độ C, mát xa áp suất, rung đa điểm.Thiết kế gập 180°.6 bài hát tích hợp sẵn, thư giãn khi dùng.",
                  "question": "Máy mát xa mắt Fuji PG-2404G15 có những tính năng nổi bật gì?"
                }
              ],
              "sold_count": 0
            }
          },
          {
            "id": 18,
            "flashsale_id": 5,
            "product_id": 4,
            "flash_price": "103600",
            "stock_limit": 100,
            "sold_count": 18,
            "created_at": "2025-11-22T06:06:04.838Z",
            "updated_at": "2025-11-22T06:06:04.838Z",
            "products": {
              "id": 4,
              "name": "Dụng cụ massage bàn chân Duy Thành ngăn ngừa bệnh tật, phong thấp, thấp khớp (1 cái x 620gr)",
              "description": "Dụng cụ massage bàn chân Duy Thành là dụng cụ điều hòa kinh mạch chân, có thiết kế nhỏ gọn và dễ dàng sử dụng. Dụng cụ gồm 1 trục lăn được thiết kế đặc biệt để massage điểm phản ứng trong lòng bàn chân, kích thích thần kinh và cải thiện tuần hoàn máu, từ trường cân bằng thân thể và một huyệt “Dũng Tuyền” diên niên ích thọ.",
              "price": "148000",
              "category_id": 1,
              "supplier_id": 3,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "DUY THÀNH",
              "usage": "<p>Dụng cụ massage bàn chân Duy Thành có các chức năng trị bệnh như:</p>\n\n<ul>\n\t<li>Chà vùng bao tử để điều trị các chứng ăn không tiêu – đau nhức bao tử - kích thích hệ thần kinh bao tử (chà chân trái nhiều hơn chân mặt).</li>\n\t<li>Chà vùng tim để điều trị bệnh tim, giảm huyết áp.</li>\n\t<li>Chà vùng thận để điều trị bệnh <a href=\"https://nhathuoclongchau.com.vn/benh/tieu-dem-575.html\">tiểu đêm</a> và đau lưng.</li>\n\t<li>Chà hai bàn chân từ 10 – 20 phút (gót chân) để trị bệnh táo bón kinh niên. Khi đã đi cầu được thường xuyên (hằng ngày) thì ngưng chà.</li>\n\t<li>Chà hai bàn chân trị bệnh táo bón (gót chân).</li>\n\t<li>Chà vùng gan để trị bệnh làm biếng ăn – mất ngủ - suy nhược cơ thể.</li>\n\t<li>Chà vùng vàng (xem trên hình HDSD đính kèm bên trong hộp) có hiệu quả tốt cho lá lách.</li>\n</ul>",
              "dosage": "<p><strong>Cách dùng</strong></p>\n\n<p>1. Ngồi trên ghế, đặt hai chân trên trục lăn, lăn qua lăn lại 5 phút (khoảng 30 – 40 lần/phút).</p>\n\n<p>2. Đặt 2 chân lên 2 đầu dụng cụ, ma sát bàn chân để đạt được hiệu quả trị liệu từ trường.</p>\n\n<p>3. Uống 1 ly nước sau khi sử dụng bàn lăn chân.</p>\n\n<p><strong>Đối tượng sử dụng</strong></p>\n\n<p>Sản phẩm phù hợp với nhiều độ tuổi và đối tượng khác nhau.</p>",
              "specification": "Hộp x 620gr",
              "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
              "registNum": "190000313/PCBA-HCM",
              "brand": "Duy Thành",
              "producer": "DUY THÀNH",
              "manufactor": "Việt Nam",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "\r\n\r\nViệc massage ch&acirc;n được khuyến kh&iacute;ch cho những người ngồi l&acirc;u một chỗ, như:\r\n\r\n\r\n\t\r\n\tNh&acirc;n vi&ecirc;n văn ph&ograve;ng, t&agrave;i xế;\r\n\t\r\n\t\r\n\tHay đứng nhiều như gi&aacute;o vi&ecirc;n;&nbsp;\r\n\t\r\n\t\r\n\tNgười cao tuổi &iacute;t vận động;\r\n\t\r\n\t\r\n\tNgười c&oacute; tiền sử bệnh tim mạch hay thấp khớp.\r\n\t\r\n",
                  "question": "Massage chân thích hợp dùng cho những đối tượng nào?"
                },
                {
                  "answer": "Y học phương Đ&ocirc;ng cho rằng ch&acirc;n l&agrave; một bộ phận rất quan trọng. L&ograve;ng b&agrave;n ch&acirc;n l&agrave; nơi tập trung nhiều huyệt đạo trọng yếu nhất. Mỗi huyệt đạo tương ứng với một bộ phận trong nội tạng con người. V&igrave; thế việc xoa , ấn mỗi huyệt đạo ở b&agrave;n ch&acirc;n sẽ gi&uacute;p k&iacute;ch th&iacute;ch c&aacute;c bộ phận nội tạng trong cơ thể con người. Ngo&agrave;i ra, b&agrave;n ch&acirc;n l&agrave; những vị tr&iacute; xa tim nhất, v&igrave; vậy, việc bơm m&aacute;u đến ch&acirc;n kh&oacute; khăn hơn, đặc biệt đối với người cao tuổi n&ecirc;n thường dẫn đến c&aacute;c chứng t&ecirc; ch&acirc;n, đau khớp, nhứt mỏi, lạnh ch&acirc;n&hellip; V&igrave; thế massage l&ograve;ng b&agrave;n ch&acirc;n l&agrave; điều rất cần thiết, gi&uacute;p lưu th&ocirc;ng m&aacute;u v&agrave; t&aacute;c dụng thư gi&atilde;n to&agrave;n bộ hệ thần kinh tr&ecirc;n cơ thể.",
                  "question": "Tại sao nên massage lòng bàn chân?"
                },
                {
                  "answer": "Dụng cụ massage b&agrave;n ch&acirc;n chỉ ph&aacute;t huy t&aacute;c dụng nếu sử dụng đ&uacute;ng c&aacute;ch, đ&uacute;ng mức: Thời gian đầu khi bắt đầu sử dụng kh&ocirc;ng n&ecirc;n massage qu&aacute; 05 ph&uacute;t mỗi lần. Việc n&agrave;y l&agrave; cần thiết để mạch m&aacute;u ch&acirc;n v&agrave; cơ thể n&oacute;i chung th&iacute;ch nghi với t&aacute;c động li&ecirc;n tục của c&aacute;c gai massage t&aacute;c động trực tiếp l&ecirc;n huyệt đạo. C&oacute; thể tăng dần thời gian khi đ&atilde; quen, nhưng kh&ocirc;ng d&ugrave;ng qu&aacute; 15 ph&uacute;t mỗi lần, v&igrave; sẽ g&acirc;y k&iacute;ch th&iacute;ch qu&aacute; mức l&ecirc;n huyệt đạo g&acirc;y hại, phản t&aacute;c dụng.\r\n\r\n",
                  "question": "Nên dùng dụng cụ massage chân trong bao lâu?"
                },
                {
                  "answer": "Dụng cụ massage ch&acirc;n l&agrave; dụng cụ l&yacute; tưởng tăng cường sức khỏe bạn, gồm một trục lăn được thiết kế đặc biệt để massage điểm phản ứng trong l&ograve;ng b&agrave;n ch&acirc;n. K&iacute;ch th&iacute;ch thần kinh v&agrave; cải thiện sự tuần ho&agrave;n m&aacute;u, từ trường c&acirc;n bằng th&acirc;n thể v&agrave; một huyệt &quot;Dũng Tuyền&quot; di&ecirc;n ni&ecirc;n &iacute;ch thọ.\r\n\r\n",
                  "question": "Dụng cụ massage bàn chân có thiết kế thế nào?"
                },
                {
                  "answer": "Dụng cụ n&agrave;y rất dễ sử dụng, d&ugrave;ng được bất cứ l&uacute;c n&agrave;o, ở đ&acirc;u. V&iacute; dụ: L&uacute;c coi tivi, trong văn ph&ograve;ng l&agrave;m việc hoặc l&uacute;c nghỉ ngơi ở nh&agrave;.",
                  "question": "Khi nào nên dùng dụng cụ massage bàn chân?"
                }
              ],
              "sold_count": 0
            }
          },
          {
            "id": 19,
            "flashsale_id": 5,
            "product_id": 5,
            "flash_price": "1528100",
            "stock_limit": 100,
            "sold_count": 29,
            "created_at": "2025-11-22T06:06:05.205Z",
            "updated_at": "2025-11-22T06:06:05.205Z",
            "products": {
              "id": 5,
              "name": "Máy mát xa đầu gối Fuji PG-2015F3 hỗ trợ cải thiện lưu thông máu và giảm bớt sự khó chịu của khớp gối",
              "description": "Máy massage đầu gối Fuji PG-2015F3 được thiết kế theo nguyên tắc công thái học và kỹ thuật massage vật lý. Sản phẩm có thể cải thiện lưu thông máu và giảm bớt sự khó chịu của khớp gối thông qua massage bằng khí nén, massage rung, điều chỉnh thông minh và nén nóng nhiệt độ không đổi, kết hợp với ánh sáng đỏ có bước sóng 600nm-700nm.",
              "price": "2183000",
              "category_id": 1,
              "supplier_id": 2,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "usage": "<p>Máy massage đầu gối Fuji PG-2015F3 giúp cải thiện lưu thông máu và giảm bớt sự khó chịu của khớp gối thông qua massage bằng khí nén, massage rung, điều chỉnh thông minh và nén nóng nhiệt độ không đổi, kết hợp với ánh sáng đỏ có bước sóng 600nm-700nm.</p>",
              "dosage": "<p><strong>Cách dùng</strong></p><p><i>Cách đeo sản phẩm:</i></p><ol><li>Đặt sản phẩm lên đầu gối.</li><li>Sử dụng dây đeo số 1 luồn phía bên dưới, tăng đơ theo kích thước người sử dụng.</li><li>Dán cố định dây số 2 lần nữa phía dưới gối để sản phẩm được tiếp xúc chặt chẽ hơn.</li></ol><p><i>Cách sử dụng:</i></p><ol><li>Sạc thiết bị bằng cáp USB đi theo máy, chờ khoảng 4 giờ để sạc đầy trước khi sử dụng.</li><li>Nhấn và giữ nút nguồn (power) trong 2 giây để BẬT/TẮT máy.</li><li>Nhấn nút biểu tượng nhiệt độ \"heat\" để điều chỉnh các chế độ sưởi.</li><li>Nhấn nút biểu tượng \"air\" để điều chỉnh các chế độ áp suất không khí.</li><li>Nhấn nút biểu tượng \"vib\" để điều chỉnh các chế độ rung khác nhau.</li><li>Nhấn nút biểu tượng đồng hồ \"time\" để điều chỉnh các mức hẹn giờ hoạt động.</li></ol><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=uCLcXuITYaM\"><iframe src=\"https://www.youtube.com/embed/uCLcXuITYaM\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Máy massage đầu gối Fuji PG-2015F3 thích hợp cho nhiều người khác nhau: Người luyện tập thể thao, thường xuyên đứng và di chuyển, người có bệnh lý về khớp gối, người lớn tuổi,...</p>",
              "specification": "Hộp",
              "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
              "registNum": "ATE20200276",
              "brand": "FUJI",
              "producer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "manufactor": "Trung Quốc",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "Máy mát xa đầu gối Fuji PG-2015F3 với thiết kế 8 bóng đèn đỏ được sắp xếp để tạo ra ánh sáng mạnh mẽ, từ đó giúp làm giảm đau nhanh chóng. Bước sóng: 600nm – 700nm.",
                  "question": "Liệu pháp ánh sáng đỏ của máy mát xa đầu gối Fuji PG-2015F3 hoạt động như thế nào?"
                },
                {
                  "answer": "Làm sạch sản phẩm trước khi sử dụng.Không được sử dụng sản phẩm ở những nơi có nhiệt độ cao, dễ cháy, bức xạ điện từ hoặc độ ẩm.Không để sản phẩm bị va chạm hoặc ngâm trong nước và không được tháo rời trái phép sản phẩm.Bảo quản nơi khô thoáng, tránh nhiệt độ và độ ẩm cao. Để xa tầm tay trẻ em.",
                  "question": "Bảo quản máy mát xa đầu gối Fuji PG-2015F3 như thế nào?"
                },
                {
                  "answer": "Máy mát xa đầu gối Fuji PG-2015F3 có chức năng hẹn giờ 10/20/30 phút.",
                  "question": "Máy mát xa đầu gối Fuji PG-2015F3 có hẹn giờ được không?"
                },
                {
                  "answer": "Sạc thiết bị bằng cáp USB đi theo máy, chờ khoảng 4 giờ để sạc đầy trước khi sử dụng.",
                  "question": "Sạc máy mát xa đầu gối Fuji PG-2015F3 trong bao lâu?"
                },
                {
                  "answer": "Máy mát xa đầu gối Fuji PG-2015F3 không được sử dụng cho phụ nữ mang thai và những người mắc bệnh tim, huyết áp bất thường, khối u ác tính, bệnh mạch máu não, bệnh cấp tính hoặc đang điều trị.",
                  "question": "Máy mát xa đầu gối Fuji PG-2015F3 không dùng cho những đối tượng nào?"
                }
              ],
              "sold_count": 0
            }
          }
        ]
      },
      {
        "id": 2,
        "name": "Flash Sale Siêu Giảm Giá 11/11",
        "description": "Giảm giá cực mạnh trong 24h",
        "start_time": "2025-10-30T12:49:00.000Z",
        "end_time": "2025-11-11T23:59:59.000Z",
        "status": "ended",
        "created_at": "2025-10-30T05:48:49.222Z",
        "updated_at": "2025-10-30T05:48:49.222Z",
        "flashsale_products": [
          {
            "id": 11,
            "flashsale_id": 2,
            "product_id": 1,
            "flash_price": "89000",
            "stock_limit": 100,
            "sold_count": 0,
            "created_at": "2025-10-30T05:48:49.222Z",
            "updated_at": "2025-10-30T05:48:49.222Z",
            "products": {
              "id": 1,
              "name": "Máy xung điện trị liệu Omron HV-F013 giảm đau cơ và khớp",
              "description": "Máy massage xung điện trị liệu Omron HV-F013 là giải pháp trị liệu bằng xung điện tại nhà đơn giản, nhỏ gọn, dễ sử dụng với 5 chế độ massage giúp giảm đau cơ và khớp mọi lúc mọi nơi.",
              "price": "6000",
              "category_id": 1,
              "supplier_id": 1,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "OMRON HEALTHCARE MANUFACTURING VN",
              "usage": "<p>Máy xung điện trị liệu Omron HV-F013 sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:</p><ul><li>Chặn cơn đau.</li><li>Kích hoạt giải phóng endorphin (như thuốc giảm đau tự nhiên).</li><li>Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).</li></ul>",
              "dosage": "<p><strong>Cách dùng</strong></p><p><i>Hướng dẫn đặt miếng dán (để trị liệu tối ưu):</i></p><ul><li>Đặt các miếng dán trên mỗi phía bị đau.</li><li>Phải sử dụng HAI MIẾNG DÁN.</li><li>Đặt các miếng dán cách chỗ đau ít nhất 2,5cm.</li><li>Không xếp chồng các miếng dán.</li><li>Không xịt, bôi thuốc hoặc kem lên da hoặc miếng dán.</li><li>Không dùng chung miếng dán.</li><li>Không di chuyển miếng dán sang vị trí khác khi máy vẫn bật.</li></ul><p><i>Bước 1:&nbsp;</i></p><p>Tắt máy, lắp pin: Đọc kỹ toàn bộ hướng dẫn sử dụng để đảm bảo an toàn và sử dụng đúng máy xung điện trị liệu này.</p><p><i>Bước 2:</i></p><p>Cắm dây vào phần bên dưới của máy và mỗi đầu dây còn lại được gắn với một miếng dán.</p><p><i>Bước 3:</i></p><p>Kiểm soát và đánh giá mức đau trước và sau trị liệu (là mức đau nhẹ đến 10 mức đau nhất). Đặt 2 miếng dán cách chỗ đau ít nhất 2,5cm. Không xếp chồng lên nhau. Để miếng dán trên vùng da sạch, khô và không bị thương tổn.</p><p><i>Bước 4:</i></p><ul><li>Ấn nút nguồn.</li><li>Ấn ▲ (lên) hoặc ▼ (xuống) để chọn 1 trong 5 chế độ. Không kết hợp được các chế độ với nhau.</li><li>Ấn nút Set Start (Cài đặt/Khởi động) để chọn chế độ. Máy sẽ bắt đầu liệu trình tại mức cường độ 1.</li></ul><p><i>Bước 5:</i></p><p>Ấn nút ▲ (lên) để tăng cường độ. Thiết lập cường độ cho cơn đau của bạn. Có đến 10 cường độ khác nhau.</p><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=SqX6iW4NbQY\"><iframe src=\"https://www.youtube.com/embed/SqX6iW4NbQY\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Người trưởng thành bị đau cấp tính hoặc mãn tính.</p>",
              "specification": "Hộp",
              "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
              "registNum": "240001004/PCBB-BYT",
              "brand": "OMRON",
              "producer": "OMRON HEALTHCARE MANUFACTURING VN",
              "manufactor": "Việt Nam",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "Ngừng sử dụng máy xung điện trị liệu Omron HV-F013 trong các trường hợp sau:Nếu bạn gặp phản ứng bất lợi (kích ứng da/đỏ/bỏng, đau đầu hoặc cảm giác đau đớn khác, hoặc nếu bạn cảm thấy bất thường khó chịu).Nếu cơn đau của bạn không cải thiện, trở nên nghiêm trọng mãn tính và nặng hơn, hoặc kéo dài trong hơn năm ngày.",
                  "question": "Khi nào ngừng sử dụng máy xung điện trị liệu Omron HV-F013?"
                },
                {
                  "answer": "Bắt đầu bằng một liệu trình 15 phút. Phải luôn tắt máy khi miếng dán vẫn đang còn lắp trên máy. Đánh giá cơn đau để kiểm tra xem có cải thiện hay không. Dừng điều trị nếu cơn đau đã giảm hoặc hết hẳn. Ấn nút nguồn để tiếp tục liệu trình 15 phút tiếp theo.",
                  "question": "Nên sử dụng máy xung điện trị liệu Omron HV-F013 trong bao lâu?"
                },
                {
                  "answer": "Sử dụng ngay khi bạn thấy đau. Bắt đầu sử dụng máy với 1 liệu trình (máy sẽ tự động tắt sau 15 phút). Hãy sử dụng máy để điều trị chỗ đau sớm để ngăn ngừa cơn đau trở nên tồi tệ hơn, hoặc thậm chí là trở thành bệnh mãn tính. Bạn nên kiểm soát chỗ đau sớm hơn để nó không đạt đến ngưỡng chịu đau cao, dẫn tới hạn chế các hoạt động hàng ngày của bạn.",
                  "question": "Khi nào nên bắt đầu dùng máy xung điện trị liệu Omron HV-F013?"
                },
                {
                  "answer": "Sử dụng công nghệ TENS (xung điện trị liệu kích thích thần kinh), điều trị không dùng thuốc được chứng minh lâm sàng giúp:Chặn cơn đau.Kích hoạt giải phóng endorphin (bằng thuốc giảm đau tự nhiên).Cải thiện lưu thông máu (kết quả của sự co cơ lặp đi lặp lại và thư giãn cơ bắp).",
                  "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 có tính năng gì?"
                },
                {
                  "answer": "TENS (xung điện trị liệu kích thích thần kinh) là liệu pháp sử dụng các điện cực được đặt trên da để kích thích các dây thần kinh dưới da xung quanh giúp giảm đau, được các nhà vật lý trị liệu sử dụng trong vòng hơn 30 năm qua.",
                  "question": "Trị liệu TENS của máy xung điện trị liệu Omron HV-F013 là gì?"
                }
              ],
              "sold_count": 5
            }
          },
          {
            "id": 12,
            "flashsale_id": 2,
            "product_id": 2,
            "flash_price": "129000",
            "stock_limit": 50,
            "sold_count": 0,
            "created_at": "2025-10-30T05:48:49.222Z",
            "updated_at": "2025-10-30T05:48:49.222Z",
            "products": {
              "id": 2,
              "name": "Máy mát xa bụng Fuji PG-2507 hỗ trợ làm ấm đều toàn thân, mang lại cảm giác dễ chịu cho cơ thể",
              "description": "Máy massage bụng Fuji PG-2507 có chất liệu bề mặt là sợi carbon tạo cảm giác rất thoải mái, thiết kế phù hợp với đường cong bụng, thẩm mỹ và khoa học. Sản phẩm kết hợp massage rung đa tầng và các tính năng sưởi ấm hồng ngoại, làm ấm tử cung, mang lại cảm giác dễ chịu và thư thái khi sử dụng.",
              "price": "792000",
              "category_id": 1,
              "supplier_id": 2,
              "image_url": null,
              "prescription_required": false,
              "created_at": "2025-09-30T05:22:18.892Z",
              "updated_at": "2025-09-30T05:22:18.892Z",
              "tax_fee": "0",
              "base_unit_id": 1,
              "images": [
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_09558_e6aff0a9a7.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_06483_48f732a455.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/DSC_00243_Recovered_1f462eafbf.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503416_dung_cu_massage_ban_chan_duy_thanh_7955_63f6_large_f667ee5d4c.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/12323_8fe7ce70aa.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/123_148809f0b1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/IMG_0310_bb7300afd1.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503418_dung_cu_massage_ngon_tay_duy_thanh_4561_63f6_large_d320b7c4f2.jpg",
                "https://cdn.nhathuoclongchau.com.vn/unsafe/https://cms-prod.s3-sgn09.fptcloud.com/00503417_dung_cu_dieu_hoa_kinh_mach_tay_duy_thanh_2763_63f6_large_882888ca45.jpg"
              ],
              "manufacturer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "usage": "<p>Máy massage bụng Fuji PG-2507 được sử dụng để massage vùng bụng, làm ấm đều toàn thân, mang lại cảm giác dễ chịu cho cơ thể. Với công nghệ rung đa tầng và các tính năng sưởi ấm hồng ngoại, làm ấm tử cung, an toàn với nhiệt độ không đổi, sản phẩm là thiết bị hỗ trợ chăm sóc phụ nữ toàn diện hơn.</p>",
              "dosage": "<p><strong>Cách dùng</strong></p><ol><li>Sạc thiết bị bằng cách gắn cáp USB trực tiếp vào máy, chờ khoảng 2 - 3 giờ để sạc đầy.</li><li>Đeo thiết bị, điều chỉnh dây đàn hồi phù hợp.</li><li>Nhấn nút nguồn (power) để bật máy.</li><li>Nhấn nút nguồn (power) lần lượt để chọn chế độ rung 1 2 3.</li><li>Nhấn nút biểu tượng nhiệt độ lần lượt để điều chỉnh nhiệt độ 1 2 3.</li><li>Nhấn và giữ nút nguồn (power) trong 3 giây để tắt máy.</li></ol><figure class=\"media\"><div data-oembed-url=\"https://www.youtube.com/watch?v=634e1zqIYZE\"><iframe src=\"https://www.youtube.com/embed/634e1zqIYZE\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></figure><p><strong>Đối tượng sử dụng</strong></p><p>Máy massage bụng Fuji PG-2507 thích hợp cho phụ nữ, kể cả người đang trong thời kỳ kinh nguyệt và nhóm người bị thừa cân, táo bón.</p>",
              "specification": "Hộp",
              "adverseEffect": "<p>Chưa có báo cáo về tác dụng phụ của sản phẩm.</p>",
              "registNum": "HK2209214219-1ER",
              "brand": "FUJI",
              "producer": "SHENZHEN PANGO MEDICAL ELECTRONICS CO., LTD",
              "manufactor": "Trung Quốc",
              "legalDeclaration": null,
              "faq": [
                {
                  "answer": "Sản phẩm đã vượt qua kiểm nghiệm, độ bức xạ thấp đến mức không đáng kể, chỉ 0.4, thấp hơn 1500 so với điện thoại di động. Vì vậy mọi người có thể yên tâm trong quá trình sử dụng.",
                  "question": "Máy mát xa bụng Fuji PG-2507 có bức xạ điện từ không?"
                },
                {
                  "answer": "Máy mát xa bụng Fuji PG-2507 có tới 3 mức điều chỉnh nhiệt độ linh hoạt và dễ dàng: 40°, 45°, 50°.",
                  "question": "Máy mát xa bụng Fuji PG-2507 có các mức nhiệt độ nào?"
                },
                {
                  "answer": "Những người mắc bệnh tim, bệnh tăng huyết áp, bệnh ung thư, khối u, bệnh rối loạn đông máu, bệnh mạch máu não, bệnh động kinh hoặc bệnh cấp tính và khẩn cấp khác đang được bác sĩ điều trị, không được sử dụng máy mát xa bụng Fuji PG-2507.",
                  "question": "Những đối tượng nào không được dùng máy mát xa bụng Fuji PG-2507?"
                },
                {
                  "answer": "Phụ nữ đang mang thai không nên dùng máy mát xa bụng Fuji PG-2507.",
                  "question": "Phụ nữ mang thai có dùng được máy mát xa bụng Fuji PG-2507 không?"
                },
                {
                  "answer": "Sạc thiết bị bằng cách gắn cáp USB trực tiếp vào máy, chờ khoảng 2 - 3 giờ để sạc đầy.",
                  "question": "Sạc máy mát xa bụng Fuji PG-2507 trong bao lâu?"
                }
              ],
              "sold_count": 2
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalRecords": 3
    }
  }
}
```

---

### Get Active Flashsales

- **Endpoint**: `GET /flashsales/active`
- **Status**: ❌ FAILED
- **HTTP Status**: 401
- **Response**:
```json
{
  "success": false,
  "error": "Token không được cung cấp"
}
```

---

