package com.revpay.loan.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_repayments")
public class LoanRepayment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long loanId;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal amount;
    @Column(precision = 15, scale = 2) private BigDecimal principal;
    @Column(precision = 15, scale = 2) private BigDecimal interest;
    private String status = "PAID";
    private LocalDate dueDate;
    private LocalDate paidDate;
    private Long transactionId;
    @CreationTimestamp private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getLoanId() { return loanId; }
    public void setLoanId(Long loanId) { this.loanId = loanId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getPrincipal() { return principal; }
    public void setPrincipal(BigDecimal principal) { this.principal = principal; }
    public BigDecimal getInterest() { return interest; }
    public void setInterest(BigDecimal interest) { this.interest = interest; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalDate getPaidDate() { return paidDate; }
    public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }
    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
