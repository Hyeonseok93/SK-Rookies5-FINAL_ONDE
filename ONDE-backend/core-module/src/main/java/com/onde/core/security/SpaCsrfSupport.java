package com.onde.core.security;

import com.onde.core.config.AuthCookieProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.function.Supplier;

/**
 * Cookie-based CSRF for cookie-auth SPAs (Spring Security 6 / Boot 3.2 pattern).
 */
public final class SpaCsrfSupport {

    private SpaCsrfSupport() {
    }

    public static CookieCsrfTokenRepository cookieRepository(AuthCookieProperties authCookieProperties) {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieCustomizer(cookie -> cookie
                .sameSite(authCookieProperties.getSameSite())
                .secure(authCookieProperties.isSecure()));
        return repository;
    }

    /**
     * Enables Cookie CSRF + SPA request handler + cookie materialization filter.
     * OAuth2 browser redirects are ignored; login/signup/refresh/logout remain protected.
     */
    public static void configure(HttpSecurity http, AuthCookieProperties authCookieProperties) throws Exception {
        http.csrf(csrf -> csrf
                        .csrfTokenRepository(cookieRepository(authCookieProperties))
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
                        .ignoringRequestMatchers(
                                "/oauth2/**",
                                "/login/oauth2/**"))
                .addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class);
    }

    /**
     * Spring docs SPA handler: XOR for BREACH protection on cookie render;
     * plain resolve when the token arrives in the X-XSRF-TOKEN header.
     */
    public static final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

        private final CsrfTokenRequestHandler plain = new CsrfTokenRequestAttributeHandler();
        private final CsrfTokenRequestHandler xor = new XorCsrfTokenRequestAttributeHandler();

        @Override
        public void handle(HttpServletRequest request, HttpServletResponse response,
                           Supplier<CsrfToken> csrfToken) {
            this.xor.handle(request, response, csrfToken);
            csrfToken.get();
        }

        @Override
        public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
            String headerValue = request.getHeader(csrfToken.getHeaderName());
            return (StringUtils.hasText(headerValue) ? this.plain : this.xor)
                    .resolveCsrfTokenValue(request, csrfToken);
        }
    }

    /**
     * Forces deferred CSRF token load so Set-Cookie: XSRF-TOKEN is written on first request.
     */
    public static final class CsrfCookieFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                        FilterChain filterChain) throws ServletException, IOException {
            CsrfToken csrf = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrf != null) {
                csrf.getToken();
            }
            filterChain.doFilter(request, response);
        }
    }
}
