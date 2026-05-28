# 공식 파이썬 슬림 이미지 사용
FROM python:3.11-slim

# 로그 출력 버퍼링 비활성화
ENV PYTHONUNBUFFERED True

# 컨테이너 내 작업 디렉토리 설정
ENV APP_HOME /app
WORKDIR $APP_HOME

# 로컬 프로젝트 코드를 컨테이너 내부로 복사
COPY . ./

# 의존성 라이브러리 설치
RUN pip install --no-cache-dir -r requirements.txt

# Cloud Run에서 지정하는 포트로 구동되도록 Gunicorn 실행
# Gunicorn 서버는 가볍고 대량 트래픽 처리에 안정적입니다.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
