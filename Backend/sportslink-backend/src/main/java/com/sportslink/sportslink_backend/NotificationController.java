package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final SupabaseNotificationService notificationService;

    public NotificationController(SupabaseNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public JsonNode list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        return notificationService.list(jwt, unreadOnly);
    }

    @PatchMapping("/{notificationId}/read")
    public JsonNode markRead(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID notificationId) {
        return notificationService.markRead(jwt, notificationId);
    }

    @DeleteMapping("/{notificationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID notificationId) {
        notificationService.delete(jwt, notificationId);
    }
}
