package com.signlearn.service;

import com.signlearn.dto.UserInfoDto;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/**
 * Service for user profile information.
 * Integrates with Unkey for authentication/authorization.
 */
@Service
public class UserService {

    /**
     * Get current user info from authentication context
     * TODO: Integrate with Unkey for actual user data
     */
    public UserInfoDto getCurrentUser(String keyId, String name, Date expires,
                                       boolean enabled, List<String> permissions) {
        // In production, this would come from Unkey auth middleware
        // For now, construct from available data
        return new UserInfoDto();
    }

    /**
     * Build user info from Unkey response
     */
    public UserInfoDto fromUnkeyContext(Object unkeyContext) {
        // TODO: Parse Unkey locals from authentication middleware
        // Expected structure from Unkey:
        // - keyId
        // - name
        // - expires
        // - rateLimit: { limit, remaining, reset }
        // - enabled
        // - permissions
        return new UserInfoDto();
    }
}