package com.signlearn.dto;

public class AppCheckTokenRequest {
    private String token;

    public AppCheckTokenRequest() {}

    public AppCheckTokenRequest(String token) {
        this.token = token;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
