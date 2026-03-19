package com.revpay.loan.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String applicationNumber;

    @Column(nullable = false)
    private Long businessUserId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal requestedAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal approvedAmount;

    @Column(precision = 5, scale = 2)
    private BigDecimal interestRate;

    private Integer tenureMonths;

    @Column(precision = 15, scale = 2)
    private BigDecimal emiAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal outstandingAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status = LoanStatus.PENDING;

    private String purpose;
    private String documentUrls;
    private String rejectionReason;

    private LocalDate disbursementDate;
    private LocalDate nextEmiDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getApplicationNumber() { return applicationNumber; }
    public void setApplicationNumber(String applicationNumber) { this.applicationNumber = applicationNumber; }
    public Long getBusinessUserId() { return businessUserId; }
    public void setBusinessUserId(Long businessUserId) { this.businessUserId = businessUserId; }
    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public void setRequestedAmount(BigDecimal requestedAmount) { this.requestedAmount = requestedAmount; }
    public BigDecimal getApprovedAmount() { return approvedAmount; }
    public void setApprovedAmount(BigDecimal approvedAmount) { this.approvedAmount = approvedAmount; }
    public BigDecimal getInterestRate() { return interestRate; }
    public void setInterestRate(BigDecimal interestRate) { this.interestRate = interestRate; }
    public Integer getTenureMonths() { return tenureMonths; }
    public void setTenureMonths(Integer tenureMonths) { this.tenureMonths = tenureMonths; }
    public BigDecimal getEmiAmount() { return emiAmount; }
    public void setEmiAmount(BigDecimal emiAmount) { this.emiAmount = emiAmount; }
    public BigDecimal getOutstandingAmount() { return outstandingAmount; }
    public void setOutstandingAmount(BigDecimal outstandingAmount) { this.outstandingAmount = outstandingAmount; }
    public LoanStatus getStatus() { return status; }
    public void setStatus(LoanStatus status) { this.status = status; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getDocumentUrls() { return documentUrls; }
    public void setDocumentUrls(String documentUrls) { this.documentUrls = documentUrls; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public LocalDate getDisbursementDate() { return disbursementDate; }
    public void setDisbursementDate(LocalDate disbursementDate) { this.disbursementDate = disbursementDate; }
    public LocalDate getNextEmiDate() { return nextEmiDate; }
    public void setNextEmiDate(LocalDate nextEmiDate) { this.nextEmiDate = nextEmiDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
