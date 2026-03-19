package com.revpay.transaction;

import com.revpay.transaction.client.WalletClient;
import com.revpay.transaction.dto.TransactionDtos.*;
import com.revpay.transaction.entity.*;
import com.revpay.transaction.exception.TransactionException;
import com.revpay.transaction.repository.MoneyRequestRepository;
import com.revpay.transaction.repository.TransactionRepository;
import com.revpay.transaction.service.TransactionService;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class TransactionServiceTest {

    @InjectMocks
    private TransactionService transactionService;

    @Mock private TransactionRepository transactionRepository;
    @Mock private MoneyRequestRepository moneyRequestRepository;
    @Mock private WalletClient walletClient;

    private Transaction mockTransaction;
    private MoneyRequest mockMoneyRequest;

    @Before
    public void setUp() {
        mockTransaction = new Transaction();
        mockTransaction.setId(1L);
        mockTransaction.setReferenceId("TXN123456");
        mockTransaction.setSenderId(1L);
        mockTransaction.setReceiverId(2L);
        mockTransaction.setAmount(new BigDecimal("500.00"));
        mockTransaction.setType(TransactionType.SEND_MONEY);
        mockTransaction.setStatus(TransactionStatus.COMPLETED);
        mockTransaction.setCreatedAt(LocalDateTime.now());

        mockMoneyRequest = new MoneyRequest();
        mockMoneyRequest.setId(1L);
        mockMoneyRequest.setRequesterId(2L);
        mockMoneyRequest.setPayerId(1L);
        mockMoneyRequest.setAmount(new BigDecimal("200.00"));
        mockMoneyRequest.setDescription("Lunch split");
        mockMoneyRequest.setStatus(MoneyRequestStatus.PENDING);
    }

    @Test
    public void testSendMoney_Success() {
        SendMoneyRequest req = new SendMoneyRequest();
        req.setSenderId(1L);
        req.setReceiverId(2L);
        req.setAmount(new BigDecimal("500.00"));
        req.setDescription("Test payment");

        when(walletClient.checkBalance(eq(1L), any(BigDecimal.class)))
                .thenReturn(ResponseEntity.ok(Map.of("sufficient", true)));
        when(walletClient.debitWallet(any())).thenReturn(ResponseEntity.ok(Map.of("message", "ok")));
        when(walletClient.creditWallet(any())).thenReturn(ResponseEntity.ok(Map.of("message", "ok")));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(mockTransaction);

        TransactionDto result = transactionService.sendMoney(req);

        assertNotNull(result);
        assertEquals("TXN123456", result.getReferenceId());
        verify(walletClient, times(1)).debitWallet(any());
        verify(walletClient, times(1)).creditWallet(any());
    }

    @Test(expected = TransactionException.class)
    public void testSendMoney_InsufficientBalance() {
        SendMoneyRequest req = new SendMoneyRequest();
        req.setSenderId(1L);
        req.setReceiverId(2L);
        req.setAmount(new BigDecimal("10000.00"));

        when(walletClient.checkBalance(eq(1L), any(BigDecimal.class)))
                .thenReturn(ResponseEntity.ok(Map.of("sufficient", false)));

        transactionService.sendMoney(req);
    }

    @Test
    public void testCreateMoneyRequest_Success() {
        RequestMoneyRequest req = new RequestMoneyRequest();
        req.setRequesterId(2L);
        req.setPayerId(1L);
        req.setAmount(new BigDecimal("200.00"));
        req.setDescription("Lunch split");

        when(moneyRequestRepository.save(any(MoneyRequest.class))).thenReturn(mockMoneyRequest);

        MoneyRequestDto result = transactionService.createMoneyRequest(req);

        assertNotNull(result);
        assertEquals(new BigDecimal("200.00"), result.getAmount());
        assertEquals("PENDING", result.getStatus());
        verify(moneyRequestRepository, times(1)).save(any(MoneyRequest.class));
    }

    @Test
    public void testAcceptMoneyRequest_Success() {
        when(moneyRequestRepository.findById(1L)).thenReturn(Optional.of(mockMoneyRequest));
        when(walletClient.checkBalance(eq(1L), any(BigDecimal.class)))
                .thenReturn(ResponseEntity.ok(Map.of("sufficient", true)));
        when(walletClient.debitWallet(any())).thenReturn(ResponseEntity.ok(Map.of("message", "ok")));
        when(walletClient.creditWallet(any())).thenReturn(ResponseEntity.ok(Map.of("message", "ok")));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(mockTransaction);
        when(moneyRequestRepository.save(any(MoneyRequest.class))).thenReturn(mockMoneyRequest);

        TransactionDto result = transactionService.acceptMoneyRequest(1L, 1L);

        assertNotNull(result);
        verify(moneyRequestRepository).save(argThat(mr -> mr.getStatus() == MoneyRequestStatus.ACCEPTED));
    }

    @Test(expected = TransactionException.class)
    public void testAcceptMoneyRequest_WrongPayer() {
        when(moneyRequestRepository.findById(1L)).thenReturn(Optional.of(mockMoneyRequest));
        // payerId 99L is not the actual payer (1L)
        transactionService.acceptMoneyRequest(1L, 99L);
    }

    @Test
    public void testRejectMoneyRequest_Success() {
        when(moneyRequestRepository.findById(1L)).thenReturn(Optional.of(mockMoneyRequest));
        mockMoneyRequest.setStatus(MoneyRequestStatus.REJECTED);
        when(moneyRequestRepository.save(any(MoneyRequest.class))).thenReturn(mockMoneyRequest);

        MoneyRequestDto result = transactionService.rejectMoneyRequest(1L, 1L);

        assertNotNull(result);
        assertEquals("REJECTED", result.getStatus());
    }

    @Test
    public void testGetTransactionById_Found() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(mockTransaction));
        TransactionDto result = transactionService.getTransactionById(1L);
        assertNotNull(result);
        assertEquals(Long.valueOf(1), result.getSenderId());
    }

    @Test
    public void testGetSummary_ReturnsCorrectData() {
        when(transactionRepository.getTotalSent(eq(1L), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("1500.00"));
        when(transactionRepository.getTotalReceived(eq(1L), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("2500.00"));
        when(transactionRepository.countByUser(1L)).thenReturn(15L);

        TransactionSummaryDto summary = transactionService.getSummary(1L);

        assertEquals(new BigDecimal("1500.00"), summary.getTotalSent());
        assertEquals(new BigDecimal("2500.00"), summary.getTotalReceived());
        assertEquals(Long.valueOf(15), summary.getTotalTransactions());
        assertEquals(new BigDecimal("1000.00"), summary.getNetBalance());
    }

    @Test
    public void testGetRecentTransactions_ReturnsList() {
        when(transactionRepository.findBySenderIdOrReceiverId(eq(1L), eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(mockTransaction)));

        List<TransactionDto> result = transactionService.getRecentTransactions(1L, 10);

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
    }

    @Test
    public void testGetPendingMoneyRequests_ReturnsBothSentAndReceived() {
        MoneyRequest sentRequest = new MoneyRequest();
        sentRequest.setId(2L);
        sentRequest.setRequesterId(1L);
        sentRequest.setPayerId(3L);
        sentRequest.setAmount(new BigDecimal("100.00"));
        sentRequest.setStatus(MoneyRequestStatus.PENDING);

        when(moneyRequestRepository.findByPayerIdAndStatus(1L, MoneyRequestStatus.PENDING))
                .thenReturn(List.of(mockMoneyRequest));
        when(moneyRequestRepository.findByRequesterIdAndStatus(1L, MoneyRequestStatus.PENDING))
                .thenReturn(List.of(sentRequest));

        List<MoneyRequestDto> result = transactionService.getPendingMoneyRequests(1L);

        assertEquals(2, result.size());
    }
}
