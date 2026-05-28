# 🗂️ GCP MOC (Map of Content)

Google Cloud Platform(GCP) 관련 구축 정보와 가이드 노트를 엮어주는 허브 페이지입니다. 이 페이지를 통해 모든 관련 문서로 연결됩니다.

---

## 🚀 실시간 서비스 링크
* 🖥️ **보안 워드프레스 홈페이지**: https://physical-ai.duckdns.org
* 🤖 **VibePlan AI (Cloud Run)**: https://vibe-plan-ai-221487513610.asia-northeast3.run.app
* 🌐 **구글 클라우드 콘솔**: [Google Cloud Console](https://console.cloud.google.com)

---

## 📄 핵심 구축 문서 (배포 및 서버 관리)
* **[[GCP_DEPLOYMENT_MEMO]]**: VibePlan AI 및 워드프레스 VM의 포트 설정, DB 계정 정보, 업데이트 및 도커 제어 명령어 총정리 메모.

---

## 🛠️ 추후 확장을 위한 노트 (작성 예정)
*(아래 링크를 클릭하면 새로운 노트를 바로 생성하여 기록할 수 있습니다.)*
* **[[Cloud Run 배포 가이드]]**: Flask 소스코드 변경 시 빌드 및 배포 방법 상세 프로세스.
* **[[GCE 도커 방화벽 설정]]**: Compute Engine의 인바운드/아웃바운드 포트 및 GCP VPC 방화벽 규칙 제어 방법.
* **[[DuckDNS 자동 갱신 가이드]]**: 도메인 IP가 변경되었을 때의 대처법 및 DuckDNS API 스크립트화 방법.

---

## 📅 프로젝트 히스토리
* **2026-05-29**: VibePlan AI (Cloud Run) 서울 리전 배포 완료.
* **2026-05-29**: Always Free Tier 사양 GCE VM (`e2-micro`, `us-central1-a`)에 워드프레스(Docker) 배포 완료.
* **2026-05-29**: `physical-ai.duckdns.org` 도메인 및 Caddy 자동 SSL (HTTPS) 역프록시 연동 완료.
