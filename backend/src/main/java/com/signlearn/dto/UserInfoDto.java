package com.signlearn.dto;

import java.util.Date;
import java.util.List;

public class UserInfoDto {
    private String keyId;
    private String name;
    private Date expires;
    private RateLimitDto rateLimit;
    private boolean enabled;
    private List<String> permissions;

    public UserInfoDto() {}

    public String getKeyId() { return keyId; }
    public void setKeyId(String keyId) { this.keyId = keyId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Date getExpires() { return expires; }
    public void setExpires(Date expires) { this.expires = expires; }
    public RateLimitDto getRateLimit() { return rateLimit; }
    public void setRateLimit(RateLimitDto rateLimit) { this.rateLimit = rateLimit; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }

    public static class RateLimitDto {
        private int limit;
        private int remaining;
        private Date reset;

        public RateLimitDto() {}

        public RateLimitDto(int limit, int remaining, Date reset) {
            this.limit = limit;
            this.remaining = remaining;
            this.reset = reset;
        }

        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
        public int getRemaining() { return remaining; }
        public void setRemaining(int remaining) { this.remaining = remaining; }
        public Date getReset() { return reset; }
        public void setReset(Date reset) { this.reset = reset; }
    }
}