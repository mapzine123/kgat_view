// s3Config.js
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// 환경 변수가 제대로 로드되지 않을 경우를 대비해 하드코딩된 값도 설정
const AWS_REGION = process.env.REACT_APP_AWS_REGION || 'ap-northeast-2';
console.log("Using AWS Region:", AWS_REGION);

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
  }
});

export { s3Client, Upload };