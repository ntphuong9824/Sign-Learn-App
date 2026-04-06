package com.signlearn.controller;

import com.signlearn.dto.AppCheckTokenRequest;
import com.signlearn.service.AppCheckTokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/appcheck")
public class AppCheckController {

    private final AppCheckTokenService appCheckTokenService;

    public AppCheckController(AppCheckTokenService appCheckTokenService) {
        this.appCheckTokenService = appCheckTokenService;
    }

    /**
     * Receive and store AppCheck token from client (Angular, Mobile, etc.)
     * This allows the backend to use the token for external API calls
     */
    @PostMapping("/token")
    public ResponseEntity<Map<String, Object>> storeToken(
            @RequestBody AppCheckTokenRequest request,
            @RequestHeader(value = "X-Client-Source", defaultValue = "unknown") String source) {
        if (request.getToken() == null || request.getToken().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Token is required");
            return ResponseEntity.badRequest().body(error);
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
}
