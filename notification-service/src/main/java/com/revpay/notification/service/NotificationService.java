package com.revpay.notification.service;

import com.revpay.notification.dto.NotificationDtos.*;
import com.revpay.notification.entity.Notification;
import com.revpay.notification.entity.NotificationType;
import com.revpay.notification.repository.NotificationRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class NotificationService {

    private static final Logger logger = LogManager.getLogger(NotificationService.class);

    @Autowired private NotificationRepository notificationRepository;

    public NotificationDto createNotification(CreateNotificationRequest req) {
        Notification n = new Notification();
        n.setUserId(req.getUserId());
        n.setTitle(req.getTitle());
        n.setMessage(req.getMessage());
        n.setType(NotificationType.valueOf(req.getType()));
        n.setReferenceId(req.getReferenceId());
        n.setReferenceType(req.getReferenceType());
        logger.info("Creating notification for userId={} type={}", req.getUserId(), req.getType());
        return toDto(notificationRepository.save(n));
    }

    public Page<NotificationDto> getUserNotifications(Long userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size)).map(this::toDto);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public NotificationDto markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setRead(true);
        n.setReadAt(LocalDateTime.now());
        return toDto(notificationRepository.save(n));
    }

    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    // Convenience builders called from other services
    public void sendTransactionNotification(Long userId, String title, String message, String refId) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(NotificationType.TRANSACTION);
        n.setReferenceId(refId);
        n.setReferenceType("TRANSACTION");
        notificationRepository.save(n);
    }

    public void sendLowBalanceAlert(Long userId, String balance) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitle("Low Balance Alert");
        n.setMessage("Your wallet balance is ₹" + balance + ". Please add funds to continue transacting.");
        n.setType(NotificationType.LOW_BALANCE);
        notificationRepository.save(n);
    }

    private NotificationDto toDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setId(n.getId());
        dto.setUserId(n.getUserId());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType() != null ? n.getType().name() : null);
        dto.setRead(n.isRead());
        dto.setReferenceId(n.getReferenceId());
        dto.setReferenceType(n.getReferenceType());
        dto.setCreatedAt(n.getCreatedAt());
        dto.setReadAt(n.getReadAt());
        return dto;
    }
}
