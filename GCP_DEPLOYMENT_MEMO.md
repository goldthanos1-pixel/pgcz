# GCP 배포 및 관리 핵심 요약 메모 (GCP Deployment Memo)

이 문서는 구축된 **VibePlan AI (Cloud Run)** 및 **평생 무료 워드프레스 (Compute Engine VM)** 환경의 관리 정보와 주요 설정 값을 기록한 메모입니다. 필요할 때 참고하고 보관해 두세요.

---

## 1. 서비스 접속 주소 및 도메인
* **워드프레스 (HTTPS 적용)**: [https://physical-ai.duckdns.org](https://physical-ai.duckdns.org)
* **VibePlan AI (Flask 앱 - Cloud Run)**: [https://vibe-plan-ai-221487513610.asia-northeast3.run.app](https://vibe-plan-ai-221487513610.asia-northeast3.run.app)
* **가상 서버(VM) 외부 IP**: `34.42.10.206`

---

## 2. VibePlan AI (Cloud Run) 관리 정보
Flask 기반 웹앱으로, 구글 클라우드 서울 리전(`asia-northeast3`)에 서버리스 형태로 배포되어 있습니다. 접속량이 없을 때는 비용이 0원입니다.

### 💻 업데이트 배포 명령어
로컬 PC의 코드(예: `c:\Workspace\pgcz` 또는 복사된 작업 공간)를 수정하고 Cloud Run에 새로 반영하고 싶을 때는 아래 명령어를 터미널에서 실행합니다:
```bash
gcloud run deploy vibe-plan-ai --source . --region asia-northeast3 --allow-unauthenticated
```

---

## 3. 평생 무료 워드프레스 (Compute Engine GCE)
GCP의 평생 무료 티어(Always Free Tier) 규격을 완전하게 충족하도록 설정하여 평생 무료로 운영 가능한 상태입니다.

### ⚙️ 가상 서버(VM) 상세 스펙
* **인스턴스명**: `free-wordpress`
* **머신 유형**: `e2-micro` (무료 조건 충족)
* **리전 및 영역**: `us-central1-a` (Iowa 리전 필수 - 무료 조건 충족)
* **디스크**: 30GB 표준 영구 디스크(pd-standard) (무료 조건 충족)

### 🔑 DB 접속 정보 (docker-compose 내부용)
* **데이터베이스 이름**: `wordpress`
* **DB 사용자(User)**: `wordpress`
* **DB 비밀번호(Password)**: `wp_db_password_109`
* **Root 비밀번호**: `wp_root_password_982`

---

## 4. GCE VM 서버 제어 및 도커(Docker) 명령어
서버에 수동 접속하거나 도커 컨테이너를 제어할 때 사용하는 핵심 명령입니다.

### 🔓 VM 서버 접속 (gcloud SSH)
로컬 PC 터미널에서 아래 명령을 실행하면 VM 서버 쉘에 접속됩니다:
```bash
gcloud compute ssh free-wordpress --zone=us-central1-a
```

### 📁 설정 파일 경로 (VM 서버 내부)
서버에 접속한 후, 워드프레스와 Caddy의 설정이 들어있는 경로는 `/opt/wordpress`입니다.
```bash
cd /opt/wordpress
```
이 디렉터리 내에 `docker-compose.yml`과 SSL 프록시를 담당하는 `Caddyfile`이 저장되어 있습니다.

### 🔄 도커 스택 제어 명령어 (VM 내부 `/opt/wordpress` 경로에서 실행)
* **서비스 중지 (컨테이너 삭제)**:
  ```bash
  sudo docker-compose down
  ```
* **서비스 시작 (백그라운드 기동)**:
  ```bash
  sudo docker-compose up -d
  ```
* **서비스 실행 상태 확인**:
  ```bash
  sudo docker ps
  ```
* **인증서 발급 및 HTTPS 접속 로그 확인 (Caddy 로그)**:
  ```bash
  sudo docker logs wordpress_caddy
  ```
* **워드프레스 웹앱 로그 확인**:
  ```bash
  sudo docker logs wordpress_app
  ```

---

## 5. 알아두어야 할 주의사항 (중요!)
1. **무료 조건 엄수**: 
   * VM 머신 유형(`e2-micro`), 리전(`us-central1-a`), 디스크(`30GB 표준 HDD`) 옵션을 변경하거나 다른 가상 서버를 추가로 생성하시면 요금이 발생할 수 있으니 현재 스펙을 그대로 유지해야 합니다.
2. **DuckDNS 도메인 IP 갱신**:
   * 가상 서버(VM)를 정지했다가 다시 시작하면 외부 IP 주소가 바뀔 수 있습니다. 만약 IP가 변경되면 [DuckDNS 홈페이지](https://www.duckdns.org)에 로그인하여 도메인(`physical-ai.duckdns.org`)의 IP 주소를 새로운 VM 외부 IP로 업데이트해야 접속이 유지됩니다. (현재는 IP가 유지되는 상태입니다.)
3. **Caddy가 SSL(HTTPS)을 자동 갱신**:
   * 현재 SSL 인증서는 Caddy가 Let's Encrypt를 통해 자동으로 갱신(90일 주기)하도록 구축되어 있어 사용자가 따로 관리하지 않아도 평생 보안 접속이 무료로 자동 유지됩니다.
