package com.revpay.transaction.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@FeignClient(name = "wallet-service", fallback = WalletClientFallback.class)
public interface WalletClient {

    @GetMapping("/api/wallets/{userId}/balance-check")
    ResponseEntity<Map<String, Boolean>> checkBalance(
            @PathVariable Long userId,
            @RequestParam BigDecimal amount);

    @PostMapping("/api/wallets/internal/debit")
    ResponseEntity<Map<String, String>> debitWallet(@RequestBody Map<String, Object> req);

    @PostMapping("/api/wallets/internal/credit")
    ResponseEntity<Map<String, String>> creditWallet(@RequestBody Map<String, Object> req);
}
