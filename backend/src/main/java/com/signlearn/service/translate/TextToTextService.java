package com.signlearn.service.translate;

import com.signlearn.dto.TextToTextResponse;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class TextToTextService {

    private static final Set<String> VALID_DIRECTIONS = Set.of("spoken-to-signed", "signed-to-spoken");

    public TextToTextResponse translate(String direction, String from, String to, String text) {
        // Validate direction
        if (!VALID_DIRECTIONS.contains(direction)) {
            throw new IllegalArgumentException("Invalid direction: " + direction);
        }

        if (from == null || to == null || text == null) {
            throw new IllegalArgumentException("Missing required parameters");
        }

        // TODO: Implement actual translation using model files from GCS
        // This requires: 1) Load model files from storage bucket
        //                2) Initialize translation model
        //                3) Perform translation

        // For now, return a placeholder response
        // In production, this would use Firebase Storage + translation model
        return new TextToTextResponse(direction, from, to, text);
    }
}