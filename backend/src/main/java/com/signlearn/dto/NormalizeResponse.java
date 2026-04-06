package com.signlearn.dto;

public class NormalizeResponse {
    private String text;

    public NormalizeResponse() {}

    public NormalizeResponse(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}