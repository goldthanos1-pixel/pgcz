#!/bin/bash
echo "=================================================="
echo "VibePlan AI - Google Cloud Run Bash Deployment"
echo "=================================================="
echo ""
echo "[주의] 이 스크립트 실행 전에 Google Cloud SDK가 설치되어 있어야 하며,"
echo "gcloud auth login으로 로그인되어 있어야 합니다."
echo ""

read -p "구글 클라우드 프로젝트 ID를 입력하세요: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "[에러] 프로젝트 ID가 입력되지 않았습니다. 배포를 취소합니다."
    exit 1
fi

echo ""
echo "프로젝트 [$PROJECT_ID]로 배포를 시작합니다..."
echo ""

gcloud run deploy vibe-plan-ai \
    --project $PROJECT_ID \
    --source . \
    --region asia-northeast3 \
    --allow-unauthenticated

echo ""
echo "배포 작업이 완료되었습니다!"
