package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts/{postId}")
public class PostInteractionController {

    private final SupabasePostInteractionService interactionService;

    public PostInteractionController(SupabasePostInteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @GetMapping("/comments")
    public JsonNode getComments(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID postId) {
        return interactionService.getComments(jwt, postId);
    }

    @PostMapping("/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public JsonNode createComment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID postId,
            @Valid @RequestBody CreateCommentRequest request) {
        return interactionService.createComment(jwt, postId, request);
    }

    @GetMapping("/reactions")
    public JsonNode getReactions(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID postId) {
        return interactionService.getReactions(jwt, postId);
    }

    @PutMapping("/reaction")
    public JsonNode setMyReaction(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID postId,
            @Valid @RequestBody SetReactionRequest request) {
        return interactionService.setMyReaction(jwt, postId, request);
    }

    @DeleteMapping("/reaction")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMyReaction(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID postId) {
        interactionService.deleteMyReaction(jwt, postId);
    }
}
