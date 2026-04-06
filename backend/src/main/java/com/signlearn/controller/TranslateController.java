package com.signlearn.controller;

import com.signlearn.dto.*;
import com.signlearn.service.AppCheckTokenService;
import com.signlearn.service.translate.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/translate")
public class TranslateController {

    private final TextNormalizationService textNormalizationService;
    private final SpokenToSignedService spokenToSignedService;
    private final SignWritingService signWritingService;
    private final TextToTextService textToTextService;
    private final AppCheckTokenService appCheckTokenService;

    public TranslateController(
            TextNormalizationService textNormalizationService,
            SpokenToSignedService spokenToSignedService,
            SignWritingService signWritingService,
            TextToTextService textToTextService,
            AppCheckTokenService appCheckTokenService) {
        this.textNormalizationService = textNormalizationService;
        this.spokenToSignedService = spokenToSignedService;
        this.signWritingService = signWritingService;
        this.textToTextService = textToTextService;
        this.appCheckTokenService = appCheckTokenService;
    }

    @GetMapping("/normalize")
    public ResponseEntity<NormalizeResponse> normalize(
            @RequestParam String lang,
            @RequestParam String text,
            @RequestHeader(value = "X-Firebase-AppCheck", required = false) String firebaseAppCheck,
            @RequestHeader(value = "X-AppCheck-Token", required = false) String appCheckToken,
            @RequestHeader(value = "X-Client-Source", required = false) String source) {
        cacheRequestAppCheckToken(firebaseAppCheck, appCheckToken, source);
        NormalizeResponse response = textNormalizationService.normalizeText(text, lang);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/spoken-to-signed")
    public ResponseEntity<TranslateResponse> spokenToSigned(
            @RequestParam String text,
            @RequestParam String spoken,
            @RequestParam String signed,
            @RequestHeader(value = "X-Firebase-AppCheck", required = false) String firebaseAppCheck,
            @RequestHeader(value = "X-AppCheck-Token", required = false) String appCheckToken,
            @RequestHeader(value = "X-Client-Source", required = false) String source) {
        cacheRequestAppCheckToken(firebaseAppCheck, appCheckToken, source);
        TranslateResponse response = spokenToSignedService.translateSpokenToSigned(text, spoken, signed);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signwriting/describe")
    public ResponseEntity<SignWritingResponse> describeSignWriting(
            @RequestBody SignWritingRequest request,
            @RequestHeader(value = "X-Firebase-AppCheck", required = false) String firebaseAppCheck,
            @RequestHeader(value = "X-AppCheck-Token", required = false) String appCheckToken,
            @RequestHeader(value = "X-Client-Source", required = false) String source) {
        cacheRequestAppCheckToken(firebaseAppCheck, appCheckToken, source);
        SignWritingResponse response = signWritingService.describeSignWriting(request.getFsw());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/text-to-text/{direction}")
    public ResponseEntity<TextToTextResponse> textToText(
            @PathVariable String direction,
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam String text,
            @RequestHeader(value = "X-Firebase-AppCheck", required = false) String firebaseAppCheck,
            @RequestHeader(value = "X-AppCheck-Token", required = false) String appCheckToken,
            @RequestHeader(value = "X-Client-Source", required = false) String source) {
        cacheRequestAppCheckToken(firebaseAppCheck, appCheckToken, source);
        TextToTextResponse response = textToTextService.translate(direction, from, to, text);
        return ResponseEntity.ok(response);
    }

    private void cacheRequestAppCheckToken(String firebaseAppCheck, String appCheckToken, String source) {
        String token = firebaseAppCheck;
        if (token == null || token.isBlank()) {
            token = appCheckToken;
        }
        if (token == null || token.isBlank()) {
            return;
        }

        String tokenSource = (source == null || source.isBlank()) ? "translate-request" : source;
        appCheckTokenService.storeToken(token, tokenSource);
    }
}
