package com.revpay.transaction.service;

import com.revpay.transaction.client.WalletClient;
import com.revpay.transaction.dto.TransactionDtos.*;
import com.revpay.transaction.entity.*;
import com.revpay.transaction.exception.ResourceNotFoundException;
import com.revpay.transaction.exception.TransactionException;
import com.revpay.transaction.repository.MoneyRequestRepository;
import com.revpay.transaction.repository.TransactionRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TransactionService {

    private static final Logger logger = LogManager.getLogger(TransactionService.class);

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private MoneyRequestRepository moneyRequestRepository;
    @Autowired private WalletClient walletClient;

    public TransactionDto sendMoney(SendMoneyRequest req) {
        logger.info("Send money: {} -> {}, amount={}", req.getSenderId(), req.getReceiverId(), req.getAmount());

        // Check balance
        ResponseEntity<Map<String, Boolean>> balanceCheck =
                walletClient.checkBalance(req.getSenderId(), req.getAmount());
        if (balanceCheck.getBody() == null || !balanceCheck.getBody().getOrDefault("sufficient", false)) {
            throw new TransactionException("Insufficient wallet balance");
        }

        Transaction txn = new Transaction();
        txn.setReferenceId("TXN" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        txn.setSenderId(req.getSenderId());
        txn.setReceiverId(req.getReceiverId());
        txn.setAmount(req.getAmount());
        txn.setFee(BigDecimal.ZERO);
        txn.setType(TransactionType.SEND_MONEY);
        txn.setStatus(TransactionStatus.PROCESSING);
        txn.setDescription(req.getDescription());

        Transaction saved = transactionRepository.save(txn);

        try {
            // Debit sender
            Map<String, Object> debitReq = new HashMap<>();
            debitReq.put("userId", req.getSenderId());
            debitReq.put("amount", req.getAmount());
            walletClient.debitWallet(debitReq);

            // Credit receiver
            Map<String, Object> creditReq = new HashMap<>();
            creditReq.put("userId", req.getReceiverId());
            creditReq.put("amount", req.getAmount());
            walletClient.creditWallet(creditReq);

            saved.setStatus(TransactionStatus.COMPLETED);
            saved.setCompletedAt(LocalDateTime.now());
            logger.info("Transaction completed: ref={}", saved.getReferenceId());
        } catch (Exception e) {
            saved.setStatus(TransactionStatus.FAILED);
            saved.setFailureReason(e.getMessage());
            logger.error("Transaction failed: {}", e.getMessage());
            throw new TransactionException("Transaction processing failed: " + e.getMessage());
        }

        return toDto(transactionRepository.save(saved));
    }

    public MoneyRequestDto createMoneyRequest(RequestMoneyRequest req) {
        MoneyRequest mr = new MoneyRequest();
        mr.setRequesterId(req.getRequesterId());
        mr.setPayerId(req.getPayerId());
        mr.setAmount(req.getAmount());
        mr.setDescription(req.getDescription());
        mr.setStatus(MoneyRequestStatus.PENDING);
        return toMoneyRequestDto(moneyRequestRepository.save(mr));
    }

    public TransactionDto acceptMoneyRequest(Long requestId, Long payerId) {
        MoneyRequest mr = moneyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Money request not found: " + requestId));

        if (!mr.getPayerId().equals(payerId))
            throw new TransactionException("Unauthorized to accept this request");
        if (mr.getStatus() != MoneyRequestStatus.PENDING)
            throw new TransactionException("Request is no longer pending");

        SendMoneyRequest sendReq = new SendMoneyRequest();
        sendReq.setSenderId(payerId);
        sendReq.setReceiverId(mr.getRequesterId());
        sendReq.setAmount(mr.getAmount());
        sendReq.setDescription("Payment for request: " + mr.getDescription());

        TransactionDto txnDto = sendMoney(sendReq);

        mr.setStatus(MoneyRequestStatus.ACCEPTED);
        mr.setTransactionId(txnDto.getId());
        mr.setRespondedAt(LocalDateTime.now());
        moneyRequestRepository.save(mr);

        return txnDto;
    }

    public MoneyRequestDto rejectMoneyRequest(Long requestId, Long payerId) {
        MoneyRequest mr = moneyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Money request not found: " + requestId));
        if (!mr.getPayerId().equals(payerId))
            throw new TransactionException("Unauthorized");
        mr.setStatus(MoneyRequestStatus.REJECTED);
        mr.setRespondedAt(LocalDateTime.now());
        return toMoneyRequestDto(moneyRequestRepository.save(mr));
    }

    public Page<TransactionDto> getTransactionsWithFilters(Long userId, TransactionFilterRequest filter) {
        PageRequest pageable = PageRequest.of(filter.getPage(), filter.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        TransactionStatus status = filter.getStatus() != null ?
                TransactionStatus.valueOf(filter.getStatus()) : null;
        TransactionType type = filter.getType() != null ?
                TransactionType.valueOf(filter.getType()) : null;

        return transactionRepository.findWithFilters(
                userId, status, type,
                filter.getStartDate(), filter.getEndDate(),
                filter.getMinAmount(), filter.getMaxAmount(),
                pageable).map(this::toDto);
    }

    public List<TransactionDto> getRecentTransactions(Long userId, int limit) {
        PageRequest pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return transactionRepository.findBySenderIdOrReceiverId(userId, userId, pageable)
                .getContent().stream().map(this::toDto).collect(Collectors.toList());
    }

    public TransactionDto getTransactionById(Long id) {
        return toDto(transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id)));
    }

    public List<MoneyRequestDto> getPendingMoneyRequests(Long userId) {
        List<MoneyRequest> received = moneyRequestRepository.findByPayerIdAndStatus(userId, MoneyRequestStatus.PENDING);
        List<MoneyRequest> sent = moneyRequestRepository.findByRequesterIdAndStatus(userId, MoneyRequestStatus.PENDING);
        List<MoneyRequestDto> result = new ArrayList<>();
        received.forEach(mr -> result.add(toMoneyRequestDto(mr)));
        sent.forEach(mr -> result.add(toMoneyRequestDto(mr)));
        return result;
    }

    public TransactionSummaryDto getSummary(Long userId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        BigDecimal sent = transactionRepository.getTotalSent(userId, thirtyDaysAgo);
        BigDecimal received = transactionRepository.getTotalReceived(userId, thirtyDaysAgo);
        Long count = transactionRepository.countByUser(userId);

        TransactionSummaryDto dto = new TransactionSummaryDto();
        dto.setTotalSent(sent != null ? sent : BigDecimal.ZERO);
        dto.setTotalReceived(received != null ? received : BigDecimal.ZERO);
        dto.setTotalTransactions(count);
        dto.setNetBalance(dto.getTotalReceived().subtract(dto.getTotalSent()));
        return dto;
    }

    // Internal: used by Invoice/Loan services
    public TransactionDto recordInternalTransaction(Long senderId, Long receiverId,
            BigDecimal amount, TransactionType type, String desc) {
        Transaction txn = new Transaction();
        txn.setReferenceId("INT" + System.currentTimeMillis());
        txn.setSenderId(senderId);
        txn.setReceiverId(receiverId);
        txn.setAmount(amount);
        txn.setType(type);
        txn.setStatus(TransactionStatus.COMPLETED);
        txn.setDescription(desc);
        txn.setCompletedAt(LocalDateTime.now());
        return toDto(transactionRepository.save(txn));
    }

    private TransactionDto toDto(Transaction t) {
        TransactionDto dto = new TransactionDto();
        dto.setId(t.getId());
        dto.setReferenceId(t.getReferenceId());
        dto.setSenderId(t.getSenderId());
        dto.setReceiverId(t.getReceiverId());
        dto.setAmount(t.getAmount());
        dto.setFee(t.getFee());
        dto.setCurrency(t.getCurrency());
        dto.setType(t.getType().name());
        dto.setStatus(t.getStatus().name());
        dto.setDescription(t.getDescription());
        dto.setFailureReason(t.getFailureReason());
        dto.setCreatedAt(t.getCreatedAt());
        dto.setCompletedAt(t.getCompletedAt());
        return dto;
    }

    private MoneyRequestDto toMoneyRequestDto(MoneyRequest mr) {
        MoneyRequestDto dto = new MoneyRequestDto();
        dto.setId(mr.getId());
        dto.setRequesterId(mr.getRequesterId());
        dto.setPayerId(mr.getPayerId());
        dto.setAmount(mr.getAmount());
        dto.setDescription(mr.getDescription());
        dto.setStatus(mr.getStatus().name());
        dto.setTransactionId(mr.getTransactionId());
        dto.setCreatedAt(mr.getCreatedAt());
        dto.setRespondedAt(mr.getRespondedAt());
        return dto;
    }
}
