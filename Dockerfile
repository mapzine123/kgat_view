# 빌드 단계
FROM node:18-alpine AS build

WORKDIR /app

# package.json과 package-lock.json을 먼저 복사하여 종속성을 캐싱 (빌드 속도 개선)
COPY package*.json ./
RUN npm ci --only=production

COPY . .
# 환경 변수 설정 (React 최적 빌드를 위해)
ENV NODE_ENV=production
RUN npm run build

# 실행 단계
FROM nginx:stable-alpine

# React 빌드 결과를 Nginx 정적 파일 폴더로 복사
COPY --from=build /app/build /usr/share/nginx/html

# Nginx 기본 설정 수정 (React 라우팅 문제 해결)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
