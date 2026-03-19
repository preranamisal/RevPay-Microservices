package com.revpay.invoice.controller;

import com.revpay.invoice.dto.InvoiceDtos.*;
import com.revpay.invoice.service.InvoiceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    @Autowired private InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<InvoiceDto> createInvoice(@Valid @RequestBody CreateInvoiceRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.createInvoice(req));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<InvoiceDto> sendInvoice(@PathVariable Long id, @RequestParam Long businessUserId) {
        return ResponseEntity.ok(invoiceService.sendInvoice(id, businessUserId));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<InvoiceDto> payInvoice(@PathVariable Long id, @RequestParam Long clientUserId) {
        return ResponseEntity.ok(invoiceService.payInvoice(id, clientUserId));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<InvoiceDto> cancelInvoice(@PathVariable Long id, @RequestParam Long businessUserId) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(id, businessUserId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDto> getInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @GetMapping("/business/{businessUserId}")
    public ResponseEntity<Page<InvoiceDto>> getBusinessInvoices(
            @PathVariable Long businessUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(invoiceService.getBusinessInvoices(businessUserId, page, size));
    }

    @GetMapping("/client/{clientUserId}")
    public ResponseEntity<Page<InvoiceDto>> getClientInvoices(
            @PathVariable Long clientUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(invoiceService.getClientInvoices(clientUserId, page, size));
    }

    @GetMapping("/business/{businessUserId}/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(@PathVariable Long businessUserId) {
        return ResponseEntity.ok(invoiceService.getBusinessAnalytics(businessUserId));
    }
}
