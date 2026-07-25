package com.onde.admin.config;

import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class AdminFcmConfig {

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        log.warn("Admin FirebaseMessaging NoOp bean registered. Push notifications are not delivered until a real FirebaseApp is wired.");
        return NoOpFirebaseMessaging.create("admin-noop-msg");
    }
}
