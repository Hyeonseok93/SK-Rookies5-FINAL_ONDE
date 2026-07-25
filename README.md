# SK-Rookies5-FINAL_ONDE

준비중... / 작성 중

바이브 코딩으로 만든 여행 플랫폼 **Onde**. 취약점 진단의 대상 서비스.

## 모노레포 기준 브랜치

| 경로 | 원본 레포 | 가져온 브랜치 | 비고 |
|------|-----------|---------------|------|
| `frontend/` | [UR-VULN/Onde_Frontend](https://github.com/UR-VULN/Onde_Frontend) | `audit/user-remediation/hs` → `audit/admin-remediation/hs` 병합 | 이행점검(hs) |
| `backend/` | [UR-VULN/Onde_Backend](https://github.com/UR-VULN/Onde_Backend) | `audit/user-remediation/hs` → `audit/admin-remediation/hs` 병합 | 이행점검(hs) |
| `infra/` | [UR-VULN/Onde_Infra](https://github.com/UR-VULN/Onde_Infra) | `main` | remediation 브랜치 없음 |

- 작업 순서: **user-remediation/hs** 를 먼저 올린 뒤 **admin-remediation/hs** 를 병합했습니다.
- 원본 FE/BE/Infra 커밋 히스토리는 서브디렉터리 경로로 옮겨 보존했습니다.

## 구조

```
frontend/   # React + Vite
backend/    # Spring Boot (multi-module)
infra/      # Terraform / CI·CD
```
