from flask import Flask, render_template, request, jsonify
import json
import os
import requests
import google.generativeai as genai

app = Flask(__name__)

# 임시 저장소 및 디버그 설정
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'vibeplan_secret_key')

# 디폴트 예시 아이디어 셋 (시뮬레이션 모드용)
DEFAULT_RECOMMENDS = {
    "default": [
        {"id": 1, "emoji": "🚀", "title": "스마트 프로젝트 매니저", "summary": "개인 개발자와 소규모 팀을 위한 초경량 프로젝트 관리 도구. AI가 진행 상황을 분석하고 다음 할 일을 추천합니다."},
        {"id": 2, "emoji": "🌱", "title": "마이그린 프렌즈", "summary": "식물 키우기 초보자를 위한 홈 가드닝 SNS. 센서 연동 없이도 사진 분석을 통해 식물 건강과 물주기 주기를 케어합니다."},
        {"id": 3, "emoji": "🛍️", "title": "동네마켓 공동구매", "summary": "아파트 단지나 소규모 지역 주민들이 배송비를 아끼기 위해 실시간으로 배달음식이나 마트 상품을 함께 공동구매하는 서비스."}
    ],
    "강아지": [
        {"id": 1, "emoji": "🐶", "title": "댕댕이 패밀리", "summary": "온 가족이 하나의 계정으로 반려견의 사료 급여, 산책 기록, 예방 접종 일정을 공유하고 실시간으로 돌봄 현황을 체크하는 패밀리 케어 앱."},
        {"id": 2, "emoji": "🩺", "title": "마이 퍼피 AI", "summary": "반려견의 이상 증상이나 행동을 사진/글로 등록하면 AI가 예상 질환을 브리핑해 주고 대처 행동 요령을 알려주는 맞춤형 헬스케어 비서."},
        {"id": 3, "emoji": "🗺️", "title": "개판오분전 동반지도", "summary": "사용자 실시간 위치 정보를 기반으로 반려견 동반이 가능한 식당, 카페, 병원을 추천하고 유저 평점과 출입 요건을 공유하는 서비스."}
    ],
    "달력": [
        {"id": 1, "emoji": "📅", "title": "타임블록 AI 플래너", "summary": "할 일 목록(To-Do)을 입력하면 AI가 우선순위와 예상 소요시간을 계산하여 오늘 하루 일정표에 시간 단위로 자동 배치해 주는 영리한 플래너."},
        {"id": 2, "emoji": "💞", "title": "커플 시그널 캘린더", "summary": "연인들의 일정을 조율해 주는 특화 캘린더. 서로 비어있는 최적의 데이트 시간대를 추천하고 근처 인기 데이트 코스를 추천해 줍니다."},
        {"id": 3, "emoji": "📊", "title": "프리랜서 타임시트 tracker", "summary": "프로젝트별 작업 시간을 스톱워치로 기록하여 월말에 자동으로 거래처별 인보이스(청구서)와 업무 명세서를 PDF로 완성해 주는 업무 효율 툴."}
    ]
}

def generate_mock_plan(title, summary, platform, audience):
    """
    제미나이 API 키가 없을 때 제공하는 고품질 시뮬레이션 기획 데이터
    """
    return {
        "vibe_check": f"""# 📑 1장. Vibe Check (서비스 기획서)

## 1. 서비스 정의 및 목적
본 서비스 **"{title}"**은(는) {audience}을(를) 주 타겟으로 하는 {platform} 기반 서비스입니다.
- **기획 의도**: {summary}
- **해결하고자 하는 문제**: 기존 서비스들이 주던 불편함을 해소하고, 사용자 맞춤형 분석과 자동화를 통해 생산성을 극대화합니다.

## 2. 핵심 타겟 오디언스 (Target Audience)
1. **주요 대상**: 효율성을 중시하고 복잡한 가입 절차를 기피하는 {audience}.
2. **이용 동기**: 편리함, 직관적인 UI, AI 기반의 자동 제안 및 기록 단축.

## 3. 서비스 핵심 가치 및 차별점 (USP)
- **간결성**: 가벼운 실행 속도와 복잡하지 않은 화면 레이아웃.
- **AI 최적화**: 사용자의 행동 패턴을 분석하여 맞춤형 프롬프트와 피드백을 제공.
- **로컬 캐싱**: 오프라인 상태에서도 주요 데이터 입출력이 가능하며 온라인 복귀 시 자동 싱크.""",

        "blueprint": f"""# ⚙️ 2장. Blueprint (데이터베이스 및 시스템 설계)

## 1. 데이터베이스 테이블 스키마 정의 (SQLite/PostgreSQL)

### 1) Users (사용자 정보 테이블)
| 컬럼명 | 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 사용자 고유 일련번호 |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | 로그인용 이메일 주소 |
| `password_hash`| VARCHAR(255) | NOT NULL | 암호화된 비밀번호 해시 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 계정 생성 일시 |

### 2) Projects_Data (핵심 데이터 테이블)
| 컬럼명 | 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 데이터 일련번호 |
| `user_id` | INTEGER | FOREIGN KEY (Users.id) | 작성한 사용자 외래키 |
| `title` | VARCHAR(150) | NOT NULL | 항목 제목 및 요약 |
| `content` | TEXT | NULL | 기획 상세 본문 내역 |
| `status` | VARCHAR(30) | DEFAULT 'active' | 활성/비활성 상태 정보 |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 최종 변경 일시 |

## 2. 시스템 아키텍처 및 데이터 흐름
- **클라이언트 (Frontend)**: Vanilla HTML/JS/CSS (글래스모피즘 테마)가 브라우저 단에서 상태 관리 및 UI 이벤트 비동기 처리.
- **서버 (Backend)**: Python Flask API 서버가 클라이언트 요청 수신 및 비즈니스 로직 연산.
- **데이터베이스**: 관계형 DB(SQLite/PostgreSQL)를 활용해 원자성(ACID) 보장.""",

        "user_flow": f"""# 🗺️ 3장. User Flow (화면 설계서)

## 1. 주요 페이지 구성 목록
1. **대시보드 메인 화면 (`/dashboard`)**: 전체 통계 지표, 최근 추가된 항목 카드 리스트, 새로운 기획 즉시 입력 필드 배치.
2. **세부 설정 모달 / 페이지 (`/settings`)**: API 키 등록, 개인 프로필 관리, 알림 온/오프 토글 스위치.
3. **상세 데이터 작성기 (`/editor`)**: 마크다운을 지원하는 깔끔한 작성 캔버스와 임시저장 상태 배지 표시.

## 2. 핵심 사용자 동선 (User Flow)
- **회원가입/로그인** ➔ **대시보드 진입** ➔ **[새로 만들기] 클릭** ➔ **기획 입력 및 저장** ➔ **대시보드 차트/리스트에 실시간 반영**.""",

        "prompt_guide": [
            {
                "step": "1단계: 프로젝트 기초 환경 구축 및 Flask 서버 실행",
                "prompt": f"""아래 내용을 참고해서 파이썬 Flask 프로젝트의 기초 뼈대를 작성해 줘.

[요구사항]
- 프로젝트 이름: vibe-coding-project
- 백엔드: Flask 사용 (app.py)
- 프론트엔드: templates/index.html 및 static/style.css, static/app.js 파일 구조 생성
- 포트번호: 8080 구동
- index.html에는 '{title}'의 기본 대시보드 구조 마크업을 만들어 줘."""
            },
            {
                "step": "2단계: SQLite 데이터베이스 및 SQLAlchemy 모델 설계",
                "prompt": f"""이전 단계에 이어서 데이터베이스 연동 코드를 추가해 줘.

[요구사항]
- SQLite 데이터베이스 사용
- SQLAlchemy ORM을 사용하여 Users 테이블과 Projects_Data 테이블 객체 선언
- 각 테이블의 1:N 관계 매핑 및 테이블이 없을 경우 실행 시 자동 생성되도록 초기화 로직 구현"""
            },
            {
                "step": "3단계: 데이터 CRUD 처리를 위한 백엔드 API 구현",
                "prompt": f"""Flask 컨트롤러(app.py)에 프론트엔드가 호출할 수 있는 RESTful API 엔드포인트를 구현해 줘.

[요구사항]
- GET /api/data : 현재 로그인한 유저의 전체 기록 조회
- POST /api/data : 신규 기록 등록 및 유효성 검사
- DELETE /api/data/<id> : 기록 삭제 처리 및 성공 응답 반환
- 모든 응답은 JSON 형태로 전송할 것"""
            },
            {
                "step": "4단계: 프론트엔드 AJAX 비동기 연동 및 UI 완성",
                "prompt": f"""templates/index.html과 static/app.js를 연동해 줘.

[요구사항]
- 사용자가 입력창에 글을 적고 등록을 누르면 fetch() API를 통해 백엔드 /api/data로 POST 요청 발송
- 성공 시 화면 리로드 없이 대시보드 리스트 목록에 즉시 반투명 카드 요소로 자동 동적 삽입되는 JS 로직 작성
- 세련된 다크 모드 네온 스타일 CSS 포함"""
            }
        ]
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/recommend')
def recommend_ideas():
    keyword = request.args.get('keyword', '').strip()
    api_key = request.args.get('apiKey', '').strip()
    model_name = request.args.get('model', 'gemini-3.5-flash').strip()
    
    # 1. API Key가 있을 경우 구글 제미나이 호출
    if api_key:
        try:
            genai.configure(api_key=api_key)
            # 사용자가 설정한 최신 모델명 매핑 처리 (오타 대비 폴백 추가)
            target_model = model_name
            if '3.5' not in target_model and '1.5' not in target_model and '2.0' not in target_model:
                target_model = 'gemini-3.5-flash'
                
            model = genai.GenerativeModel(
                model_name=target_model,
                generation_config={"response_mime_type": "application/json"}
            )
            
            prompt = f"""사용자가 입력한 거친 한 줄 아이디어 또는 키워드를 기반으로, 구현 가능하면서도 개성 넘치는 서로 다른 3가지 소프트웨어/앱 컨셉을 제안하십시오.
반드시 아래의 구조화된 JSON 데이터 형식으로만 응답해야 합니다. 다른 사족은 일체 붙이지 마십시오.

JSON 구조:
{{
  "ideas": [
    {{
      "id": 1,
      "emoji": "아이디어 성격에 어울리는 대표 이모지 1개",
      "title": "앱 명칭 (한국어)",
      "summary": "이 서비스가 왜 필요하고 무엇을 하는지 설명하는 2줄짜리 요약 (한국어)"
    }},
    {{
      "id": 2,
      "emoji": "이모지",
      "title": "앱 명칭",
      "summary": "요약"
    }},
    {{
      "id": 3,
      "emoji": "이모지",
      "title": "앱 명칭",
      "summary": "요약"
    }}
  ]
}}

사용자 키워드: {keyword}"""
            
            response = model.generate_content(prompt)
            res_json = json.loads(response.text)
            return jsonify(res_json)
            
        except Exception as e:
            print(f"Gemini API Error in recommend: {e}")
            # API 호출 실패 시 로컬 추천 폴백 실행
    
    # 2. API Key가 없거나 호출 오류 시 내장 시뮬레이션 매핑
    matched_set = DEFAULT_RECOMMENDS.get("default")
    for key, val in DEFAULT_RECOMMENDS.items():
        if key in keyword:
            matched_set = val
            break
            
    # 키워드 검색어가 다를 경우, 매치된 기본 셋의 타이틀만 동적으로 치환해 실감 나게 표시
    if matched_set == DEFAULT_RECOMMENDS.get("default") and keyword != "":
        custom_set = [
            {"id": 1, "emoji": "🧠", "title": f"스마트 {keyword} 분석기", "summary": f"AI 분석 엔진을 통해 {keyword} 데이터를 수집하고 최적의 가이드라인을 제공하는 전문적인 기획 솔루션."},
            {"id": 2, "emoji": "👥", "title": f"우리동네 {keyword} 모임", "summary": f"지역 커뮤니티 기반으로 같은 취향의 사람들이 모여 {keyword} 관련 공동 행동과 소통을 나누는 커뮤니티 플랫폼."},
            {"id": 3, "emoji": "⚡", "title": f"초고속 {keyword} 메이커", "summary": f"복잡한 단계와 설정을 클릭 몇 번으로 단축하여 비전문가도 {keyword} 명세와 시뮬레이션을 가능케 하는 업무 자동화 툴."}
        ]
        return jsonify({"ideas": custom_set})

    return jsonify({"ideas": matched_set})

@app.route('/api/generate', methods=['POST'])
def generate_specification():
    req_data = request.json or {}
    title = req_data.get('title', '').strip()
    summary = req_data.get('summary', '').strip()
    platform = req_data.get('platform', '웹 애플리케이션').strip()
    audience = req_data.get('audience', '일반 사용자').strip()
    api_key = req_data.get('apiKey', '').strip()
    model_name = req_data.get('model', 'gemini-3.5-flash').strip()

    # 1. API Key가 있을 경우 구글 제미나이 3.5 호출
    if api_key:
        try:
            genai.configure(api_key=api_key)
            target_model = model_name
            if '3.5' not in target_model and '1.5' not in target_model and '2.0' not in target_model:
                target_model = 'gemini-3.5-flash'
                
            model = genai.GenerativeModel(
                model_name=target_model,
                generation_config={"response_mime_type": "application/json"}
            )
            
            prompt = f"""역할: 당신은 수석 소프트웨어 아키텍트이자 시스템 설계자입니다.
목표: 제공된 [앱 아이디어]를 바탕으로, 즉시 바이브 코딩(Vibe Coding)으로 빌드할 수 있는 상세 기획 및 설계서를 마크다운 형식으로 작성하고, 단계를 나누어 인공지능 코딩 툴(Cursor/Gemini)에 바로 붙여넣어 실행할 수 있는 초고품질의 개발 프롬프트(Prompt Guide)를 작성하십시오.

[출력 형식 및 제약 조건]:
답변은 반드시 온전한 JSON 형식이어야 합니다. 마크다운 문자열 내부는 줄바꿈(\\n)을 활용하여 줄바꿈 처리를 해주십시오. 예외적인 문자(따옴표 등)는 백슬래시 등으로 제이슨 규격에 맞게 적절히 이스케이프 처리해야 합니다.

JSON 구조:
{{
  "vibe_check": "# 📑 1장. Vibe Check (서비스 기획서)\\n\\n## 1. 서비스 정의 및 목적...\\n## 2. 핵심 타겟 오디언스...\\n## 3. 서비스 핵심 가치 및 차별점...",
  "blueprint": "# ⚙️ 2장. Blueprint (데이터베이스 및 시스템 설계)\\n\\n## 1. 데이터베이스 테이블 스키마 정의 (표 형식으로 작성)\\n- 컬럼명, 타입, 제약조건, FK 관계...\\n## 2. 시스템 아키텍처 및 데이터 흐름...",
  "user_flow": "# 🗺️ 3장. User Flow (화면 설계)\\n\\n## 1. 주요 페이지 목록\\n## 2. 각 화면별 구성 컴포넌트...\\n## 3. 핵심 사용자 이동 경로...",
  "prompt_guide": [
    {{
      "step": "1단계: 프로젝트 기초 뼈대 구축 및 레이아웃 설정",
      "prompt": "Cursor/Gemini에 그대로 붙여넣을 프롬프트 내용 (한국어)"
    }},
    {{
      "step": "2단계: 데이터베이스 모델 정의 및 연동",
      "prompt": "프롬프트 내용"
    }},
    {{
      "step": "3단계: 핵심 비즈니스 로직 및 API 구현",
      "prompt": "프롬프트 내용"
    }},
    {{
      "step": "4단계: UI 완성 및 프론트엔드 연동",
      "prompt": "프롬프트 내용"
    }}
  ]
}}

[앱 아이디어]
- 서비스 이름: {title}
- 서비스 개요: {summary}
- 플랫폼 형태: {platform}
- 타겟 사용자: {audience}"""
            
            response = model.generate_content(prompt)
            res_json = json.loads(response.text)
            return jsonify(res_json)
            
        except Exception as e:
            print(f"Gemini API Error in generate: {e}")
            # API 호출 실패 시 로컬 백업 시뮬레이션 데이터 전송
            return jsonify(generate_mock_plan(title, summary, platform, audience))
            
    # 2. API Key가 없을 경우 모의 데이터 생성기 호출
    return jsonify(generate_mock_plan(title, summary, platform, audience))

if __name__ == '__main__':
    # Cloud Run은 환경 변수로 주어지는 PORT를 통해 서비스를 바인딩해야 합니다.
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
