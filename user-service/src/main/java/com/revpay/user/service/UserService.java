package com.revpay.user.service;

import com.revpay.user.dto.AuthDtos.*;
import com.revpay.user.entity.AccountStatus;
import com.revpay.user.entity.User;
import com.revpay.user.entity.UserRole;
import com.revpay.user.exception.ResourceNotFoundException;
import com.revpay.user.exception.UserAlreadyExistsException;
import com.revpay.user.repository.UserRepository;
import com.revpay.user.security.JwtUtil;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private static final Logger logger = LogManager.getLogger(UserService.class);

    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest req) {
        logger.info("Registering new user with email: {}", req.getEmail());

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered: " + req.getEmail());
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setPhone(req.getPhone());
        user.setRole(req.getRole() != null ? req.getRole() : UserRole.PERSONAL);
        user.setStatus(AccountStatus.ACTIVE);

        if (req.getRole() == UserRole.BUSINESS) {
            user.setBusinessName(req.getBusinessName());
            user.setBusinessType(req.getBusinessType());
            user.setGstNumber(req.getGstNumber());
        }

        User saved = userRepository.save(user);
        logger.info("User registered successfully with id: {}", saved.getId());

        String token = jwtUtil.generateToken(
                saved.getId().toString(), saved.getEmail(), saved.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(saved.getId().toString());

        return new AuthResponse(token, refreshToken, jwtUtil.getExpiration(), toDto(saved));
    }

    public AuthResponse login(LoginRequest req) {
        logger.info("Login attempt for email: {}", req.getEmail());

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (user.getStatus() == AccountStatus.LOCKED || user.getStatus() == AccountStatus.SUSPENDED) {
            throw new BadCredentialsException("Account is " + user.getStatus().name().toLowerCase());
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(
                user.getId().toString(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId().toString());

        logger.info("User logged in successfully: {}", user.getId());
        return new AuthResponse(token, refreshToken, jwtUtil.getExpiration(), toDto(user));
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return toDto(user);
    }

    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return toDto(user);
    }

    public UserDto updateProfile(Long id, UpdateProfileRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        if (req.getFirstName() != null) user.setFirstName(req.getFirstName());
        if (req.getLastName() != null) user.setLastName(req.getLastName());
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getBusinessName() != null) user.setBusinessName(req.getBusinessName());
        if (req.getBusinessType() != null) user.setBusinessType(req.getBusinessType());

        return toDto(userRepository.save(user));
    }

    public void changePassword(Long id, ChangePasswordRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        logger.info("Password changed for user: {}", id);
    }

    public void setPin(Long id, SetPinRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setPin(passwordEncoder.encode(req.getPin()));
        userRepository.save(user);
    }

    public boolean verifyPin(Long id, String pin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return user.getPin() != null && passwordEncoder.matches(pin, user.getPin());
    }

    public List<UserDto> searchUsers(String query) {
        return userRepository.searchUsers(query).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public void completeKyc(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setKycCompleted(true);
        userRepository.save(user);
    }

    private UserDto toDto(User u) {
        UserDto dto = new UserDto();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setFirstName(u.getFirstName());
        dto.setLastName(u.getLastName());
        dto.setPhone(u.getPhone());
        dto.setRole(u.getRole());
        dto.setStatus(u.getStatus());
        dto.setProfileImageUrl(u.getProfileImageUrl());
        dto.setBusinessName(u.getBusinessName());
        dto.setKycCompleted(u.isKycCompleted());
        dto.setCreatedAt(u.getCreatedAt());
        return dto;
    }
}
