package com.revpay.invoice.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class InvoiceDtos {

    public static class LineItemRequest {
        @NotNull private String description;
        @NotNull private Integer quantity;
        @NotNull private BigDecimal unitPrice;

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    }

    public static class CreateInvoiceRequest {
        @NotNull private Long businessUserId;
        @NotNull private Long clientUserId;
        private String clientEmail;
        private String clientName;
        private BigDecimal taxRate = BigDecimal.ZERO;
        private LocalDate dueDate;
        private String notes;
        private String termsAndConditions;
        @NotNull private List<LineItemRequest> lineItems;

        public Long getBusinessUserId() { return businessUserId; }
        public void setBusinessUserId(Long businessUserId) { this.businessUserId = businessUserId; }
        public Long getClientUserId() { return clientUserId; }
        public void setClientUserId(Long clientUserId) { this.clientUserId = clientUserId; }
        public String getClientEmail() { return clientEmail; }
        public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }
        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }
        public BigDecimal getTaxRate() { return taxRate; }
        public void setTaxRate(BigDecimal taxRate) { this.taxRate = taxRate; }
        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public String getTermsAndConditions() { return termsAndConditions; }
        public void setTermsAndConditions(String tc) { this.termsAndConditions = tc; }
        public List<LineItemRequest> getLineItems() { return lineItems; }
        public void setLineItems(List<LineItemRequest> lineItems) { this.lineItems = lineItems; }
    }

    public static class LineItemDto {
        private Long id;
        private String description;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal total;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
        public BigDecimal getTotal() { return total; }
        public void setTotal(BigDecimal total) { this.total = total; }
    }

    public static class InvoiceDto {
        private Long id;
        private String invoiceNumber;
        private Long businessUserId;
        private Long clientUserId;
        private String clientEmail;
        private String clientName;
        private BigDecimal subtotal;
        private BigDecimal taxRate;
        private BigDecimal taxAmount;
        private BigDecimal totalAmount;
        private String status;
        private LocalDate dueDate;
        private String notes;
        private String termsAndConditions;
        private Long paymentTransactionId;
        private LocalDateTime paidAt;
        private List<LineItemDto> lineItems;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getInvoiceNumber() { return invoiceNumber; }
        public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
        public Long getBusinessUserId() { return businessUserId; }
        public void setBusinessUserId(Long uid) { this.businessUserId = uid; }
        public Long getClientUserId() { return clientUserId; }
        public void setClientUserId(Long uid) { this.clientUserId = uid; }
        public String getClientEmail() { return clientEmail; }
        public void setClientEmail(String e) { this.clientEmail = e; }
        public String getClientName() { return clientName; }
        public void setClientName(String n) { this.clientName = n; }
        public BigDecimal getSubtotal() { return subtotal; }
        public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
        public BigDecimal getTaxRate() { return taxRate; }
        public void setTaxRate(BigDecimal taxRate) { this.taxRate = taxRate; }
        public BigDecimal getTaxAmount() { return taxAmount; }
        public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public String getTermsAndConditions() { return termsAndConditions; }
        public void setTermsAndConditions(String tc) { this.termsAndConditions = tc; }
        public Long getPaymentTransactionId() { return paymentTransactionId; }
        public void setPaymentTransactionId(Long id) { this.paymentTransactionId = id; }
        public LocalDateTime getPaidAt() { return paidAt; }
        public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
        public List<LineItemDto> getLineItems() { return lineItems; }
        public void setLineItems(List<LineItemDto> lineItems) { this.lineItems = lineItems; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
}
