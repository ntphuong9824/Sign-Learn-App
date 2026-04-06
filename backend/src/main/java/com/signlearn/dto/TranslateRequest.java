package com.signlearn.dto;

public class TranslateRequest {
    private String text;
    private String spoken;
    private String signed;

    public TranslateRequest() {}

    public TranslateRequest(String text, String spoken, String signed) {
        this.text = text;
        this.spoken = spoken;
        this.signed = signed;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getSpoken() { return spoken; }
    public void setSpoken(String spoken) { this.spoken = spoken; }
    public String getSigned() { return signed; }
    public void setSigned(String signed) { this.signed = signed; }
}