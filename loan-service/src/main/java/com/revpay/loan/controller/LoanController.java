package com.revpay.loan.controller;

import com.revpay.loan.entity.Loan;
import com.revpay.loan.entity.LoanRepayment;
import com.revpay.loan.service.LoanService;
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
@RequestMapping("/api/loans")
@CrossOrigin(origins = "*")
public class LoanController {

    private static final Logger logger = LogManager.getLogger(LoanController.class);

    @Autowired private LoanService loanService;

    @PostMapping("/apply")
    public ResponseEntity<Loan> applyLoan(@RequestBody Map<String, Object> req) {
        Long userId = Long.valueOf(req.get("businessUserId").toString());
        BigDecimal amount = new BigDecimal(req.get("requestedAmount").toString());
        Integer tenure = Integer.valueOf(req.get("tenureMonths").toString());
        String purpose = req.getOrDefault("purpose", "").toString();
        String docs = req.getOrDefault("documentUrls", "").toString();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(loanService.applyForLoan(userId, amount, tenure, purpose, docs));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Loan> approveLoan(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req) {
        BigDecimal approved = new BigDecimal(req.get("approvedAmount").toString());
        BigDecimal rate = new BigDecimal(req.get("interestRate").toString());
        return ResponseEntity.ok(loanService.approveLoan(id, approved, rate));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Loan> rejectLoan(
            @PathVariable Long id,
            @RequestBody Map<String, String> req) {
        return ResponseEntity.ok(loanService.rejectLoan(id, req.get("reason")));
    }

    @PostMapping("/{id}/disburse")
    public ResponseEntity<Loan> disburseLoan(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.disburseLoan(id));
    }

    @PostMapping("/{id}/repay")
    public ResponseEntity<LoanRepayment> makeRepayment(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(loanService.makeRepayment(id, userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Loan>> getUserLoans(@PathVariable Long userId) {
        return ResponseEntity.ok(loanService.getUserLoans(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Loan> getLoan(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getLoanById(id));
    }

    @GetMapping("/{id}/repayments")
    public ResponseEntity<List<LoanRepayment>> getRepayments(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getLoanRepayments(id));
    }

    @GetMapping("/{id}/emi-schedule")
    public ResponseEntity<List<Map<String, Object>>> getEmiSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getEmiSchedule(id));
    }

    @GetMapping("/user/{userId}/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(@PathVariable Long userId) {
        return ResponseEntity.ok(loanService.getLoanAnalytics(userId));
    }
}
