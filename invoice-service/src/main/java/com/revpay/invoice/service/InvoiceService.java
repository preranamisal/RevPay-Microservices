package com.revpay.invoice.service;

import com.revpay.invoice.dto.InvoiceDtos.*;
import com.revpay.invoice.entity.*;
import com.revpay.invoice.exception.ResourceNotFoundException;
import com.revpay.invoice.repository.InvoiceRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class InvoiceService {

    private static final Logger logger = LogManager.getLogger(InvoiceService.class);

    @Autowired private InvoiceRepository invoiceRepository;

    public InvoiceDto createInvoice(CreateInvoiceRequest req) {
        logger.info("Creating invoice for businessUserId={}", req.getBusinessUserId());

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
        invoice.setBusinessUserId(req.getBusinessUserId());
        invoice.setClientUserId(req.getClientUserId());
        invoice.setClientEmail(req.getClientEmail());
        invoice.setClientName(req.getClientName());
        invoice.setTaxRate(req.getTaxRate() != null ? req.getTaxRate() : BigDecimal.ZERO);
        invoice.setDueDate(req.getDueDate());
        invoice.setNotes(req.getNotes());
        invoice.setTermsAndConditions(req.getTermsAndConditions());
        invoice.setStatus(InvoiceStatus.DRAFT);

        // Calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        List<InvoiceLineItem> lineItems = req.getLineItems().stream().map(li -> {
            InvoiceLineItem item = new InvoiceLineItem();
            item.setInvoice(invoice);
            item.setDescription(li.getDescription());
            item.setQuantity(li.getQuantity());
            item.setUnitPrice(li.getUnitPrice());
            item.setTotal(li.getUnitPrice().multiply(BigDecimal.valueOf(li.getQuantity())));
            return item;
        }).collect(Collectors.toList());

        for (InvoiceLineItem li : lineItems) subtotal = subtotal.add(li.getTotal());

        invoice.setSubtotal(subtotal);
        BigDecimal taxAmount = subtotal.multiply(invoice.getTaxRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(subtotal.add(taxAmount));
        invoice.setLineItems(lineItems);

        return toDto(invoiceRepository.save(invoice));
    }

    public InvoiceDto sendInvoice(Long id, Long businessUserId) {
        Invoice invoice = getByIdAndOwner(id, businessUserId);
        invoice.setStatus(InvoiceStatus.SENT);
        return toDto(invoiceRepository.save(invoice));
    }

    public InvoiceDto payInvoice(Long id, Long clientUserId) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));
        if (!invoice.getClientUserId().equals(clientUserId))
            throw new IllegalStateException("Unauthorized to pay this invoice");
        if (invoice.getStatus() == InvoiceStatus.PAID)
            throw new IllegalStateException("Invoice already paid");

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        logger.info("Invoice {} paid by userId={}", invoice.getInvoiceNumber(), clientUserId);
        return toDto(invoiceRepository.save(invoice));
    }

    public InvoiceDto cancelInvoice(Long id, Long businessUserId) {
        Invoice invoice = getByIdAndOwner(id, businessUserId);
        invoice.setStatus(InvoiceStatus.CANCELLED);
        return toDto(invoiceRepository.save(invoice));
    }

    public InvoiceDto getInvoiceById(Long id) {
        return toDto(invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id)));
    }

    public Page<InvoiceDto> getBusinessInvoices(Long businessUserId, int page, int size) {
        return invoiceRepository.findByBusinessUserId(businessUserId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toDto);
    }

    public Page<InvoiceDto> getClientInvoices(Long clientUserId, int page, int size) {
        return invoiceRepository.findByClientUserId(clientUserId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toDto);
    }

    public Map<String, Object> getBusinessAnalytics(Long businessUserId) {
        BigDecimal totalRevenue = invoiceRepository.getTotalRevenue(businessUserId);
        Long paidCount = invoiceRepository.countByStatus(businessUserId, InvoiceStatus.PAID);
        Long pendingCount = invoiceRepository.countByStatus(businessUserId, InvoiceStatus.SENT);
        Long overdueCount = invoiceRepository.countByStatus(businessUserId, InvoiceStatus.OVERDUE);

        return Map.of(
            "totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO,
            "paidInvoices", paidCount,
            "pendingInvoices", pendingCount,
            "overdueInvoices", overdueCount
        );
    }

    private Invoice getByIdAndOwner(Long id, Long businessUserId) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));
        if (!invoice.getBusinessUserId().equals(businessUserId))
            throw new IllegalStateException("Unauthorized");
        return invoice;
    }

    private InvoiceDto toDto(Invoice inv) {
        InvoiceDto dto = new InvoiceDto();
        dto.setId(inv.getId());
        dto.setInvoiceNumber(inv.getInvoiceNumber());
        dto.setBusinessUserId(inv.getBusinessUserId());
        dto.setClientUserId(inv.getClientUserId());
        dto.setClientEmail(inv.getClientEmail());
        dto.setClientName(inv.getClientName());
        dto.setSubtotal(inv.getSubtotal());
        dto.setTaxRate(inv.getTaxRate());
        dto.setTaxAmount(inv.getTaxAmount());
        dto.setTotalAmount(inv.getTotalAmount());
        dto.setStatus(inv.getStatus().name());
        dto.setDueDate(inv.getDueDate());
        dto.setNotes(inv.getNotes());
        dto.setTermsAndConditions(inv.getTermsAndConditions());
        dto.setPaymentTransactionId(inv.getPaymentTransactionId());
        dto.setPaidAt(inv.getPaidAt());
        dto.setCreatedAt(inv.getCreatedAt());
        dto.setUpdatedAt(inv.getUpdatedAt());
        dto.setLineItems(inv.getLineItems().stream().map(li -> {
            LineItemDto ld = new LineItemDto();
            ld.setId(li.getId());
            ld.setDescription(li.getDescription());
            ld.setQuantity(li.getQuantity());
            ld.setUnitPrice(li.getUnitPrice());
            ld.setTotal(li.getTotal());
            return ld;
        }).collect(Collectors.toList()));
        return dto;
    }
}
