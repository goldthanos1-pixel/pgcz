@echo off
echo ==================================================
echo VibePlan AI - Google Cloud Run Windows Deployment
echo ==================================================
echo.
echo [주의] 이 스크립트 실행 전에 Google Cloud SDK가 설치되어 있어야 하며,
echo 터미널에서 'gcloud auth login'으로 로그인되어 있어야 합니다.
echo.

set /p PROJECT_ID="구글 클라우드 프로젝트 ID를 입력하세요: "

if "%PROJECT_ID%"=="" (
    echo [에러] 프로젝트 ID가 입력되지 않았습니다. 배포를 취소합니다.
    pause
    exit /b 1
)

echo.
echo 프로젝트 [%PROJECT_ID%]로 배포를 시작합니다...
echo.

gcloud run deploy vibe-plan-ai --project %PROJECT_ID% --source . --region asia-northeast3 --allow-unauthenticated

echo.
echo 배포 작업이 완료되었습니다!
pause
