import fs from 'fs';
import multer from 'multer';
import path from 'path';

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(process.cwd(), 'uploads', 'reviews');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Chỉ cho phép ảnh và video
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ upload ảnh hoặc video!'), false);
  }
};

export const reviewUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 } // Tối đa 10MB/file, 5 file
});
