package com.signlearn.service;

import com.signlearn.dto.AvatarDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing user avatars.
 * Currently uses Firebase Storage - to be migrated to Spring Boot compatible storage.
 */
@Service
public class AvatarService {

    @Value("${storage.avatars-bucket:sign-mt-avatars}")
    private String avatarsBucket;

    /**
     * Get list of avatars for a user
     * TODO: Integrate with Google Cloud Storage
     */
    public List<AvatarDto> getAvatars(String ownerId) {
        // TODO: Implement actual GCS fetching
        // For now, return empty list
        // Implementation requires:
        // 1. Initialize GCS bucket
        // 2. List files with prefix: ownerId
        // 3. Group files by avatarId
        // 4. Generate signed URLs for masked.png
        return new ArrayList<>();
    }

    /**
     * Delete an avatar
     */
    public void deleteAvatar(String ownerId, String avatarId) {
        // TODO: Implement actual GCS deletion
        // Delete all files with prefix: ownerId/avatarId
    }

    /**
     * Create/upload an avatar
     * Proxies to external image-to-avatar service
     */
    public void createAvatar(String ownerId, String avatarId, byte[] imageData) {
        // TODO: Implement proxy to image-to-avatar service
        // POST to external service: https://image-to-avatar-665830225099.us-central1.run.app/{ownerId}/{avatarId}
    }

    /**
     * Generate a new avatar ID
     */
    public String generateAvatarId() {
        return UUID.randomUUID().toString();
    }
}