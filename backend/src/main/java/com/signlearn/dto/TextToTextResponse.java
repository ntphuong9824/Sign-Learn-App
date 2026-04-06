package com.signlearn.dto;

public class TextToTextResponse {
    private String direction;
    private String from;
    private String to;
    private String text;

    public TextToTextResponse() {}

    public TextToTextResponse(String direction, String from, String to, String text) {
        this.direction = direction;
        this.from = from;
        this.to = to;
        this.text = text;
    }

    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}