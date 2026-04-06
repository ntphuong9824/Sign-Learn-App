package com.signlearn.service.translate;

import com.signlearn.dto.SignWritingMtRequest;
import com.signlearn.dto.SignWritingResponse;
import com.signlearn.service.AppCheckTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Service
public class SignWritingService {

    private static final Logger log = LoggerFactory.getLogger(SignWritingService.class);

    private final RestTemplate restTemplate;
    private final AppCheckTokenService appCheckTokenService;

    @Value("${external-api.sign-mt.base-url:https://sign.mt}")
    private String signMtBaseUrl;

    @Value("${external-api.app-check.token:}")
    private String configuredAppCheckToken;

    public SignWritingService(RestTemplate restTemplate, AppCheckTokenService appCheckTokenService) {
        this.restTemplate = restTemplate;
        this.appCheckTokenService = appCheckTokenService;
    }

    public SignWritingResponse describeSignWriting(String fsw) {
        URI uri = UriComponentsBuilder
                .fromUriString(signMtBaseUrl + "/api/signwriting-description")
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            // Add AppCheck token if available
            String appCheckToken = configuredAppCheckToken;
            if (appCheckToken == null || appCheckToken.isEmpty()) {
                appCheckToken = appCheckTokenService.getToken();
            }
            if (appCheckToken != null && !appCheckToken.isEmpty()) {
                headers.set("X-Firebase-AppCheck", appCheckToken);
                headers.set("X-AppCheck-Token", appCheckToken);
                log.debug("Using AppCheck token for signwriting-description");
            } else {
                log.warn("No AppCheck token available for signwriting-description");
            }

            // Use correct format: {data: {fsw: "..."}}
            SignWritingMtRequest request = new SignWritingMtRequest(fsw);
            HttpEntity<SignWritingMtRequest> entity = new HttpEntity<>(request, headers);

            log.info("Calling signwriting-description API with fsw: {}", fsw);
            ResponseEntity<String> upstream = restTemplate.postForEntity(uri, entity, String.class);
            SignWritingResponse response = mapUpstreamResponse(upstream.getBody());

            if (response.getDescription() == null || response.getDescription().isEmpty()) {
                log.warn("SignWriting API returned empty response for fsw: {}", fsw);
            }

            return response;
        } catch (Exception e) {
            log.error("Failed to call signwriting-description API: fsw={}, error={}", fsw, e.getMessage(), e);
            // Return empty description on failure
            return new SignWritingResponse("");
        }
    }

    private SignWritingResponse mapUpstreamResponse(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return new SignWritingResponse("");
        }

        String description = extractDescriptionValue(responseBody);
        return new SignWritingResponse(description != null ? description : "");
    }

    private String extractDescriptionValue(String json) {
        String marker = "\"description\"";
        int keyIndex = json.indexOf(marker);
        if (keyIndex < 0) {
            return null;
        }

        int colonIndex = json.indexOf(':', keyIndex + marker.length());
        if (colonIndex < 0) {
            return null;
        }

        int startQuote = json.indexOf('"', colonIndex + 1);
        if (startQuote < 0) {
            return null;
        }

        int endQuote = startQuote + 1;
        while (endQuote < json.length()) {
            char ch = json.charAt(endQuote);
            if (ch == '"' && json.charAt(endQuote - 1) != '\\') {
                break;
            }
            endQuote++;
        }

        if (endQuote >= json.length()) {
            return null;
        }

        return json.substring(startQuote + 1, endQuote);
    }
}
