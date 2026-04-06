package com.signlearn.service.translate;

import com.signlearn.dto.TranslateResponse;
import com.signlearn.service.AppCheckTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Service
public class SpokenToSignedService {

    private static final Logger log = LoggerFactory.getLogger(SpokenToSignedService.class);

    private final RestTemplate restTemplate;
    private final AppCheckTokenService appCheckTokenService;

    @Value("${external-api.firebase-functions.base-url:https://us-central1-sign-mt.cloudfunctions.net}")
    private String firebaseFunctionsUrl;

    @Value("${external-api.app-check.token:}")
    private String configuredAppCheckToken;

    public SpokenToSignedService(RestTemplate restTemplate, AppCheckTokenService appCheckTokenService) {
        this.restTemplate = restTemplate;
        this.appCheckTokenService = appCheckTokenService;
    }

    public TranslateResponse translateSpokenToSigned(String text, String spoken, String signed) {
        URI uri = UriComponentsBuilder
                .fromUriString(firebaseFunctionsUrl + "/spoken_text_to_signed_pose")
                .queryParam("text", text)
                .queryParam("spoken", spoken)
                .queryParam("signed", signed)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();

        try {
            log.info("Calling spoken-to-signed API: text={}, spoken={}, signed={}", text, spoken, signed);

            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(Collections.singletonList(MediaType.ALL));

            String appCheckToken = configuredAppCheckToken;
            if (appCheckToken == null || appCheckToken.isEmpty()) {
                appCheckToken = appCheckTokenService.getToken();
            }
            if (appCheckToken != null && !appCheckToken.isEmpty() && configuredAppCheckToken != null && !configuredAppCheckToken.isEmpty()) {
                log.debug("Using configured AppCheck token for spoken-to-signed");
            }

            if (appCheckToken != null && !appCheckToken.isEmpty()) {
                headers.set("X-Firebase-AppCheck", appCheckToken);
                headers.set("X-AppCheck-Token", appCheckToken);
                log.debug("Using AppCheck token for spoken-to-signed");
            } else {
                log.warn("No AppCheck token available for spoken-to-signed");
            }

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> upstreamResponse = restTemplate.exchange(uri, HttpMethod.GET, entity, byte[].class);
            byte[] responseBody = upstreamResponse.getBody();

            if (responseBody == null || responseBody.length == 0) {
                log.error("Upstream returned an empty response for spoken-to-signed: uri={}", uri);
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Upstream returned an empty response for spoken-to-signed"
                );
            }
            MediaType contentType = upstreamResponse.getHeaders().getContentType();
            if (contentType != null && "application".equalsIgnoreCase(contentType.getType())
                    && "pose".equalsIgnoreCase(contentType.getSubtype())) {
                log.warn("Upstream spoken-to-signed returned binary pose payload; returning animation URL fallback");
                URI videoUri = UriComponentsBuilder
                        .fromUriString(firebaseFunctionsUrl + "/spoken_text_to_signed_video")
                        .queryParam("text", text)
                        .queryParam("spoken", spoken)
                        .queryParam("signed", signed)
                        .encode(StandardCharsets.UTF_8)
                        .build()
                        .toUri();
                return new TranslateResponse(null, videoUri.toString());
            }

            log.error("Upstream spoken-to-signed returned unsupported payload type: {}", contentType);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Upstream spoken-to-signed returned unsupported payload"
            );
        } catch (HttpStatusCodeException e) {
            log.error(
                    "Upstream spoken-to-signed failed: uri={}, status={}, body={}",
                    uri,
                    e.getStatusCode(),
                    e.getResponseBodyAsString(),
                    e
            );
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Upstream spoken-to-signed returned " + e.getStatusCode().value(),
                    e
            );
        } catch (Exception e) {
            log.error("Unexpected error calling upstream spoken-to-signed: uri={}", uri, e);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Failed to call spoken-to-signed upstream",
                    e
            );
        }
    }
}
