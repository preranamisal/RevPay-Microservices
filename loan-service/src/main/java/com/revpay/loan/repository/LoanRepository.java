package com.revpay.loan.repository;
import com.revpay.loan.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByBusinessUserId(Long userId);
}
