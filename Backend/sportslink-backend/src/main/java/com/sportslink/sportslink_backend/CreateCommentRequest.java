package com.sportslink.sportslink_backend;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateCommentRequest(@NotBlank @Size(max = 2000) String content) {
}
