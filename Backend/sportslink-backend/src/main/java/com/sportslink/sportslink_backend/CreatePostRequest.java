package com.sportslink.sportslink_backend;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreatePostRequest(
        @NotBlank @Size(max = 5000) String content,
        @NotBlank @Pattern(regexp = "public|followers") String visibility) {
}
