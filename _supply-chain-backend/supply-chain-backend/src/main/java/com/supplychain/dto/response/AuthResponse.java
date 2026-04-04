package com.supplychain.dto.response;

import com.supplychain.enums.UserRole;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
    private UserRole role;
    private long expiresInMs;
}