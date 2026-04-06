package com.signlearn.dto;

public class SignWritingMtRequest {
    private SignWritingData data;

    public SignWritingMtRequest() {}

    public SignWritingMtRequest(String fsw) {
        this.data = new SignWritingData(fsw);
    }

    public SignWritingData getData() { return data; }
    public void setData(SignWritingData data) { this.data = data; }

    public static class SignWritingData {
        private String fsw;

        public SignWritingData() {}

        public SignWritingData(String fsw) {
            this.fsw = fsw;
        }

        public String getFsw() { return fsw; }
        public void setFsw(String fsw) { this.fsw = fsw; }
    }
}
