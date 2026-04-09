package com.signlearn.controller;

import com.signlearn.dto.AppCheckTokenRequest;
import com.signlearn.service.AppCheckTokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/v1/appcheck")
public class AppCheckController {

    private final AppCheckTokenService appCheckTokenService;

    // Rate limiting: max 10 requests per minute per IP
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private final ConcurrentHashMap<String, RateLimitInfo> rateLimitCache = new ConcurrentHashMap<>();

    public AppCheckController(AppCheckTokenService appCheckTokenService) {
        this.appCheckTokenService = appCheckTokenService;
    }

    /**
     * Receive and store AppCheck token from client (React, Mobile, etc.)
     * This allows the backend to use the token for external API calls
     */
    @PostMapping("/token")
    public ResponseEntity<Map<String, Object>> storeToken(
            @RequestBody AppCheckTokenRequest request,
            @RequestHeader(value = "X-Client-Source", defaultValue = "unknown") String source,
            @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
            @RequestHeader(value = "X-Real-IP", required = false) String realIp) {
        if (request.getToken() == null || request.getToken().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Token is required");
            return ResponseEntity.badRequest().body(error);
        }

        // Get client IP for rate limiting
        String clientIp = getClientIp(forwardedFor, realIp);

        // Check rate limit
        if (!checkRateLimit(clientIp)) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Too many requests. Please try again later.");
            return ResponseEntity.status(429).body(error);
        }

        appCheckTokenService.storeToken(request.getToken(), source);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Token stored successfully");
        response.put("source", source);
        return ResponseEntity.ok(response);
    }

    /**
     * Check if a valid AppCheck token is available
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getTokenStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("hasValidToken", appCheckTokenService.hasValidToken());
        response.put("tokenInfo", appCheckTokenService.getTokenInfo());
        return ResponseEntity.ok(response);
    }

    /**
     * Clear all cached tokens (for testing/debugging)
     */
    @DeleteMapping("/token")
    public ResponseEntity<Map<String, Object>> clearTokens() {
        appCheckTokenService.clearTokens();
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "All tokens cleared");
        return ResponseEntity.ok(response);
    }

    /**
     * Get client IP address from headers
     */
    private String getClientIp(String forwardedFor, String realIp) {
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return forwardedFor.split(",")[0].trim();
        }
        if (realIp != null && !realIp.isEmpty()) {
            return realIp;
        }
        return "unknown";
    }

    /**
     * Check if the client has exceeded the rate limit
     */
    private boolean checkRateLimit(String clientIp) {
        LocalDateTime now = LocalDateTime.now();
        RateLimitInfo info = rateLimitCache.computeIfAbsent(
            clientIp,
            k -> new RateLimitInfo(now)
        );

        // Reset if the window has expired
        if (now.isAfter(info.windowStart.plus(1, ChronoUnit.MINUTES))) {
            info.windowStart = now;
            info.requestCount.set(0);
        }

        // Check if limit exceeded
        if (info.requestCount.get() >= MAX_REQUESTS_PER_MINUTE) {
            return false;
        }

        info.requestCount.incrementAndGet();
        return true;
    }

    /**
     * Rate limit information for a client
     */
    private static class RateLimitInfo {
        LocalDateTime windowStart;
        AtomicInteger requestCount;

        RateLimitInfo(LocalDateTime windowStart) {
            this.windowStart = windowStart;
            this.requestCount = new AtomicInteger(0);
        }
    }
}
