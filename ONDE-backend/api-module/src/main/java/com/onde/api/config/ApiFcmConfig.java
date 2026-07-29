package com.onde.api.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

/**
 * Local/dev Firebase bean. Real push delivery needs a project service account;
 * this only keeps the app bootable without Mockito proxies on a final class.
 */
@Slf4j
@Configuration
public class ApiFcmConfig {

    @Bean
    public FirebaseMessaging firebaseMessaging() throws Exception {
        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(
                            new ByteArrayInputStream(localServiceAccountJson().getBytes(StandardCharsets.UTF_8))))
                    .setProjectId("onde-local")
                    .build();
            FirebaseApp.initializeApp(options);
            log.warn("Local FirebaseApp initialized (push will not deliver without real credentials).");
        }
        return FirebaseMessaging.getInstance();
    }

    private static String localServiceAccountJson() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();
        String privateKeyPem = toPem(keyPair.getPrivate().getEncoded());
        return """
                {
                  "type": "service_account",
                  "project_id": "onde-local",
                  "private_key_id": "local",
                  "private_key": "%s",
                  "client_email": "firebase-adminsdk@onde-local.iam.gserviceaccount.com",
                  "client_id": "0",
                  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                  "token_uri": "https://oauth2.googleapis.com/token"
                }
                """.formatted(privateKeyPem);
    }

    private static String toPem(byte[] pkcs8) {
        String b64 = Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(pkcs8);
        return "-----BEGIN PRIVATE KEY-----\\n" + b64.replace("\n", "\\n") + "\\n-----END PRIVATE KEY-----\\n";
    }
}
