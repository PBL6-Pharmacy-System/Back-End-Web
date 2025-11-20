# 📋 Detailed API Test Results with Input/Output
**Date:** 2025-11-20  
**Time:** 18:06 UTC  
**Test Type:** Complete API Testing with Sample Data

---

## 🎯 Test Summary

All endpoints tested with real input data and captured output responses.

---


## Test 1: Health Check

**Module:** Core  
**Endpoint:** `GET http://localhost:3000/health`  
**Authentication:** Not Required  
**Description:** Check server health status

### Request

```bash
curl -X GET "http://localhost:3000/health"
```

### Response

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-20T11:08:41.505Z"
}
```

**Status:** ✅ PASS

---


## Test 2: API Root

**Module:** Core  
**Endpoint:** `GET http://localhost:3000/`  
**Authentication:** Not Required  
**Description:** Get API information and available endpoints

### Request

```bash
curl -X GET "http://localhost:3000/"
```

### Response

```json
{
  "success": true,
  "message": "PBL6 Pharmacy API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "api": "/api"
  }
}
```

**Status:** ✅ PASS

---


## Test 3: Login

**Module:** Authentication  
**Endpoint:** `POST http://localhost:3000/api/auth/login`  
**Authentication:** Not Required  
**Description:** User authentication with credentials

### Request

```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1763631135","password":"password123"}'
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 25,
      "username": "testuser1763631135",
      "email": "testuser1763631135@test.com",
      "phone": "0983631135",
      "role_id": 3,
      "full_name": "Test User",
      "avatar_url": null,
      "created_at": "2025-11-20T09:32:17.086Z",
      "updated_at": "2025-11-20T09:32:17.086Z",
      "is_active": true,
      "is_verified": false,
      "last_login": "2025-11-20T11:08:40.882Z",
      "roles": {
        "id": 3,
        "role_name": "customer",
        "description": "Customer with basic access",
        "created_at": "2025-11-19T13:12:03.451Z",
        "updated_at": "2025-11-19T13:12:03.451Z"
      },
      "customers": {
        "id": 10,
        "user_id": 25,
        "dob": null,
        "gender": null,
        "address": null,
        "created_at": "2025-11-20T09:32:17.713Z",
        "updated_at": "2025-11-20T09:32:17.713Z"
      },
      "staff": null,
      "admin": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI1LCJ1c2VybmFtZSI6InRlc3R1c2VyMTc2MzYzMTEzNSIsImVtYWlsIjoidGVzdHVzZXIxNzYzNjMxMTM1QHRlc3QuY29tIiwicm9sZV9pZCI6Mywicm9sZV9uYW1lIjoiY3VzdG9tZXIiLCJjdXN0b21lcl9pZCI6MTAsImlhdCI6MTc2MzYzNjkyMywiZXhwIjoxNzYzNjM3ODIzfQ.x5OYsmilSzuDbQRn3FlC-_wyIjQagpASlddloUSwm_M",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI1LCJpYXQiOjE3NjM2MzY5MjMsImV4cCI6MTc2NDI0MTcyM30.BfgRsOmq445KQT2rpEUmh-DoG_3QjK45eFHlfkHu6PA"
  }
}
```

**Status:** ✅ PASS

---


## Test 4: List Products

**Module:** Products  
**Endpoint:** `GET http://localhost:3000/api/products?page=1&limit=3`  
**Authentication:** Not Required  
**Description:** Get paginated list of products

### Request

```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=3"
```

### Response

```json
{
  "products": [
    {
      "id": 914,
      "name": "Bàn chải đánh răng điện Oral-B Pro600 D16.513 loại bỏ các mảng bám, làm sạch răng và khoang miệng cho người lớn",
      "description": "Bàn chải đánh răng người lớn cao cấp Oral-B Pro600 D16.513 là sản phẩm chăm sóc sức khỏe răng miệng hiệu quả với tốc độ quay 8800 vòng/phút, hỗ trợ làm sạch các mảng bám cứng đầu trên răng, mang đến nụ cười trắng sáng tự tin.",
      "price": "2222222",
      "stock": 100,
      "category_id": 116,
      "supplier_id": 406,
      "image_url": null,
      "prescription_required": false,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z",
      "tax_fee": "0",
      "base_unit_id": 1,
      "images": [],
      "manufacturer": "P&G",
      "usage": "<p>Loại bỏ được mảng bám và vết ố vàng trên răng.</p><p>Cải thiện sức khoẻ của nướu răng.</p><p>Loại bỏ được mùi hôi của khoang miệng nhờ mặt sau của bàn chải khi tiếp xúc với lưỡi.</p><p>Massage nướu răng hiệu quả.</p><p>Làm sạch tốt nhưng vẫn đảm bảo nhẹ nhàng với nướu và răng.</p>",
      "dosage": "<p><strong>Cách dùng</strong></p><p>Rửa đầu bàn chải với nước lạnh.</p><p>Sau đó cho một lượng <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/kem-danh-rang\">kem đánh răng</a> vừa đủ lên lông bàn chải.</p><p>Cầm bàn chải theo góc 45 độ và đánh dọc theo đường viền cơ lợi.</p><p>Súc miệng bằng nước để không còn bọt kem trong miệng.</p><p><strong>Đối tượng sử dụng</strong></p><p>Dùng cho người lớn.</p>",
      "specification": "Hộp",
      "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
      "registNum": "TCCS 05:2019/DTNH",
      "brand": "Oral-B",
      "producer": "P&G",
      "manufactor": "Đức",
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
      "id": 909,
      "name": "Bàn chải đánh răng điện Oral-B Vitality Crossaction Blue làm sạch mảng bám trên răng",
      "description": "Bàn chải đánh răng điện Oral-B Vitality CrossAction Blue là một trong những sản phẩm của Oral-B được các nha sỹ tại Viện răng hàm mặt quốc tế khuyên dùng. Với thiết kế đầu bàn chải lông siêu mềm, an toàn và phù hợp với răng nướu, chế độ đầu bàn chải xoay tròn giúp cho việc làm sạch các mảng bám và vi khuẩn một cách toàn diện, nhanh chóng. ",
      "price": "499500",
      "stock": 100,
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
      "stock": 100,
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
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 3,
    "totalPages": 335,
    "totalRecords": 1004
  }
}
```

**Status:** ✅ PASS

---


## Test 5: Get Product by ID

**Module:** Products  
**Endpoint:** `GET http://localhost:3000/api/products/914`  
**Authentication:** Not Required  
**Description:** Get detailed information for specific product

### Request

```bash
curl -X GET "http://localhost:3000/api/products/914"
```

### Response

```json
{
  "id": 914,
  "name": "Bàn chải đánh răng điện Oral-B Pro600 D16.513 loại bỏ các mảng bám, làm sạch răng và khoang miệng cho người lớn",
  "description": "Bàn chải đánh răng người lớn cao cấp Oral-B Pro600 D16.513 là sản phẩm chăm sóc sức khỏe răng miệng hiệu quả với tốc độ quay 8800 vòng/phút, hỗ trợ làm sạch các mảng bám cứng đầu trên răng, mang đến nụ cười trắng sáng tự tin.",
  "price": "2222222",
  "stock": 100,
  "category_id": 116,
  "supplier_id": 406,
  "image_url": null,
  "prescription_required": false,
  "created_at": "2025-09-30T05:22:18.892Z",
  "updated_at": "2025-09-30T05:22:18.892Z",
  "tax_fee": "0",
  "base_unit_id": 1,
  "images": [],
  "manufacturer": "P&G",
  "usage": "<p>Loại bỏ được mảng bám và vết ố vàng trên răng.</p><p>Cải thiện sức khoẻ của nướu răng.</p><p>Loại bỏ được mùi hôi của khoang miệng nhờ mặt sau của bàn chải khi tiếp xúc với lưỡi.</p><p>Massage nướu răng hiệu quả.</p><p>Làm sạch tốt nhưng vẫn đảm bảo nhẹ nhàng với nướu và răng.</p>",
  "dosage": "<p><strong>Cách dùng</strong></p><p>Rửa đầu bàn chải với nước lạnh.</p><p>Sau đó cho một lượng <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/kem-danh-rang\">kem đánh răng</a> vừa đủ lên lông bàn chải.</p><p>Cầm bàn chải theo góc 45 độ và đánh dọc theo đường viền cơ lợi.</p><p>Súc miệng bằng nước để không còn bọt kem trong miệng.</p><p><strong>Đối tượng sử dụng</strong></p><p>Dùng cho người lớn.</p>",
  "specification": "Hộp",
  "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
  "registNum": "TCCS 05:2019/DTNH",
  "brand": "Oral-B",
  "producer": "P&G",
  "manufactor": "Đức",
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
  },
  "productunits": []
}
```

**Status:** ✅ PASS

---


## Test 6: Search Products

**Module:** Products  
**Endpoint:** `GET http://localhost:3000/api/products/search?q=oral&page=1&limit=3`  
**Authentication:** Not Required  
**Description:** Search products by keyword

### Request

```bash
curl -X GET "http://localhost:3000/api/products/search?q=oral&page=1&limit=3"
```

### Response

```json
{
  "products": [
    {
      "id": 914,
      "name": "Bàn chải đánh răng điện Oral-B Pro600 D16.513 loại bỏ các mảng bám, làm sạch răng và khoang miệng cho người lớn",
      "description": "Bàn chải đánh răng người lớn cao cấp Oral-B Pro600 D16.513 là sản phẩm chăm sóc sức khỏe răng miệng hiệu quả với tốc độ quay 8800 vòng/phút, hỗ trợ làm sạch các mảng bám cứng đầu trên răng, mang đến nụ cười trắng sáng tự tin.",
      "price": "2222222",
      "stock": 100,
      "category_id": 116,
      "supplier_id": 406,
      "image_url": null,
      "prescription_required": false,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z",
      "tax_fee": "0",
      "base_unit_id": 1,
      "images": [],
      "manufacturer": "P&G",
      "usage": "<p>Loại bỏ được mảng bám và vết ố vàng trên răng.</p><p>Cải thiện sức khoẻ của nướu răng.</p><p>Loại bỏ được mùi hôi của khoang miệng nhờ mặt sau của bàn chải khi tiếp xúc với lưỡi.</p><p>Massage nướu răng hiệu quả.</p><p>Làm sạch tốt nhưng vẫn đảm bảo nhẹ nhàng với nướu và răng.</p>",
      "dosage": "<p><strong>Cách dùng</strong></p><p>Rửa đầu bàn chải với nước lạnh.</p><p>Sau đó cho một lượng <a href=\"https://nhathuoclongchau.com.vn/cham-soc-ca-nhan/kem-danh-rang\">kem đánh răng</a> vừa đủ lên lông bàn chải.</p><p>Cầm bàn chải theo góc 45 độ và đánh dọc theo đường viền cơ lợi.</p><p>Súc miệng bằng nước để không còn bọt kem trong miệng.</p><p><strong>Đối tượng sử dụng</strong></p><p>Dùng cho người lớn.</p>",
      "specification": "Hộp",
      "adverseEffect": "<p>Chưa có thông tin về tác dụng phụ của sản phẩm.</p>",
      "registNum": "TCCS 05:2019/DTNH",
      "brand": "Oral-B",
      "producer": "P&G",
      "manufactor": "Đức",
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
      "id": 909,
      "name": "Bàn chải đánh răng điện Oral-B Vitality Crossaction Blue làm sạch mảng bám trên răng",
      "description": "Bàn chải đánh răng điện Oral-B Vitality CrossAction Blue là một trong những sản phẩm của Oral-B được các nha sỹ tại Viện răng hàm mặt quốc tế khuyên dùng. Với thiết kế đầu bàn chải lông siêu mềm, an toàn và phù hợp với răng nướu, chế độ đầu bàn chải xoay tròn giúp cho việc làm sạch các mảng bám và vi khuẩn một cách toàn diện, nhanh chóng. ",
      "price": "499500",
      "stock": 100,
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
      "stock": 100,
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
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 3,
    "totalPages": 5,
    "totalRecords": 15
  }
}
```

**Status:** ✅ PASS

---


## Test 7: Best Sellers

**Module:** Products  
**Endpoint:** `GET http://localhost:3000/api/products/best-sellers?limit=3`  
**Authentication:** Not Required  
**Description:** Get list of best-selling products

### Request

```bash
curl -X GET "http://localhost:3000/api/products/best-sellers?limit=3"
```

### Response

```json
{
  "success": true,
  "data": []
}
```

**Status:** ✅ PASS

---


## Test 8: List Categories

**Module:** Categories  
**Endpoint:** `GET http://localhost:3000/api/categories?page=1&limit=5`  
**Authentication:** Not Required  
**Description:** Get all product categories

### Request

```bash
curl -X GET "http://localhost:3000/api/categories?page=1&limit=5"
```

### Response

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
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 5,
    "totalPages": 32
  }
}
```

**Status:** ✅ PASS

---


## Test 9: Get Category by ID

**Module:** Categories  
**Endpoint:** `GET http://localhost:3000/api/categories/116`  
**Authentication:** Not Required  
**Description:** Get specific category with products

### Request

```bash
curl -X GET "http://localhost:3000/api/categories/116"
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 116,
    "name": "Bàn chải điện",
    "description": null,
    "parent_id": null,
    "created_at": "2025-09-30T05:22:18.892Z",
    "updated_at": "2025-09-30T05:22:18.892Z"
  }
}
```

**Status:** ✅ PASS

---


## Test 10: List Suppliers

**Module:** Suppliers  
**Endpoint:** `GET http://localhost:3000/api/suppliers?page=1&limit=5`  
**Authentication:** Not Required  
**Description:** Get all suppliers

### Request

```bash
curl -X GET "http://localhost:3000/api/suppliers?page=1&limit=5"
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 402,
      "name": "A&D ELECTRONICS(SHENZEN) CO.,LTD",
      "contact_info": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z",
      "_count": {
        "products": 2
      }
    },
    {
      "id": 413,
      "name": "ABBOTT BIOLOGICALS B.V",
      "contact_info": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z",
      "_count": {
        "products": 1
      }
    },
    {
      "id": 293,
      "name": "ABBOTT MANUFACTURING SINGAPORE PRIVATE LIMITED",
      "contact_info": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z",
      "_count": {
        "products": 4
      }
    },
    {
      "id": 290,
      "name": "ABBOTT NUTRITION",
      "contact_info": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z",
      "_count": {
        "products": 2
      }
    },
    {
      "id": 15,
      "name": "Acne",
      "contact_info": null,
      "created_at": "2025-09-30T05:22:18.892Z",
      "updated_at": "2025-09-30T05:22:18.892Z",
      "_count": {
        "products": 1
      }
    }
  ],
  "pagination": {
    "total": 431,
    "page": 1,
    "limit": 5,
    "totalPages": 87
  }
}
```

**Status:** ✅ PASS

---


## Test 11: Get Customer Cart

**Module:** Cart  
**Endpoint:** `GET http://localhost:3000/api/cart/10`  
**Authentication:** Required  
**Description:** Get shopping cart for customer

### Request

```bash
curl -X GET "http://localhost:3000/api/cart/10" \
  -H "Authorization: Bearer $TOKEN"
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 10,
    "customer_id": 10,
    "voucher_id": null,
    "shipping_address_id": null,
    "total_amount": "0",
    "discount_amount": "0",
    "final_amount": "0",
    "status": "cart",
    "order_date": "2025-11-20T09:33:25.411Z",
    "updated_at": "2025-11-20T09:33:25.412Z",
    "orderitems": []
  }
}
```

**Status:** ✅ PASS

---


## Test 12: Get Cart Summary

**Module:** Cart  
**Endpoint:** `GET http://localhost:3000/api/cart/10/summary`  
**Authentication:** Required  
**Description:** Get cart summary with totals and item count

### Request

```bash
curl -X GET "http://localhost:3000/api/cart/10/summary" \
  -H "Authorization: Bearer $TOKEN"
```

### Response

```json
{
  "success": true,
  "data": {
    "cartId": 10,
    "itemCount": 0,
    "subtotal": 0,
    "discount": 0,
    "total": 0,
    "items": []
  }
}
```

**Status:** ✅ PASS

---


## Test 13: Get Customer Orders

**Module:** Orders  
**Endpoint:** `GET http://localhost:3000/api/customers/10/orders?page=1&limit=5`  
**Authentication:** Required  
**Description:** Get order history for customer

### Request

```bash
curl -X GET "http://localhost:3000/api/customers/10/orders?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Response

```json
{
  "success": true,
  "data": {
    "orders": [],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

**Status:** ✅ PASS

---


## Test 14: List Vouchers

**Module:** Promotions  
**Endpoint:** `GET http://localhost:3000/api/vouchers?page=1&limit=5`  
**Authentication:** Not Required  
**Description:** Get available vouchers

### Request

```bash
curl -X GET "http://localhost:3000/api/vouchers?page=1&limit=5"
```

### Response

```json
{
  "success": true,
  "data": {
    "vouchers": [],
    "pagination": {
      "page": 1,
      "limit": 5,
      "totalPages": 0,
      "totalRecords": 0
    }
  }
}
```

**Status:** ✅ PASS

---


## Test 15: List Flashsales

**Module:** Promotions  
**Endpoint:** `GET http://localhost:3000/api/flashsales?page=1&limit=5`  
**Authentication:** Not Required  
**Description:** Get all flashsale campaigns

### Request

```bash
curl -X GET "http://localhost:3000/api/flashsales?page=1&limit=5"
```

### Response

```json
{
  "success": true,
  "data": {
    "flashsales": [
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
              "stock": 100,
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
              "sold_count": 0
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
              "stock": 100,
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
              "sold_count": 0
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "totalPages": 1,
      "totalRecords": 1
    }
  }
}
```

**Status:** ✅ PASS

---


## Test 16: Get Active Flashsale

**Module:** Promotions  
**Endpoint:** `GET http://localhost:3000/api/flashsales/active`  
**Authentication:** Not Required  
**Description:** Get currently active flashsale

### Request

```bash
curl -X GET "http://localhost:3000/api/flashsales/active"
```

### Response

```json
{
  "success": true,
  "data": null
}
```

**Status:** ✅ PASS

---


## Test 17: Get Product Reviews

**Module:** Reviews  
**Endpoint:** `GET http://localhost:3000/api/reviews?product_id=914&page=1&limit=5`  
**Authentication:** Not Required  
**Description:** Get reviews for specific product

### Request

```bash
curl -X GET "http://localhost:3000/api/reviews?product_id=914&page=1&limit=5"
```

### Response

```json
{
  "success": true,
  "data": {
    "reviews": [],
    "pagination": {
      "page": 1,
      "limit": 5,
      "totalPages": 0,
      "totalRecords": 0
    }
  }
}
```

**Status:** ✅ PASS

---


## Test 18: List Branches

**Module:** Inventory  
**Endpoint:** `GET http://localhost:3000/api/branches?page=1&limit=5`  
**Authentication:** Not Required  
**Description:** Get all store branches

### Request

```bash
curl -X GET "http://localhost:3000/api/branches?page=1&limit=5"
```

### Response

```json
{
  "success": true,
  "data": {
    "branches": [],
    "pagination": {
      "page": 1,
      "limit": 5,
      "totalPages": 0,
      "totalRecords": 0
    }
  }
}
```

**Status:** ✅ PASS

---


## Test 19: Get Customer Prescriptions

**Module:** Medical  
**Endpoint:** `GET http://localhost:3000/api/customers/10/prescriptions?page=1&limit=5`  
**Authentication:** Required  
**Description:** Get prescriptions for customer

### Request

```bash
curl -X GET "http://localhost:3000/api/customers/10/prescriptions?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Response

```json
{
  "success": true,
  "data": {
    "prescriptions": [],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

**Status:** ✅ PASS

---


## Test 20: Get User Notifications

**Module:** Notifications  
**Endpoint:** `GET http://localhost:3000/api/notifications?page=1&limit=5`  
**Authentication:** Required  
**Description:** Get notifications for authenticated user

### Request

```bash
curl -X GET "http://localhost:3000/api/notifications?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 5,
    "totalPages": 0
  }
}
```

**Status:** ✅ PASS

---


## Test 21: Get Customer Addresses

**Module:** Shipping  
**Endpoint:** `GET http://localhost:3000/api/customers/10/shipping-addresses`  
**Authentication:** Required  
**Description:** Get shipping addresses for customer

### Request

```bash
curl -X GET "http://localhost:3000/api/customers/10/shipping-addresses" \
  -H "Authorization: Bearer $TOKEN"
```

### Response

```json
{
  "success": true,
  "data": []
}
```

**Status:** ✅ PASS

---


## 📊 Test Execution Summary

**Total Tests:** 21  
**Date:** 2025-11-20  
**Time:** 18:06 UTC  
**Test Account:** testuser1763631135 (Customer ID: 10)

### Test Coverage

- **Core & Authentication:** 3 tests
- **Product Management:** 7 tests  
- **Cart & Checkout:** 2 tests
- **Order Management:** 1 test
- **Promotions:** 3 tests
- **Reviews:** 1 test
- **Inventory:** 1 test
- **Medical:** 1 test
- **Notifications:** 1 test
- **Shipping:** 1 test

### Authentication Details

**Test Token:**
```
Token obtained from login endpoint
Customer ID: 10
Expiry: 15 minutes
```

### Notes

1. All responses are real data from the database
2. Pagination parameters used where applicable
3. Authentication token required for customer-specific endpoints
4. All timestamps are in UTC

---

**Document Generated:** 2025-11-20 18:06 UTC  
**Server:** http://localhost:3000  
**Database:** PostgreSQL (Supabase)
