package com.sportslink.sportslink_backend;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ReviewApplicationRequest(
        @NotBlank @Pattern(regexp = "reviewing|shortlisted|accepted|rejected") String status) {
}
