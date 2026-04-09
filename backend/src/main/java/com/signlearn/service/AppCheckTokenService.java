package com.signlearn.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AppCheckTokenService {

    private static final Logger log = LoggerFactory.getLogger(AppCheckTokenService.class);

    // Cache for AppCheck tokens with expiration
    private final ConcurrentHashMap<String, TokenInfo> tokenCache = new ConcurrentHashMap<>();

    // Default token expiration: 50 minutes (AppCheck tokens typically expire in 1 hour)
    private static final long TOKEN_EXPIRY_MINUTES = 50;

    // Token validation constraints
    private static final int MIN_TOKEN_LENGTH = 10;
    private static final int MAX_TOKEN_LENGTH = 1000;
    private static final int MAX_SOURCE_LENGTH = 100;

    public static class TokenInfo {
        private final String token;
        private final LocalDateTime expiresAt;

        public TokenInfo(String token, LocalDateTime expiresAt) {
            this.token = token;
            this.expiresAt = expiresAt;
        }

        public String getToken() { return token; }
        public LocalDateTime getExpiresAt() { return expiresAt; }

        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }
    }

    /**
     * Store an AppCheck token
     * @param token The AppCheck token
     * @param source Source identifier (e.g., "react", "mobile")
     * @throws IllegalArgumentException if token or source is invalid
     */
    public void storeToken(String token, String source) {
        // Validate token
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Token cannot be null or empty");
        }
        if (token.length() < MIN_TOKEN_LENGTH) {
            throw new IllegalArgumentException("Token too short. Minimum length is " + MIN_TOKEN_LENGTH);
        }
        if (token.length() > MAX_TOKEN_LENGTH) {
            throw new IllegalArgumentException("Token too long. Maximum length is " + MAX_TOKEN_LENGTH);
        }

        // Validate source
        if (source == null || source.trim().isEmpty()) {
            throw new IllegalArgumentException("Source cannot be null or empty");
        }
        if (source.length() > MAX_SOURCE_LENGTH) {
            throw new IllegalArgumentException("Source too long. Maximum length is " + MAX_SOURCE_LENGTH);
        }

        LocalDateTime expiresAt = LocalDateTime.now().plus(TOKEN_EXPIRY_MINUTES, ChronoUnit.MINUTES);
        TokenInfo tokenInfo = new TokenInfo(token, expiresAt);
        tokenCache.put(source, tokenInfo);
        log.info("Stored AppCheck token from source: {}, expires at: {}", source, expiresAt);
    }

    /**
     * Get the most recent valid AppCheck token
     * @return The token or null if no valid token exists
     */
    public String getToken() {
        TokenInfo tokenInfo = tokenCache.values().stream()
                .filter(t -> !t.isExpired())
                // Newest token has the furthest expiry because we set fixed TTL at store time.
                .max(Comparator.comparing(TokenInfo::getExpiresAt))
                .orElse(null);

        if (tokenInfo == null) {
            log.warn("No valid AppCheck token available");
            return null;
        }

        if (tokenInfo.isExpired()) {
            log.warn("AppCheck token expired at: {}", tokenInfo.getExpiresAt());
            return null;
        }

        return tokenInfo.getToken();
    }

    /**
     * Check if a valid token is available
     * @return true if a valid token exists
     */
    public boolean hasValidToken() {
        return getToken() != null;
    }

    /**
     * Clear all cached tokens
     */
    public void clearTokens() {
        tokenCache.clear();
        log.info("Cleared all AppCheck tokens");
    }

    /**
     * Get token info for debugging
     * @return Map of source to expiration time
     */
    public java.util.Map<String, String> getTokenInfo() {
        java.util.Map<String, String> info = new java.util.HashMap<>();
        tokenCache.forEach((source, tokenInfo) -> {
            info.put(source, tokenInfo.isExpired() ? "EXPIRED" : tokenInfo.getExpiresAt().toString());
        });
        return info;
    }
}
