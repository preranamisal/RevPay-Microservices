package com.revpay.wallet.controller;

import com.revpay.wallet.dto.WalletDtos.*;
import com.revpay.wallet.service.WalletService;
import jakarta.validation.Valid;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class WalletController {

    private static final Logger logger = LogManager.getLogger(WalletController.class);

    @Autowired private WalletService walletService;

    @PostMapping("/wallets/create/{userId}")
    public ResponseEntity<WalletDto> createWallet(@PathVariable Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(walletService.createWallet(userId));
    }

    @GetMapping("/wallets/{userId}")
    public ResponseEntity<WalletDto> getWallet(@PathVariable Long userId) {
        return ResponseEntity.ok(walletService.getWalletByUserId(userId));
    }

    @PostMapping("/wallets/{userId}/add-funds")
    public ResponseEntity<WalletDto> addFunds(
            @PathVariable Long userId,
            @Valid @RequestBody FundsRequest req) {
        logger.info("Adding funds {} to userId={}", req.getAmount(), userId);
        return ResponseEntity.ok(walletService.addFunds(userId, req));
    }

    @PostMapping("/wallets/{userId}/withdraw")
    public ResponseEntity<WalletDto> withdraw(
            @PathVariable Long userId,
            @Valid @RequestBody FundsRequest req) {
        logger.info("Withdrawing funds {} from userId={}", req.getAmount(), userId);
        return ResponseEntity.ok(walletService.withdrawFunds(userId, req));
    }

    @PostMapping("/wallets/internal/debit")
    public ResponseEntity<Map<String, String>> debitWallet(@RequestBody WalletTransactionRequest req) {
        walletService.debitWallet(req.getUserId(), req.getAmount());
        return ResponseEntity.ok(Map.of("message", "Debited successfully"));
    }

    @PostMapping("/wallets/internal/credit")
    public ResponseEntity<Map<String, String>> creditWallet(@RequestBody WalletTransactionRequest req) {
        walletService.creditWallet(req.getUserId(), req.getAmount());
        return ResponseEntity.ok(Map.of("message", "Credited successfully"));
    }

    @GetMapping("/wallets/{userId}/balance-check")
    public ResponseEntity<Map<String, Boolean>> checkBalance(
            @PathVariable Long userId,
            @RequestParam BigDecimal amount) {
        boolean sufficient = walletService.hasSufficientBalance(userId, amount);
        return ResponseEntity.ok(Map.of("sufficient", sufficient));
    }

    // ── Payment Methods ───────────────────────────────────────────────────────

    @PostMapping("/payment-methods/{userId}")
    public ResponseEntity<PaymentMethodDto> addPaymentMethod(
            @PathVariable Long userId,
            @RequestBody AddPaymentMethodRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(walletService.addPaymentMethod(userId, req));
    }

    @GetMapping("/payment-methods/{userId}")
    public ResponseEntity<List<PaymentMethodDto>> getPaymentMethods(@PathVariable Long userId) {
        return ResponseEntity.ok(walletService.getPaymentMethods(userId));
    }

    @DeleteMapping("/payment-methods/{id}/user/{userId}")
    public ResponseEntity<Map<String, String>> deletePaymentMethod(
            @PathVariable Long id,
            @PathVariable Long userId) {
        walletService.deletePaymentMethod(id, userId);
        return ResponseEntity.ok(Map.of("message", "Payment method deleted"));
    }

    @PutMapping("/payment-methods/{id}/user/{userId}/default")
    public ResponseEntity<PaymentMethodDto> setDefault(
            @PathVariable Long id,
            @PathVariable Long userId) {
        return ResponseEntity.ok(walletService.setDefaultPaymentMethod(id, userId));
    }
}
