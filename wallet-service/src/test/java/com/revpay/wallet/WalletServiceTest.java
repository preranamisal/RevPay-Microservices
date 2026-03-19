package com.revpay.wallet;

import com.revpay.wallet.dto.WalletDtos.*;
import com.revpay.wallet.entity.*;
import com.revpay.wallet.exception.InsufficientBalanceException;
import com.revpay.wallet.repository.PaymentMethodRepository;
import com.revpay.wallet.repository.WalletRepository;
import com.revpay.wallet.service.WalletService;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class WalletServiceTest {

    @InjectMocks
    private WalletService walletService;

    @Mock private WalletRepository walletRepository;
    @Mock private PaymentMethodRepository paymentMethodRepository;

    private Wallet mockWallet;

    @Before
    public void setUp() {
        mockWallet = new Wallet();
        mockWallet.setId(1L);
        mockWallet.setUserId(1L);
        mockWallet.setBalance(new BigDecimal("1000.00"));
        mockWallet.setStatus(WalletStatus.ACTIVE);
        mockWallet.setCurrency("INR");
    }

    @Test
    public void testCreateWallet_NewUser() {
        when(walletRepository.existsByUserId(1L)).thenReturn(false);
        when(walletRepository.save(any(Wallet.class))).thenReturn(mockWallet);

        WalletDto result = walletService.createWallet(1L);

        assertNotNull(result);
        assertEquals(Long.valueOf(1), result.getUserId());
        verify(walletRepository, times(1)).save(any(Wallet.class));
    }

    @Test
    public void testCreateWallet_ExistingUserReturnsExisting() {
        when(walletRepository.existsByUserId(1L)).thenReturn(true);
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));

        WalletDto result = walletService.createWallet(1L);

        assertNotNull(result);
        verify(walletRepository, never()).save(any());
    }

    @Test
    public void testAddFunds_Success() {
        FundsRequest req = new FundsRequest();
        req.setAmount(new BigDecimal("500.00"));

        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        WalletDto result = walletService.addFunds(1L, req);

        assertNotNull(result);
        assertEquals(new BigDecimal("1500.00"), result.getBalance());
    }

    @Test
    public void testWithdrawFunds_Success() {
        FundsRequest req = new FundsRequest();
        req.setAmount(new BigDecimal("300.00"));

        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        WalletDto result = walletService.withdrawFunds(1L, req);

        assertEquals(new BigDecimal("700.00"), result.getBalance());
    }

    @Test(expected = InsufficientBalanceException.class)
    public void testWithdrawFunds_InsufficientBalance() {
        FundsRequest req = new FundsRequest();
        req.setAmount(new BigDecimal("5000.00"));

        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));

        walletService.withdrawFunds(1L, req);
    }

    @Test
    public void testDebitWallet_Success() {
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        walletService.debitWallet(1L, new BigDecimal("200.00"));

        verify(walletRepository).save(argThat(w -> w.getBalance().equals(new BigDecimal("800.00"))));
    }

    @Test(expected = InsufficientBalanceException.class)
    public void testDebitWallet_Overdraft() {
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));
        walletService.debitWallet(1L, new BigDecimal("9999.00"));
    }

    @Test
    public void testCreditWallet_Success() {
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        walletService.creditWallet(1L, new BigDecimal("250.00"));

        verify(walletRepository).save(argThat(w -> w.getBalance().equals(new BigDecimal("1250.00"))));
    }

    @Test
    public void testHasSufficientBalance_True() {
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));
        assertTrue(walletService.hasSufficientBalance(1L, new BigDecimal("500.00")));
    }

    @Test
    public void testHasSufficientBalance_False() {
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));
        assertFalse(walletService.hasSufficientBalance(1L, new BigDecimal("5000.00")));
    }

    @Test
    public void testAddPaymentMethod_CreditCard() {
        AddPaymentMethodRequest req = new AddPaymentMethodRequest();
        req.setType(PaymentMethodType.CREDIT_CARD);
        req.setCardHolderName("John Doe");
        req.setCardNumber("4111111111111111");
        req.setExpiryMonth("12");
        req.setExpiryYear("2027");

        PaymentMethod pm = new PaymentMethod();
        pm.setId(1L);
        pm.setUserId(1L);
        pm.setType(PaymentMethodType.CREDIT_CARD);
        pm.setLast4Digits("1111");
        pm.setMaskedNumber("**** **** **** 1111");
        pm.setCardBrand("VISA");
        pm.setDefault(true);
        pm.setVerified(true);

        when(paymentMethodRepository.findByUserId(1L)).thenReturn(List.of());
        when(paymentMethodRepository.save(any(PaymentMethod.class))).thenReturn(pm);

        PaymentMethodDto result = walletService.addPaymentMethod(1L, req);

        assertNotNull(result);
        assertEquals("1111", result.getLast4Digits());
        assertEquals("VISA", result.getCardBrand());
        assertTrue(result.isDefault());
    }

    @Test
    public void testGetWalletByUserId_Found() {
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));
        WalletDto result = walletService.getWalletByUserId(1L);
        assertNotNull(result);
        assertEquals(new BigDecimal("1000.00"), result.getBalance());
    }

    @Test
    public void testAddFunds_FrozenWalletThrows() {
        mockWallet.setStatus(WalletStatus.FROZEN);
        FundsRequest req = new FundsRequest();
        req.setAmount(new BigDecimal("100.00"));
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(mockWallet));

        try {
            walletService.addFunds(1L, req);
            fail("Expected IllegalStateException");
        } catch (IllegalStateException e) {
            assertTrue(e.getMessage().contains("not active"));
        }
    }
}
