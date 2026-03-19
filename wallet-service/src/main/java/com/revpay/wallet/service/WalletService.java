package com.revpay.wallet.service;

import com.revpay.wallet.dto.WalletDtos.*;
import com.revpay.wallet.entity.*;
import com.revpay.wallet.exception.InsufficientBalanceException;
import com.revpay.wallet.exception.ResourceNotFoundException;
import com.revpay.wallet.repository.PaymentMethodRepository;
import com.revpay.wallet.repository.WalletRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class WalletService {

    private static final Logger logger = LogManager.getLogger(WalletService.class);

    @Autowired private WalletRepository walletRepository;
    @Autowired private PaymentMethodRepository paymentMethodRepository;

    public WalletDto createWallet(Long userId) {
        if (walletRepository.existsByUserId(userId)) {
            return getWalletByUserId(userId);
        }
        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setStatus(WalletStatus.ACTIVE);
        Wallet saved = walletRepository.save(wallet);
        logger.info("Wallet created for userId={}", userId);
        return toDto(saved);
    }

    public WalletDto getWalletByUserId(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for userId: " + userId));
        return toDto(wallet);
    }

    public WalletDto addFunds(Long userId, FundsRequest req) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for userId: " + userId));
        if (wallet.getStatus() != WalletStatus.ACTIVE)
            throw new IllegalStateException("Wallet is not active");
        wallet.setBalance(wallet.getBalance().add(req.getAmount()));
        logger.info("Added {} to wallet for userId={}", req.getAmount(), userId);
        return toDto(walletRepository.save(wallet));
    }

    public WalletDto withdrawFunds(Long userId, FundsRequest req) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for userId: " + userId));
        if (wallet.getStatus() != WalletStatus.ACTIVE)
            throw new IllegalStateException("Wallet is not active");
        if (wallet.getBalance().compareTo(req.getAmount()) < 0)
            throw new InsufficientBalanceException("Insufficient wallet balance");
        wallet.setBalance(wallet.getBalance().subtract(req.getAmount()));
        logger.info("Withdrew {} from wallet for userId={}", req.getAmount(), userId);
        return toDto(walletRepository.save(wallet));
    }

    public void debitWallet(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for userId: " + userId));
        if (wallet.getBalance().compareTo(amount) < 0)
            throw new InsufficientBalanceException("Insufficient balance");
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);
    }

    public void creditWallet(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for userId: " + userId));
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
    }

    public boolean hasSufficientBalance(Long userId, BigDecimal amount) {
        return walletRepository.findByUserId(userId)
                .map(w -> w.getBalance().compareTo(amount) >= 0)
                .orElse(false);
    }

    // ── Payment Methods ───────────────────────────────────────────────────────

    public PaymentMethodDto addPaymentMethod(Long userId, AddPaymentMethodRequest req) {
        PaymentMethod pm = new PaymentMethod();
        pm.setUserId(userId);
        pm.setType(req.getType());

        if (req.getType() == PaymentMethodType.CREDIT_CARD || req.getType() == PaymentMethodType.DEBIT_CARD) {
            pm.setCardHolderName(req.getCardHolderName());
            String number = req.getCardNumber().replaceAll("\\s", "");
            pm.setLast4Digits(number.substring(number.length() - 4));
            pm.setMaskedNumber("**** **** **** " + pm.getLast4Digits());
            pm.setExpiryMonth(req.getExpiryMonth());
            pm.setExpiryYear(req.getExpiryYear());
            pm.setCardBrand(detectCardBrand(number));
            pm.setVerified(true);
        } else if (req.getType() == PaymentMethodType.BANK_ACCOUNT) {
            pm.setBankName(req.getBankName());
            pm.setAccountHolderName(req.getAccountHolderName());
            String acc = req.getAccountNumber();
            pm.setMaskedAccountNumber("XXXX" + acc.substring(Math.max(0, acc.length() - 4)));
            pm.setIfscCode(req.getIfscCode());
            pm.setVerified(true);
        }

        // Set as default if first payment method
        List<PaymentMethod> existing = paymentMethodRepository.findByUserId(userId);
        if (existing.isEmpty()) pm.setDefault(true);

        return toPaymentMethodDto(paymentMethodRepository.save(pm));
    }

    public List<PaymentMethodDto> getPaymentMethods(Long userId) {
        return paymentMethodRepository.findByUserId(userId).stream()
                .map(this::toPaymentMethodDto)
                .collect(Collectors.toList());
    }

    public void deletePaymentMethod(Long id, Long userId) {
        paymentMethodRepository.deleteByIdAndUserId(id, userId);
    }

    public PaymentMethodDto setDefaultPaymentMethod(Long id, Long userId) {
        // Unset all defaults
        paymentMethodRepository.findByUserId(userId).forEach(pm -> {
            pm.setDefault(false);
            paymentMethodRepository.save(pm);
        });
        PaymentMethod pm = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment method not found"));
        pm.setDefault(true);
        return toPaymentMethodDto(paymentMethodRepository.save(pm));
    }

    private String detectCardBrand(String number) {
        if (number.startsWith("4")) return "VISA";
        if (number.startsWith("5")) return "MASTERCARD";
        if (number.startsWith("37") || number.startsWith("34")) return "AMEX";
        if (number.startsWith("6")) return "RUPAY";
        return "UNKNOWN";
    }

    private WalletDto toDto(Wallet w) {
        WalletDto dto = new WalletDto();
        dto.setId(w.getId());
        dto.setUserId(w.getUserId());
        dto.setBalance(w.getBalance());
        dto.setLockedBalance(w.getLockedBalance());
        dto.setCurrency(w.getCurrency());
        dto.setStatus(w.getStatus().name());
        dto.setDailyLimit(w.getDailyLimit());
        dto.setMonthlyLimit(w.getMonthlyLimit());
        dto.setCreatedAt(w.getCreatedAt());
        return dto;
    }

    private PaymentMethodDto toPaymentMethodDto(PaymentMethod pm) {
        PaymentMethodDto dto = new PaymentMethodDto();
        dto.setId(pm.getId());
        dto.setUserId(pm.getUserId());
        dto.setType(pm.getType().name());
        dto.setMaskedNumber(pm.getMaskedNumber());
        dto.setLast4Digits(pm.getLast4Digits());
        dto.setCardHolderName(pm.getCardHolderName());
        dto.setCardBrand(pm.getCardBrand());
        dto.setExpiryMonth(pm.getExpiryMonth());
        dto.setExpiryYear(pm.getExpiryYear());
        dto.setBankName(pm.getBankName());
        dto.setAccountHolderName(pm.getAccountHolderName());
        dto.setMaskedAccountNumber(pm.getMaskedAccountNumber());
        dto.setIfscCode(pm.getIfscCode());
        dto.setDefault(pm.isDefault());
        dto.setVerified(pm.isVerified());
        dto.setCreatedAt(pm.getCreatedAt());
        return dto;
    }
}
