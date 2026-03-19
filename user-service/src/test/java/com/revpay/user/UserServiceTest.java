package com.revpay.user;

import com.revpay.user.dto.AuthDtos.*;
import com.revpay.user.entity.AccountStatus;
import com.revpay.user.entity.User;
import com.revpay.user.entity.UserRole;
import com.revpay.user.exception.UserAlreadyExistsException;
import com.revpay.user.repository.UserRepository;
import com.revpay.user.security.JwtUtil;
import com.revpay.user.service.UserService;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock private UserRepository userRepository;
    @Mock private JwtUtil jwtUtil;
    @Mock private PasswordEncoder passwordEncoder;

    private User testUser;

    @Before
    public void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@revpay.com");
        testUser.setPassword("encodedPassword");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setRole(UserRole.PERSONAL);
        testUser.setStatus(AccountStatus.ACTIVE);
    }

    @Test
    public void testRegister_Success() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@revpay.com");
        req.setPassword("password123");
        req.setFirstName("Jane");
        req.setLastName("Smith");
        req.setRole(UserRole.PERSONAL);

        when(userRepository.existsByEmail(req.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(req.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtUtil.generateToken(anyString(), anyString(), anyString())).thenReturn("mock-token");
        when(jwtUtil.generateRefreshToken(anyString())).thenReturn("mock-refresh-token");
        when(jwtUtil.getExpiration()).thenReturn(86400000L);

        AuthResponse result = userService.register(req);

        assertNotNull(result);
        assertEquals("mock-token", result.getToken());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test(expected = UserAlreadyExistsException.class)
    public void testRegister_EmailAlreadyExists() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("test@revpay.com");
        req.setPassword("password123");
        req.setFirstName("John");
        req.setLastName("Doe");

        when(userRepository.existsByEmail(req.getEmail())).thenReturn(true);

        userService.register(req);
    }

    @Test
    public void testLogin_Success() {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@revpay.com");
        req.setPassword("password123");

        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(req.getPassword(), testUser.getPassword())).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtUtil.generateToken(anyString(), anyString(), anyString())).thenReturn("mock-token");
        when(jwtUtil.generateRefreshToken(anyString())).thenReturn("mock-refresh-token");
        when(jwtUtil.getExpiration()).thenReturn(86400000L);

        AuthResponse result = userService.login(req);

        assertNotNull(result);
        assertNotNull(result.getToken());
    }

    @Test(expected = BadCredentialsException.class)
    public void testLogin_WrongPassword() {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@revpay.com");
        req.setPassword("wrongpassword");

        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(req.getPassword(), testUser.getPassword())).thenReturn(false);

        userService.login(req);
    }

    @Test
    public void testGetUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserDto result = userService.getUserById(1L);

        assertNotNull(result);
        assertEquals("test@revpay.com", result.getEmail());
        assertEquals("John", result.getFirstName());
    }

    @Test
    public void testVerifyPin_CorrectPin() {
        testUser.setPin("encodedPin");
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("1234", "encodedPin")).thenReturn(true);

        boolean result = userService.verifyPin(1L, "1234");

        assertTrue(result);
    }

    @Test
    public void testVerifyPin_WrongPin() {
        testUser.setPin("encodedPin");
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("9999", "encodedPin")).thenReturn(false);

        boolean result = userService.verifyPin(1L, "9999");

        assertFalse(result);
    }
}
