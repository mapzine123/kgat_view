// s3Storage.js
import { s3Client, Upload } from './s3Config';
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_BUCKET_NAME = process.env.REACT_APP_S3_BUCKET_NAME ? 
    process.env.REACT_APP_S3_BUCKET_NAME.trim() : 'un9';
const AWS_REGION = process.env.REACT_APP_AWS_REGION || 'ap-northeast-2';

console.log("Bucket name:", S3_BUCKET_NAME);
console.log("Region:", AWS_REGION);

// 서명된 URL 가져오기 함수 추가
export const getPresignedUrl = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME || 'un9',
      Key: key
    });
    
    // URL 유효 기간: 1일
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 86400 });
    return signedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
};

// 이미지 업로드 함수
export const uploadImage = (file, userId, onProgress) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 파일명 처리 - 모든 특수문자 및 비ASCII 문자 제거
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${userId}_${Date.now()}_${sanitizedName}`;
      const key = `article_images/${fileName}`;
      
      const uploadParams = {
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: file.type
        // ACL 제거: 버킷에서 ACL이 비활성화되어 있음
      };
      
      const upload = new Upload({
        client: s3Client,
        params: uploadParams
      });
      
      upload.on("httpUploadProgress", (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        if (onProgress) onProgress(percentage);
      });
      
      const result = await upload.done();
      
      // 서명된 URL 생성
      const signedUrl = await getPresignedUrl(key);
      
      resolve({
        url: signedUrl, // 서명된 URL 사용
        name: fileName,
        path: key
      });
    } catch (err) {
      console.error('S3 업로드 에러:', err);
      reject(err);
    }
  });
};

// 이미지 삭제 함수
export const deleteImage = async (imagePath) => {
  try {
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: imagePath
    };
    
    const command = new DeleteObjectCommand(params);
    const response = await s3Client.send(command);
    return response;
  } catch (err) {
    console.error('S3 삭제 에러:', err);
    throw err;
  }
};