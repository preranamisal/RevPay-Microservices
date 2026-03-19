package com.revpay.user.controller;

import com.revpay.user.dto.AuthDtos.*;
import com.revpay.user.service.UserService;
import jakarta.validation.Valid;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LogManager.getLogger(AuthController.class);

    @Autowired private UserService userService;

    @PostMapping("/auth/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        logger.info("POST /auth/register called");
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(req));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        logger.info("POST /auth/login called");
        return ResponseEntity.ok(userService.login(req));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/users/email/{email}")
    public ResponseEntity<UserDto> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @PutMapping("/users/{id}/profile")
    public ResponseEntity<UserDto> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(userService.updateProfile(id, req));
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(id, req);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/users/{id}/pin")
    public ResponseEntity<Map<String, String>> setPin(
            @PathVariable Long id,
            @Valid @RequestBody SetPinRequest req) {
        userService.setPin(id, req);
        return ResponseEntity.ok(Map.of("message", "PIN set successfully"));
    }

    @PostMapping("/users/{id}/verify-pin")
    public ResponseEntity<Map<String, Boolean>> verifyPin(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        boolean valid = userService.verifyPin(id, body.get("pin"));
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userService.searchUsers(query));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/users/{id}/kyc/complete")
    public ResponseEntity<Map<String, String>> completeKyc(@PathVariable Long id) {
        userService.completeKyc(id);
        return ResponseEntity.ok(Map.of("message", "KYC completed successfully"));
    }

    @GetMapping("/auth/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "user-service"));
    }
}
