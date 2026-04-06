package com.signlearn.service.translate;

import com.signlearn.dto.NormalizeResponse;
import com.signlearn.service.AppCheckTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Service
public class TextNormalizationService {

    private static final Logger log = LoggerFactory.getLogger(TextNormalizationService.class);

    private final RestTemplate restTemplate;
    private final AppCheckTokenService appCheckTokenService;

    @Value("${external-api.sign-mt.base-url:https://sign.mt}")
    private String signMtBaseUrl;

    @Value("${external-api.app-check.token:}")
    private String configuredAppCheckToken;

    public TextNormalizationService(RestTemplate restTemplate, AppCheckTokenService appCheckTokenService) {
        this.restTemplate = restTemplate;
        this.appCheckTokenService = appCheckTokenService;
    }

    public NormalizeResponse normalizeText(String text, String lang) {
        URI uri = UriComponentsBuilder
                .fromUriString(signMtBaseUrl + "/api/text-normalization")
                .queryParam("text", text)
                .queryParam("lang", lang)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            // Add AppCheck token if available
            String appCheckToken = configuredAppCheckToken;
            if (appCheckToken == null || appCheckToken.isEmpty()) {
                appCheckToken = appCheckTokenService.getToken();
            }
            if (appCheckToken != null && !appCheckToken.isEmpty()) {
                headers.set("X-Firebase-AppCheck", appCheckToken);
                headers.set("X-AppCheck-Token", appCheckToken);
                log.debug("Using AppCheck token for text-normalization");
            } else {
                log.warn("No AppCheck token available for text-normalization");
            }

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            log.info("Calling text-normalization API with lang={}, text={}", lang, text);
            ResponseEntity<NormalizeResponse> upstream = restTemplate.exchange(uri, HttpMethod.GET, entity, NormalizeResponse.class);
            NormalizeResponse response = upstream.getBody();

            if (response == null || response.getText() == null || response.getText().isEmpty()) {
                log.warn("Text normalization API returned empty response for lang={}, text={}", lang, text);
            }

            return response != null ? response : new NormalizeResponse(text);
        } catch (Exception e) {
            log.error("Failed to call text-normalization API: lang={}, text={}, error={}", lang, text, e.getMessage(), e);
            // Fallback: return original text if external API fails
            return new NormalizeResponse(text);
        }
    }
}
