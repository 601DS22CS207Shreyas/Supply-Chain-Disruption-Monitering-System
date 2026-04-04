package com.supplychain.service;

import com.supplychain.dto.request.LoginRequest;
import com.supplychain.dto.request.RegisterRequest;
import com.supplychain.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest req);

    AuthResponse login(LoginRequest req);
}