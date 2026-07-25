package com.onde.api.scheduler;

import com.onde.api.application.settlement.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * 정산 일배치 스케줄러 (HTTP 엔드포인트와 분리).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SettlementScheduler {

    private final SettlementService settlementService;

    @Scheduled(cron = "0 0 0 * * ?")
    public void runDailySettlement() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("일간 정산 배치 스케줄러가 시작되었습니다. (대상 일자: {})", yesterday);

        try {
            settlementService.executeDailySettlement(yesterday);
            log.info("일간 정산 배치가 성공적으로 처리되었습니다. (대상 일자: {})", yesterday);
        } catch (Exception e) {
            log.error("일간 정산 배치 실행 중 오류가 발생했습니다. (대상 일자: {})", yesterday, e);
        }
    }
}
