package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final SupabasePostService postService;

    public PostController(SupabasePostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public JsonNode getFeed(@AuthenticationPrincipal Jwt jwt) {
        return postService.getFeed(jwt);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JsonNode createPost(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreatePostRequest request) {
        return postService.createPost(jwt, request);
    }
}
