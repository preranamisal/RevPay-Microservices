package com.revpay.transaction.client;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class WalletClientFallback implements WalletClient {

    private static final Logger logger = LogManager.getLogger(WalletClientFallback.class);

    @Override
    public ResponseEntity<Map<String, Boolean>> checkBalance(Long userId, BigDecimal amount) {
        logger.warn("WalletClient fallback: checkBalance userId={}", userId);
        return ResponseEntity.ok(Map.of("sufficient", false));
    }

    @Override
    public ResponseEntity<Map<String, String>> debitWallet(Map<String, Object> req) {
        logger.error("WalletClient fallback: debitWallet - wallet service unavailable");
        throw new RuntimeException("Wallet service is unavailable");
    }

    @Override
    public ResponseEntity<Map<String, String>> creditWallet(Map<String, Object> req) {
        logger.error("WalletClient fallback: creditWallet - wallet service unavailable");
        throw new RuntimeException("Wallet service is unavailable");
    }
}
