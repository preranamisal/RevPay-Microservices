package com.revpay.loan.service;

import com.revpay.loan.entity.*;
import com.revpay.loan.exception.ResourceNotFoundException;
import com.revpay.loan.repository.LoanRepository;
import com.revpay.loan.repository.LoanRepaymentRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class LoanService {

    private static final Logger logger = LogManager.getLogger(LoanService.class);

    @Autowired private LoanRepository loanRepository;
    @Autowired private LoanRepaymentRepository repaymentRepository;

    public Loan applyForLoan(Long businessUserId, BigDecimal amount, Integer tenureMonths,
                             String purpose, String documentUrls) {
        Loan loan = new Loan();
        loan.setApplicationNumber("LOAN-" + System.currentTimeMillis());
        loan.setBusinessUserId(businessUserId);
        loan.setRequestedAmount(amount);
        loan.setTenureMonths(tenureMonths);
        loan.setPurpose(purpose);
        loan.setDocumentUrls(documentUrls);
        loan.setStatus(LoanStatus.PENDING);
        logger.info("Loan application {} submitted for userId={}", loan.getApplicationNumber(), businessUserId);
        return loanRepository.save(loan);
    }

    public Loan approveLoan(Long loanId, BigDecimal approvedAmount, BigDecimal interestRate) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));
        loan.setApprovedAmount(approvedAmount);
        loan.setInterestRate(interestRate);
        loan.setStatus(LoanStatus.APPROVED);
        // Calculate EMI: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
        BigDecimal r = interestRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        double rD = r.doubleValue();
        double pD = approvedAmount.doubleValue();
        int n = loan.getTenureMonths();
        double emi = pD * rD * Math.pow(1 + rD, n) / (Math.pow(1 + rD, n) - 1);
        loan.setEmiAmount(BigDecimal.valueOf(emi).setScale(2, RoundingMode.HALF_UP));
        loan.setOutstandingAmount(approvedAmount);
        return loanRepository.save(loan);
    }

    public Loan disburseLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));
        loan.setStatus(LoanStatus.DISBURSED);
        loan.setDisbursementDate(LocalDate.now());
        loan.setNextEmiDate(LocalDate.now().plusMonths(1));
        loan.setStatus(LoanStatus.ACTIVE);
        return loanRepository.save(loan);
    }

    public Loan rejectLoan(Long loanId, String reason) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));
        loan.setStatus(LoanStatus.REJECTED);
        loan.setRejectionReason(reason);
        return loanRepository.save(loan);
    }

    public LoanRepayment makeRepayment(Long loanId, Long userId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));
        if (loan.getStatus() != LoanStatus.ACTIVE)
            throw new IllegalStateException("Loan is not active");

        BigDecimal emi = loan.getEmiAmount();
        LoanRepayment repayment = new LoanRepayment();
        repayment.setLoanId(loanId);
        repayment.setUserId(userId);
        repayment.setAmount(emi);
        repayment.setPaidDate(LocalDate.now());
        repayment.setDueDate(loan.getNextEmiDate());
        repayment.setStatus("PAID");

        loan.setOutstandingAmount(loan.getOutstandingAmount().subtract(emi).max(BigDecimal.ZERO));
        loan.setNextEmiDate(loan.getNextEmiDate().plusMonths(1));
        if (loan.getOutstandingAmount().compareTo(BigDecimal.ZERO) <= 0)
            loan.setStatus(LoanStatus.CLOSED);

        loanRepository.save(loan);
        return repaymentRepository.save(repayment);
    }

    public List<Loan> getUserLoans(Long userId) {
        return loanRepository.findByBusinessUserId(userId);
    }

    public Loan getLoanById(Long id) {
        return loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + id));
    }

    public List<LoanRepayment> getLoanRepayments(Long loanId) {
        return repaymentRepository.findByLoanId(loanId);
    }

    public Map<String, Object> getLoanAnalytics(Long userId) {
        List<Loan> loans = loanRepository.findByBusinessUserId(userId);
        BigDecimal totalBorrowed = loans.stream()
                .filter(l -> l.getApprovedAmount() != null)
                .map(Loan::getApprovedAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOutstanding = loans.stream()
                .filter(l -> l.getOutstandingAmount() != null)
                .map(Loan::getOutstandingAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long activeLoans = loans.stream().filter(l -> l.getStatus() == LoanStatus.ACTIVE).count();
        return Map.of(
            "totalLoans", loans.size(),
            "totalBorrowed", totalBorrowed,
            "totalOutstanding", totalOutstanding,
            "activeLoans", activeLoans
        );
    }

    public List<Map<String, Object>> getEmiSchedule(Long loanId) {
        Loan loan = getLoanById(loanId);
        if (loan.getApprovedAmount() == null) return Collections.emptyList();

        List<Map<String, Object>> schedule = new ArrayList<>();
        BigDecimal outstanding = loan.getApprovedAmount();
        BigDecimal r = loan.getInterestRate().divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        LocalDate dueDate = loan.getDisbursementDate() != null ?
                loan.getDisbursementDate().plusMonths(1) : LocalDate.now().plusMonths(1);

        for (int i = 1; i <= loan.getTenureMonths(); i++) {
            BigDecimal interestComp = outstanding.multiply(r).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalComp = loan.getEmiAmount().subtract(interestComp);
            outstanding = outstanding.subtract(principalComp).max(BigDecimal.ZERO);
            schedule.add(Map.of(
                "emiNumber", i,
                "dueDate", dueDate.toString(),
                "emiAmount", loan.getEmiAmount(),
                "principal", principalComp,
                "interest", interestComp,
                "outstanding", outstanding
            ));
            dueDate = dueDate.plusMonths(1);
        }
        return schedule;
    }
}
