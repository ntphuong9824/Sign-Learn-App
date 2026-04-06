package com.signlearn.controller;

import com.signlearn.dto.UserInfoDto;
import com.signlearn.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/v1/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserInfoDto> getCurrentUser(
            @RequestHeader(value = "X-Key-Id", required = false) String keyId,
            @RequestHeader(value = "X-Name", required = false) String name,
            @RequestHeader(value = "X-Expires", required = false) Date expires,
            @RequestHeader(value = "X-Enabled", required = false, defaultValue = "true") boolean enabled,
            @RequestHeader(value = "X-Permissions", required = false) List<String> permissions) {

        UserInfoDto userInfo = userService.getCurrentUser(keyId, name, expires, enabled, permissions);
        return ResponseEntity.ok(userInfo);
    }
}