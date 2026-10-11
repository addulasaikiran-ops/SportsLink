package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final SupabaseProfileService profileService;

    public ProfileController(SupabaseProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public JsonNode getProfiles(@AuthenticationPrincipal Jwt jwt) {
        return profileService.getProfiles(jwt);
    }

    @GetMapping("/me")
    public JsonNode getMyProfile(@AuthenticationPrincipal Jwt jwt) {
        JsonNode profile = profileService.getMyProfile(jwt);
        if (profile == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No readable profile row exists for this account. Verify profile creation and the SELECT RLS policy.");
        }
        return profile;
    }

    @PatchMapping("/me")
    public JsonNode updateMyProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ProfileUpdateRequest request) {
        var updates = request.toUpdates();
        if (updates.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Provide at least one editable profile field.");
        }

        JsonNode profile = profileService.updateMyProfile(jwt, updates);
        if (profile == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No profile row was updated. Verify the profile row and UPDATE RLS policy.");
        }
        return profile;
    }
}
