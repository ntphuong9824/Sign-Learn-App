package com.signlearn.dto;

public class SignWritingRequest {
    private String fsw;

    public SignWritingRequest() {}

    public SignWritingRequest(String fsw) {
        this.fsw = fsw;
    }

    public String getFsw() { return fsw; }
    public void setFsw(String fsw) { this.fsw = fsw; }
}