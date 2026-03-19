package com.revpay.user.dto;

import com.revpay.user.entity.AccountStatus;
import com.revpay.user.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class AuthDtos {

    // ── Register ──────────────────────────────────────────────────────────────
    public static class RegisterRequest {
        @NotBlank @Email
        private String email;

        @NotBlank @Size(min = 8)
        private String password;

        @NotBlank private String firstName;
        @NotBlank private String lastName;
        private String phone;
        private UserRole role = UserRole.PERSONAL;

        // Business extras
        private String businessName;
        private String businessType;
        private String gstNumber;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public UserRole getRole() { return role; }
        public void setRole(UserRole role) { this.role = role; }
        public String getBusinessName() { return businessName; }
        public void setBusinessName(String businessName) { this.businessName = businessName; }
        public String getBusinessType() { return businessType; }
        public void setBusinessType(String businessType) { this.businessType = businessType; }
        public String getGstNumber() { return gstNumber; }
        public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public static class LoginRequest {
        @NotBlank @Email
        private String email;

        @NotBlank
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    // ── Auth Response ─────────────────────────────────────────────────────────
    public static class AuthResponse {
        private String token;
        private String refreshToken;
        private String tokenType = "Bearer";
        private long expiresIn;
        private UserDto user;

        public AuthResponse(String token, String refreshToken, long expiresIn, UserDto user) {
            this.token = token;
            this.refreshToken = refreshToken;
            this.expiresIn = expiresIn;
            this.user = user;
        }

        public String getToken() { return token; }
        public String getRefreshToken() { return refreshToken; }
        public String getTokenType() { return tokenType; }
        public long getExpiresIn() { return expiresIn; }
        public UserDto getUser() { return user; }
    }

    // ── User DTO ──────────────────────────────────────────────────────────────
    public static class UserDto {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
        private String phone;
        private UserRole role;
        private AccountStatus status;
        private String profileImageUrl;
        private String businessName;
        private boolean kycCompleted;
        private LocalDateTime createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public UserRole getRole() { return role; }
        public void setRole(UserRole role) { this.role = role; }
        public AccountStatus getStatus() { return status; }
        public void setStatus(AccountStatus status) { this.status = status; }
        public String getProfileImageUrl() { return profileImageUrl; }
        public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
        public String getBusinessName() { return businessName; }
        public void setBusinessName(String businessName) { this.businessName = businessName; }
        public boolean isKycCompleted() { return kycCompleted; }
        public void setKycCompleted(boolean kycCompleted) { this.kycCompleted = kycCompleted; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    // ── Update Profile ────────────────────────────────────────────────────────
    public static class UpdateProfileRequest {
        private String firstName;
        private String lastName;
        private String phone;
        private String businessName;
        private String businessType;

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getBusinessName() { return businessName; }
        public void setBusinessName(String businessName) { this.businessName = businessName; }
        public String getBusinessType() { return businessType; }
        public void setBusinessType(String businessType) { this.businessType = businessType; }
    }

    // ── Change Password ───────────────────────────────────────────────────────
    public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @NotBlank @Size(min = 8) private String newPassword;

        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    // ── Set PIN ───────────────────────────────────────────────────────────────
    public static class SetPinRequest {
        @NotBlank @Size(min = 4, max = 6) private String pin;

        public String getPin() { return pin; }
        public void setPin(String pin) { this.pin = pin; }
    }
}
