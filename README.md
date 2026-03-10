<div align="center">

<img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Zustand-000000?style=for-the-badge&logo=react&logoColor=white" />

# 💜 Vibly

### 커플을 위한 AI 데이트 플래너

*AI가 두 사람의 취향을 분석해 완벽한 하루 데이트 코스를 설계해드립니다*

</div>

---

## ✨ 주요 기능

<table>
  <tr>
    <td width="50%">
      <h3>🤖 AI 장소 추천</h3>
      <ul>
        <li>자연어로 장소 검색<br><i>"비 오는 날 감성 카페 추천해줘"</i></li>
        <li>Gemini AI + 카카오 로컬 API 연동</li>
        <li>220+ 키워드 빠른 매칭 (Gemini 호출 최소화)</li>
        <li>날씨·시간대·취향 바이브 반영</li>
        <li>Google Places API로 사진·평점 보완</li>
      </ul>
    </td>
    <td width="50%">
      <h3>💑 커플 라운지</h3>
      <ul>
        <li><b>AI 데이트 코스 분석</b>: 커플 취향·북마크 기반 하루 타임라인 자동 생성 (카카오 실제 장소 포함)</li>
        <li><b>AI 대화형 데이트 비서</b>: 프리미엄 전용, 이미지 첨부 지원</li>
        <li>데이트 플랜 저장·관리</li>
        <li>추억 사진 업로드</li>
        <li>기념일 설정</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📍 장소 탐색</h3>
      <ul>
        <li>카카오 지도 기반 주변 장소 검색</li>
        <li>북마크 저장</li>
        <li>체크인 및 리뷰 작성</li>
        <li>취향 바이브 기반 장소 필터링</li>
      </ul>
    </td>
    <td width="50%">
      <h3>👤 마이페이지 & 커뮤니티</h3>
      <ul>
        <li>취향 바이브 설정</li>
        <li>출석 체크 크레딧 적립 (연속 7일 보너스)</li>
        <li>프리미엄 구독 관리</li>
        <li>커뮤니티 게시글·댓글</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React Native · Expo SDK 54 |
| 언어 | TypeScript |
| 상태관리 | Zustand |
| 네비게이션 | Expo Router (파일 기반 라우팅) |
| 스타일링 | React Native StyleSheet |
| API 통신 | Axios (인터셉터 기반 자동 토큰 갱신, 502/503 재시도) |
| 인증 | JWT (Access + Refresh Token) |
| 지도·장소 | 카카오 로컬 API |
| AI | Google Gemini 2.5 Flash |
| 알림 | Expo Notifications |
| 이미지 | expo-image-picker · expo-image |
| 위치 | expo-location |

---

## 🏗 아키텍처

```
사용자 입력
    │
    ▼
Expo Router (파일 기반 네비게이션)
    │
    ▼
Zustand Store (전역 상태 관리)
    │
    ▼
Service Layer (Axios 인터셉터)
    │
    ├── JWT 만료 시 자동 토큰 갱신
    └── 서버 다운 시 인증 상태 유지
```

---

## 📁 프로젝트 구조

```
Vibly/
├── app/
│   ├── (auth)/          # 온보딩, 로그인, 회원가입
│   ├── (tabs)/          # 홈 · 탐색 · 커플 · 마이
│   ├── couple/          # AI 분석, 데이트 비서, 플랜 폼
│   └── place/           # 장소 상세
└── src/
    ├── components/      # 공통 + 기능별 컴포넌트
    ├── services/        # API 서비스 레이어
    ├── stores/          # Zustand 스토어
    ├── hooks/           # 커스텀 훅
    └── constants/       # 테마 · 컬러 · 폰트
```

---

## 🚀 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env

# 3. 개발 서버 실행
npx expo start
```

---

## 🔗 관련 저장소

| 저장소 | 설명 |
|--------|------|
| [Vibly-backend](https://github.com/KOR-Giseong/Vibly-backend) | NestJS REST API 서버 |
| [vibly-admin](https://github.com/KOR-Giseong/vibly-admin) | Next.js 관리자 웹 |
