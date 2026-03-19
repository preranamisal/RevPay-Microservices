package com.revpay.transaction.repository;

import com.revpay.transaction.entity.Transaction;
import com.revpay.transaction.entity.TransactionStatus;
import com.revpay.transaction.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Page<Transaction> findBySenderIdOrReceiverId(Long senderId, Long receiverId, Pageable pageable);

    List<Transaction> findBySenderIdOrReceiverId(Long senderId, Long receiverId);

    Page<Transaction> findBySenderIdOrReceiverIdAndStatus(
            Long senderId, Long receiverId, TransactionStatus status, Pageable pageable);

    Page<Transaction> findBySenderIdOrReceiverIdAndType(
            Long senderId, Long receiverId, TransactionType type, Pageable pageable);

    Optional<Transaction> findByReferenceId(String referenceId);

    @Query("SELECT t FROM Transaction t WHERE (t.senderId = :userId OR t.receiverId = :userId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:type IS NULL OR t.type = :type) " +
           "AND (:startDate IS NULL OR t.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR t.createdAt <= :endDate) " +
           "AND (:minAmount IS NULL OR t.amount >= :minAmount) " +
           "AND (:maxAmount IS NULL OR t.amount <= :maxAmount)")
    Page<Transaction> findWithFilters(
            @Param("userId") Long userId,
            @Param("status") TransactionStatus status,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("minAmount") BigDecimal minAmount,
            @Param("maxAmount") BigDecimal maxAmount,
            Pageable pageable);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.receiverId = :userId AND t.status = 'COMPLETED' AND t.createdAt >= :since")
    BigDecimal getTotalReceived(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.senderId = :userId AND t.status = 'COMPLETED' AND t.createdAt >= :since")
    BigDecimal getTotalSent(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE (t.senderId = :userId OR t.receiverId = :userId) AND t.status = 'COMPLETED'")
    Long countByUser(@Param("userId") Long userId);
}
