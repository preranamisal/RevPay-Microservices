package com.revpay.invoice.repository;

import com.revpay.invoice.entity.Invoice;
import com.revpay.invoice.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Page<Invoice> findByBusinessUserId(Long businessUserId, Pageable pageable);
    Page<Invoice> findByClientUserId(Long clientUserId, Pageable pageable);
    List<Invoice> findByBusinessUserIdAndStatus(Long businessUserId, InvoiceStatus status);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.businessUserId = :uid AND i.status = 'PAID'")
    BigDecimal getTotalRevenue(@Param("uid") Long uid);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.businessUserId = :uid AND i.status = :status")
    Long countByStatus(@Param("uid") Long uid, @Param("status") InvoiceStatus status);
}
