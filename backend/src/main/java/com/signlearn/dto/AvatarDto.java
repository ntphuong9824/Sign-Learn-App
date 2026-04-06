package com.signlearn.dto;

import java.util.Date;

public class AvatarDto {
    private String id;
    private Date creationDate;
    private String url;

    public AvatarDto() {}

    public AvatarDto(String id, Date creationDate, String url) {
        this.id = id;
        this.creationDate = creationDate;
        this.url = url;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Date getCreationDate() { return creationDate; }
    public void setCreationDate(Date creationDate) { this.creationDate = creationDate; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}