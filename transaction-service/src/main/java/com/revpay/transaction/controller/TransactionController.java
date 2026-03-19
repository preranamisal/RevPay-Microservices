package com.revpay.transaction.controller;

import com.revpay.transaction.dto.TransactionDtos.*;
import com.revpay.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    private static final Logger logger = LogManager.getLogger(TransactionController.class);

    @Autowired private TransactionService transactionService;

    @PostMapping("/send")
    public ResponseEntity<TransactionDto> sendMoney(@Valid @RequestBody SendMoneyRequest req) {
        logger.info("POST /transactions/send from userId={}", req.getSenderId());
        return ResponseEntity.status(HttpStatus.CREATED).body(transactionService.sendMoney(req));
    }

    @PostMapping("/request")
    public ResponseEntity<MoneyRequestDto> requestMoney(@Valid @RequestBody RequestMoneyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transactionService.createMoneyRequest(req));
    }

    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<TransactionDto> acceptRequest(
            @PathVariable Long requestId,
            @RequestParam Long payerId) {
        return ResponseEntity.ok(transactionService.acceptMoneyRequest(requestId, payerId));
    }

    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<MoneyRequestDto> rejectRequest(
            @PathVariable Long requestId,
            @RequestParam Long payerId) {
        return ResponseEntity.ok(transactionService.rejectMoneyRequest(requestId, payerId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<TransactionDto>> getTransactions(
            @PathVariable Long userId,
            @ModelAttribute TransactionFilterRequest filter) {
        return ResponseEntity.ok(transactionService.getTransactionsWithFilters(userId, filter));
    }

    @GetMapping("/user/{userId}/recent")
    public ResponseEntity<List<TransactionDto>> getRecentTransactions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(transactionService.getRecentTransactions(userId, limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDto> getTransaction(@PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getTransactionById(id));
    }

    @GetMapping("/user/{userId}/pending-requests")
    public ResponseEntity<List<MoneyRequestDto>> getPendingRequests(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getPendingMoneyRequests(userId));
    }

    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<TransactionSummaryDto> getSummary(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getSummary(userId));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "transaction-service"));
    }
}
