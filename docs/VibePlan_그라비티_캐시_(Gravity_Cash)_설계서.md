# 📋 VibePlan AI 설계 명세서 - 그라비티 캐시 (Gravity Cash)

**서비스 요약**: 화면의 중력을 거슬러 떠다니는 동전과 보상을 터치하여 획득하는 피지컬 기반의 앱테크 서비스입니다. 기발한 물리 효과를 즐기며 광고를 시청하고, 가볍게 용돈을 벌 수 있는 극강의 몰입감을 제공합니다.
**플랫폼**: 웹 애플리케이션
**타겟 타겟**: 일반 사용자

*본 문서는 VibePlan AI에 의해 생성된 마크다운 설계서 세트입니다.*

---

# 📑 1장. Vibe Check (서비스 기획서)

## 1. 서비스 정의 및 목적
**그라비티 캐시 (Gravity Cash)**는 기존의 지루하고 단순한 클릭형 앱테크(AppTech)에서 벗어나, 웹 브라우저 상에서 물리 엔진(Physics Engine) 기반으로 자유롭게 화면을 떠다니는 동전과 보상을 터치하여 획득하는 **피지컬 기반 게이밍 앱테크 서비스**입니다.
- **목적**: 기발한 물리 효과를 통해 사용자에게 즉각적인 시각적 재미와 타격감(손맛)을 제공하고, 이를 자연스러운 광고 시청과 리워드 획득으로 연결하여 리텐션을 극대화합니다.

## 2. 핵심 타겟 오디언스
- **주 타겟**: 모바일/웹 환경에서 가볍게 스낵 게임을 즐기며 소소하게 앱테크를 하고자 하는 MZ세대 및 직장인.
- **서브 타겟**: 직관적인 조작과 화려한 피드백을 선호하며 방치형/터치형 게임을 좋아하는 일반 사용자.

## 3. 서비스 핵심 가치 및 차별점
- **물리 시뮬레이션 기반 손맛**: 정형화된 리스트 UI 대신 HTML5 Canvas와 물리 엔진(Matter.js)을 활용하여 중력, 반발력, 마찰력이 적용된 가상 동전들을 터치하는 역동적인 UX를 제공합니다.
- **몰입형 리워드 루프**: 화면에 떠다니는 스페셜 '황금 동전'이나 '보물상자'를 터치하면 리워드 광고형 모달이 활성화되고, 광고 시청 완료 시 즉시 대량의 캐시를 적립합니다.
- **투명한 정산**: 쌓인 캐시를 기프티콘 교환 및 즉시 출금 신청으로 처리하는 직관적이고 빠른 정산 흐름을 보장합니다.

---

# ⚙️ 2장. Blueprint (데이터베이스 및 시스템 설계)

## 1. 데이터베이스 테이블 스키마 정의

### `users` (사용자 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 사용자 ID |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 주소 |
| `nickname` | VARCHAR(50) | NOT NULL | 사용자 닉네임 |
| `points` | INT | DEFAULT 0, CHECK (points >= 0) | 현재 보유 중인 캐시 포인트 |
| `created_at` | TIMESTAMP | DEFAULT NOW() | 회원 가입일 |

### `point_transactions` (포인트 적립/차감 이력)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 트랜잭션 고유 ID |
| `user_id` | UUID | FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE | 적립/차감 대상 유저 ID |
| `amount` | INT | NOT NULL | 변동 포인트액 (양수: 적립, 음수: 차감) |
| `type` | VARCHAR(50) | NOT NULL | 구분 (`TAP` / `AD_REWARD` / `WITHDRAWAL` / `EVENT`) |
| `description` | TEXT | | 상세 설명 |
| `created_at` | TIMESTAMP | DEFAULT NOW() | 생성 시각 |

### `withdrawals` (출금 신청 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 출금 신청 고유 ID |
| `user_id` | UUID | FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE | 출금 신청 유저 ID |
| `amount` | INT | NOT NULL | 출금 신청 포인트액 |
| `bank_name` | VARCHAR(50) | NOT NULL | 은행명 |
| `account_number` | VARCHAR(100) | NOT NULL | 계좌번호 |
| `status` | VARCHAR(20) | DEFAULT 'PENDING' | 상태 (`PENDING`, `APPROVED`, `REJECTED`) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | 신청일시 |

## 2. 시스템 아키텍처 및 데이터 흐름
- **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion
- **Physics Engine**: Matter.js (React integration via canvas ref)
- **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime)
- **Data Flow**:
  1. **동전 생성 및 터치**: 사용자가 Gravity Canvas 상에서 튕겨 다니는 동전을 터치하면 프론트엔드가 즉각 반응하여 점수를 카운트합니다.
  2. **캐시 적립 처리**: API Route를 통해 Supabase DB의 `point_transactions`에 원장 기입을 수행하고, `users` 테이블의 `points` 값을 원자적(Atomic) 연산으로 업데이트하여 부정 행위를 방지합니다.
  3. **광고 연동**: 특정 수 이상 터치하거나 골드 박스 클릭 시 비디오 광고 API가 로딩되고, 완료 콜백을 받아 DB 트랜잭션을 통해 리워드가 안전하게 적립됩니다.

---

# 🗺️ 3장. User Flow (화면 설계)

## 1. 주요 페이지 목록
- **`/` (온보딩 및 로그인 페이지)**: 그라비티 캐시 소개 및 간편 소셜 로그인 화면.
- **`/dashboard` (메인 그라비티 화면)**: 중력 엔진이 적용된 메인 캔버스 영역. 좌우로 흔들거나 모바일을 기울이면 동전들이 요동치며 떨어짐. 상단에 캐시 보드 실시간 표시.
- **`/store` (캐시 상점 및 출금)**: 쌓은 포인트로 기프티콘을 구매하거나, 현금 출금을 신청하는 폼 제공.
- **`/history` (적립 이력 및 내역)**: 출금 진행 상황 및 포인트 적립 로그를 타임라인 형태로 제공.

## 2. 각 화면별 구성 컴포넌트
- **Dashboard 화면**:
  - `GravityCanvas`: Matter.js를 탑재하여 중력 하에 동전 객체들이 충돌하고 리바운드하는 풀스크린 캔버스 컴포넌트.
  - `CashIndicator`: 현재 획득한 캐시와 터치 횟수를 실시간으로 노출하는 상단 고정 헤더.
  - `AdTriggerModal`: 리워드 광고 보기를 유도하고 광고가 연동되는 반응형 오버레이.
- **Store 화면**:
  - `WithdrawalForm`: 은행, 계좌, 출금액을 안전하게 입력받고 실시간 잔액 대조 검증을 수행하는 입력 폼.

## 3. 핵심 사용자 이동 경로
1. **로그인**: 소셜 계정으로 로그인 후 대시보드로 진입.
2. **물리 파밍 플레이**: 화면 내 가상의 중력 하에 낙하하는 동전을 난사하듯 터치. 동전이 튕길 때 마다 사운드 및 파티클 이펙트 발생. `+1 Cash` 누적.
3. **크리티컬 리워드 발동**: 랜덤하게 나타나는 황금 보물상자를 잡으면 리워드 비디오 광고가 팝업 형태로 재생.
4. **캐시 획득 및 출금**: 일정 금액 이상 도달 시 상점으로 이동하여 현금 출금을 신청.

---

# 🤖 AI 개발 지시서 프롬프트 가이드

## 1단계: 프로젝트 기초 뼈대 구축 및 레이아웃 설정

```text
Next.js (App Router), Tailwind CSS, Lucide React를 기반으로 '그라비티 캐시(Gravity Cash)' 웹 앱의 뼈대를 설정해주세요.

1. `package.json`에 다음 라이브러리를 설치하도록 가이드 또는 뼈대를 작성하세요.
   - `matter-js` (물리 엔진)
   - `framer-motion` (UI 애니메이션)
   - `lucide-react` (아이콘)
2. 공통 레이아웃을 정의해 주세요.
   - 상단 헤더: 서비스 로고 'Gravity Cash', 현재 보유 포인트 표시부, 메뉴 링크(홈, 상점, 적립이력)
   - 모바일 퍼스트 반응형 컨테이너 레이아웃 (최대 너비 480px의 앱 느낌의 화면 구성 추천)
3. 기본 랜딩 및 로그인 페이지(`/app/page.tsx`)와 대시보드 구조(`/app/dashboard/page.tsx`)의 간단한 목업 라우팅을 구현해주세요.
```

## 2단계: 데이터베이스 모델 정의 및 연동

```text
Supabase 데이터베이스 연동 및 SQL 설정을 생성해주세요.

1. 다음 테이블을 생성하는 PostgreSQL DDL 쿼리를 제공하세요:
   - `users` (id: uuid, email: text, nickname: text, points: int, created_at)
   - `point_transactions` (id: uuid, user_id, amount: int, type: text, description: text, created_at)
   - `withdrawals` (id: uuid, user_id, amount, bank_name, account_number, status, created_at)
2. `supabase/client.ts`를 정의하여 프론트엔드와 Supabase 간 연동 설정을 만드세요.
3. 포인트를 원자적으로 증가시키기 위한 Postgres 함수(RPC) `increment_points`를 정의하는 SQL을 생성해주세요:
   - 입력: `target_user_id` (UUID), `amount` (INT)
   - 로직: `users` 테이블의 `points`를 증가시키고, 동시에 `point_transactions` 테이블에 적립 로그를 원장으로 한 번에 삽입하는 트랜잭션 정의.
```

## 3단계: 핵심 비즈니스 로직 및 API 구현

```text
Next.js App Router API Route 및 API 연동 로직을 생성해주세요.

1. `/api/points/route.ts` API 엔드포인트 구현:
   - 사용자가 일반 동전 혹은 황금 상자를 터치해 획득한 포인트를 서버에 동기화 요청하는 API.
   - 요청 본문(body): `{ amount: number, type: string, description: string }`
   - 보안 처리: Supabase Auth 세션 검증을 통과해야 하며, 1초 내에 비정상적으로 다량의 요청이 발생하는 것을 막는 기초적인 안티 치트(Anti-Cheat) 시간 기반 세션 체크를 반영해 주세요.
2. `/api/withdraw/route.ts` API 엔드포인트 구현:
   - 출금 신청 API.
   - 유저의 현재 포인트를 검증하여 출금 요청액(`amount`)이 포인트 잔액보다 큰지 확인하고, 통과하면 `points` 차감 및 `withdrawals`에 행을 삽입하는 트랜잭션 API를 작성하세요.
```

## 4단계: UI 완성 및 프론트엔드 연동

```text
Matter.js 물리 엔진을 활용한 피지컬 게임 화면과 최종 UI 연동을 작성해주세요.

1. `/app/dashboard/components/GravityCanvas.tsx` 컴포넌트를 설계하세요:
   - HTML5 `<canvas>`를 사용하여 Matter.js 물리 월드(Engine, World, Render, Runner, Bodies)를 마운트합니다.
   - 모바일/데스크톱 터치/클릭 감지: 사용자가 캔버스의 특정 위치를 터치/클릭하면 Matter.js 월드 안에 물리 속성(원, 복원력, 탄성)을 가진 원형 '동전(Coin)'과 '금 상자(Chest)'가 하늘에서 떨어지고 바닥에서 튕기게 처리하세요.
   - 캔버스 내 생성된 동전을 클릭하면 터치한 객체가 파괴(World에서 제거)되면서 폭죽 파티클 효과가 퍼지고, 클라이언트 측 포인트 상태가 올라가도록 하세요.
   - 디바이스 자이로스코프 또는 드래그를 감지하여 중력 방향을 실시간으로 바꾸어 동전들이 미끄러져 튕기게 구현하세요 (자이로 없는 환경을 위해 드래그 슬라이더나 클릭으로 중력 반전 보완).
2. 상점(`/app/store/page.tsx`) 화면에서 출금 폼을 작동 가능하도록 3단계의 `/api/withdraw`와 연결하고 상태 메시지를 깔끔하게 표현하는 토스트 인터페이스를 구성하세요.
```

