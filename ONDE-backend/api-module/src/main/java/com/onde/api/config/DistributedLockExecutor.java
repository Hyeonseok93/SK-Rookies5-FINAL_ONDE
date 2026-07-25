package com.onde.api.config;

import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.concurrent.Callable;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class DistributedLockExecutor {

    private final RedissonClient redissonClient;
    private final boolean allowFallback;

    public DistributedLockExecutor(
            @Autowired(required = false) RedissonClient redissonClient,
            @Value("${onde.lock.allow-fallback:false}") boolean allowFallback) {
        this.redissonClient = redissonClient;
        this.allowFallback = allowFallback;
    }

    /**
     * Redisson 분산 락 라이프사이클 실행기.
     * Redis 미가동 시에는 onde.lock.allow-fallback=true 인 경우에만 락 없이 실행합니다.
     */
    public <T> T executeWithLock(String key, long waitTimeSeconds, long leaseTimeSeconds, Callable<T> callback) {
        if (redissonClient == null) {
            if (!allowFallback) {
                throw new IllegalStateException("RedissonClient is not available and lock fallback is disabled.");
            }
            log.warn("⚠️ [DISTRIBUTED LOCK FALLBACK] RedissonClient is not initialized. 우회하여 비즈니스 로직을 동적으로 직접 실행합니다.");
            try {
                return callback.call();
            } catch (Exception e) {
                throw new RuntimeException("비즈니스 콜백 실행 중 오류 발생", e);
            }
        }

        RLock lock = redissonClient.getLock(key);
        boolean isAcquired = false;

        try {
            log.info("🔒 Attempting to acquire Redis distributed lock for key: {}", key);
            isAcquired = lock.tryLock(waitTimeSeconds, leaseTimeSeconds, TimeUnit.SECONDS);

            if (!isAcquired) {
                log.warn("❌ [LOCK TIMEOUT] Failed to acquire distributed lock for key: {}", key);
                throw new com.onde.core.exception.ValidationException(com.onde.core.exception.ErrorCode.SEAT_SOLD_OUT);
            }

            log.info("🔒 Acquired distributed lock successfully for key: {}", key);
            return callback.call();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("분산 락 획득 대기 중 인터럽트 발생", e);
        } catch (com.onde.core.exception.BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ [LOCK EXECUTION ERROR] Exception inside lock execution callback: {}", e.getMessage(), e);
            throw new RuntimeException("분산 락 트랜잭션 비즈니스 로직 실행 중 예외 발생: " + e.getMessage(), e);
        } finally {
            if (isAcquired) {
                try {
                    if (lock.isLocked() && lock.isHeldByCurrentThread()) {
                        lock.unlock();
                        log.info("🔓 Released distributed lock successfully for key: {}", key);
                    }
                } catch (Exception e) {
                    log.error("🔓 [LOCK RELEASE ERROR] Failed to release lock: {}", e.getMessage());
                }
            }
        }
    }
}
