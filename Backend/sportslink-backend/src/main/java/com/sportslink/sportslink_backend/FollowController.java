package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/follows")
public class FollowController {

    private final SupabaseFollowService followService;

    public FollowController(SupabaseFollowService followService) {
        this.followService = followService;
    }

    @GetMapping
    public JsonNode list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "following") String direction) {
        return followService.list(jwt, direction);
    }

    @PostMapping("/{profileId}")
    public JsonNode follow(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID profileId) {
        return followService.follow(jwt, profileId);
    }

    @DeleteMapping("/{profileId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID profileId) {
        followService.unfollow(jwt, profileId);
    }
}
