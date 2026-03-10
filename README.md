# Vibly — 커플을 위한 AI 데이트 플래너 앱

커플의 취향과 데이트 기록을 바탕으로 AI가 맞춤 데이트 코스를 추천해주는 React Native 앱입니다.

---

## 주요 기능

### AI 장소 추천
- 자연어 입력 기반 무드 검색 ("비 오는 날 감성 카페 추천해줘")
- Gemini AI + 카카오 로컬 API를 활용한 실제 장소 검색
- 날씨·시간대·취향 바이브 반영 스마트 추천

### 커플 라운지
- 커플 초대 및 연결
- **AI 데이트 코스 분석**: 커플의 북마크·데이트 기록 기반 하루 타임라인 자동 생성
- **AI 대화형 데이트 비서**: 프리미엄 전용 대화형 코스 추천 (이미지 첨부 지원)
- 데이트 플랜 저장 및 관리
- 추억 사진 업로드

### 장소 탐색
- 카카오 지도 기반 주변 장소 검색
- 장소 북마크, 체크인, 리뷰

### 크레딧 & 구독
- 출석 체크 크레딧 적립
- 프리미엄 구독 관리

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React Native (Expo SDK 54) |
| 언어 | TypeScript |
| 상태관리 | Zustand |
| 네비게이션 | Expo Router (파일 기반) |
| 스타일링 | React Native StyleSheet |
| API 통신 | Axios (인터셉터 기반 토큰 갱신) |
| 인증 | JWT (Access + Refresh Token) |
| 지도 | 카카오 로컬 API |
| AI | Google Gemini 2.5 Flash |
| 알림 | Expo Notifications |
| 이미지 | expo-image-picker, expo-image |
| 위치 | expo-location |

---

## 프로젝트 구조

```
Vibly/
├── app/                    # Expo Router 페이지
│   ├── (auth)/             # 온보딩, 로그인, 회원가입
│   ├── (tabs)/             # 하단 탭 (홈, 탐색, 커플, 마이)
│   ├── couple/             # 커플 라운지 서브 페이지
│   └── place/              # 장소 상세
├── src/
│   ├── components/         # 공통 + 기능별 컴포넌트
│   ├── services/           # API 서비스 레이어
│   ├── stores/             # Zustand 스토어
│   ├── hooks/              # 커스텀 훅
│   └── constants/          # 테마, 컬러, 폰트 등
```

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env에 API_BASE_URL, KAKAO_API_KEY 등 입력

# 개발 서버 실행
npx expo start
```

---

## 관련 저장소

- [Vibly-backend](https://github.com/KOR-Giseong/Vibly-backend) — NestJS API 서버
- [vibly-admin](https://github.com/KOR-Giseong/vibly-admin) — Next.js 관리자 웹
