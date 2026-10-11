package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final SupabaseMessagingService messagingService;

    public ConversationController(SupabaseMessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @GetMapping
    public JsonNode list(@AuthenticationPrincipal Jwt jwt) {
        return messagingService.listConversations(jwt);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JsonNode create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateConversationRequest request) {
        return messagingService.createConversation(jwt, request);
    }

    @GetMapping("/{conversationId}/messages")
    public JsonNode listMessages(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId) {
        return messagingService.listMessages(jwt, conversationId);
    }

    @PostMapping("/{conversationId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public JsonNode sendMessage(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId,
            @Valid @RequestBody CreateMessageRequest request) {
        return messagingService.sendMessage(jwt, conversationId, request);
    }

    @PatchMapping("/{conversationId}/read")
    public JsonNode markRead(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId) {
        return messagingService.markRead(jwt, conversationId);
    }
}
