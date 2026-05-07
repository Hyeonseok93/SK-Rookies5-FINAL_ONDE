# mini_PJT3_Infra
graph TD
    %% 외부 및 사용자
    User(("사용자<br>(HTTPS/443)"))
    BankAPI(("외부 은행 API<br>(Mock Bank)"))

    subgraph "AWS Cloud (Region: ap-northeast-2)"
        subgraph "VPC (10.0.0.0/16)"
            
            %% Public Zone
            subgraph "Public Subnet (DMZ / 외부 접점 구역)"
                ALB[ALB<br>트래픽 검증 및 부하 분산]
                NAT[NAT Gateway<br>단방향 외부 통로]
                Bastion[Bastion Host<br>관리자 전용 터널]
            end

            %% Private WAS Zone
            subgraph "Private Subnet (WAS / 비즈니스 로직 구역)"
                WAS["[Payment Service]<br>계좌 발급 및 스케줄링"]
                Secrets["[AWS Secrets Manager]<br>DB 인증 정보 실시간 주입"]
            end

            %% Private Data Zone
            subgraph "Private Subnet (Data / 핵심 자산 저장 구역)"
                RDS[("RDS (MySQL)<br>주문/결제 데이터 저장")]
                Redis[("ElastiCache (Redis)<br>계좌 TTL/멱등성 관리")]
            end
        end
    end

    %% 연결 관계
    User ==>|HTTPS| ALB
    ALB ==>|1. 인가된 트래픽 전달| WAS
    WAS -.->|보안 인증| Secrets
    WAS ==>|2. 정해진 포트 허용| RDS
    WAS ==>|2. 캐시 통신| Redis
    WAS ==>|3. Egress Only 통신| NAT
    NAT ==>|외부 연동| BankAPI

    %% 스타일링
    style User fill:#f9f,stroke:#333
    style WAS fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style RDS fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style NAT fill:#fff9c4,stroke:#fbc02d