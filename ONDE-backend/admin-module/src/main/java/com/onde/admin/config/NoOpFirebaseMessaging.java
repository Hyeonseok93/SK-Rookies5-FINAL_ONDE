package com.onde.admin.config;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;

import java.lang.reflect.Proxy;
import java.util.Collections;
import java.util.List;

/** Firebase 미연동 환경용 NoOp. Mockito 미사용. */
final class NoOpFirebaseMessaging {

    private NoOpFirebaseMessaging() {
    }

    static FirebaseMessaging create(String messageIdPrefix) {
        return (FirebaseMessaging) Proxy.newProxyInstance(
                FirebaseMessaging.class.getClassLoader(),
                new Class<?>[]{FirebaseMessaging.class},
                (proxy, method, args) -> invoke(proxy, method.getName(), method.getReturnType(), messageIdPrefix, args));
    }

    private static Object invoke(Object proxy, String name, Class<?> returnType, String messageIdPrefix, Object[] args) {
        if ("send".equals(name)) {
            return messageIdPrefix + "-" + System.currentTimeMillis();
        }
        if ("sendMulticast".equals(name)
                || "sendEachForMulticast".equals(name)
                || "sendAll".equals(name)
                || "sendEach".equals(name)) {
            return newNoOpBatchResponse();
        }
        if ("toString".equals(name)) {
            return "NoOpFirebaseMessaging(" + messageIdPrefix + ")";
        }
        if ("hashCode".equals(name)) {
            return System.identityHashCode(proxy);
        }
        if ("equals".equals(name)) {
            return proxy == args[0];
        }
        if (returnType.equals(void.class) || returnType.equals(Void.class)) {
            return null;
        }
        if (returnType.equals(boolean.class)) {
            return false;
        }
        if (returnType.equals(int.class)) {
            return 0;
        }
        if (List.class.isAssignableFrom(returnType)) {
            return Collections.emptyList();
        }
        return null;
    }

    private static BatchResponse newNoOpBatchResponse() {
        return (BatchResponse) Proxy.newProxyInstance(
                BatchResponse.class.getClassLoader(),
                new Class<?>[]{BatchResponse.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("getSuccessCount".equals(name) || "getFailureCount".equals(name)) {
                        return 0;
                    }
                    if ("getResponses".equals(name)) {
                        return Collections.emptyList();
                    }
                    if ("toString".equals(name)) {
                        return "NoOpBatchResponse";
                    }
                    if ("hashCode".equals(name)) {
                        return System.identityHashCode(proxy);
                    }
                    if ("equals".equals(name)) {
                        return proxy == args[0];
                    }
                    return null;
                });
    }
}
