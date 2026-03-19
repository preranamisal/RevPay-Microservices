package com.revpay.transaction.repository;

import com.revpay.transaction.entity.MoneyRequest;
import com.revpay.transaction.entity.MoneyRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MoneyRequestRepository extends JpaRepository<MoneyRequest, Long> {
    List<MoneyRequest> findByRequesterIdAndStatus(Long requesterId, MoneyRequestStatus status);
    List<MoneyRequest> findByPayerIdAndStatus(Long payerId, MoneyRequestStatus status);
    List<MoneyRequest> findByRequesterId(Long requesterId);
    List<MoneyRequest> findByPayerId(Long payerId);
}
