package com.signlearn.controller;

import com.signlearn.dto.AvatarDto;
import com.signlearn.service.AvatarService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/avatars")
public class AvatarController {

    private final AvatarService avatarService;

    public AvatarController(AvatarService avatarService) {
        this.avatarService = avatarService;
    }

    @GetMapping
    public ResponseEntity<List<AvatarDto>> getAvatars(@RequestHeader("X-Owner-Id") String ownerId) {
        List<AvatarDto> avatars = avatarService.getAvatars(ownerId);
        return ResponseEntity.ok(avatars);
    }

    @DeleteMapping("/{avatarId}")
    public ResponseEntity<Void> deleteAvatar(
            @RequestHeader("X-Owner-Id") String ownerId,
            @PathVariable String avatarId) {
        avatarService.deleteAvatar(ownerId, avatarId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{avatarId}")
    public ResponseEntity<Void> createAvatar(
            @RequestHeader("X-Owner-Id") String ownerId,
            @PathVariable String avatarId,
            @RequestParam("file") MultipartFile file) throws IOException {
        avatarService.createAvatar(ownerId, avatarId, file.getBytes());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/generate-id")
    public ResponseEntity<AvatarDto> generateAvatarId() {
        String id = avatarService.generateAvatarId();
        AvatarDto dto = new AvatarDto(id, null, null);
        return ResponseEntity.ok(dto);
    }
}