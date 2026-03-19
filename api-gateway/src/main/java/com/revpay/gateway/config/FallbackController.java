package com.revpay.gateway.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/user")
    public ResponseEntity<Map<String, String>> userFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "User Service is temporarily unavailable. Please try again later.",
                             "service", "user-service"));
    }

    @GetMapping("/wallet")
    public ResponseEntity<Map<String, String>> walletFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Wallet Service is temporarily unavailable. Please try again later.",
                             "service", "wallet-service"));
    }

    @GetMapping("/transaction")
    public ResponseEntity<Map<String, String>> transactionFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Transaction Service is temporarily unavailable. Please try again later.",
                             "service", "transaction-service"));
    }

    @GetMapping("/invoice")
    public ResponseEntity<Map<String, String>> invoiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Invoice Service is temporarily unavailable. Please try again later.",
                             "service", "invoice-service"));
    }

    @GetMapping("/loan")
    public ResponseEntity<Map<String, String>> loanFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Loan Service is temporarily unavailable. Please try again later.",
                             "service", "loan-service"));
    }

    @GetMapping("/notification")
    public ResponseEntity<Map<String, String>> notificationFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Notification Service is temporarily unavailable. Please try again later.",
                             "service", "notification-service"));
    }
}
