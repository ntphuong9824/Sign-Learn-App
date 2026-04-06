package com.signlearn.dto;

public class SignWritingResponse {
    private String description;

    public SignWritingResponse() {}

    public SignWritingResponse(String description) {
        this.description = description;
    }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}