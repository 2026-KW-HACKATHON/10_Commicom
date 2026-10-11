package com.commicom.itda.domain.feedback.repository;

import com.commicom.itda.domain.feedback.entity.Feedback;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    Slice<Feedback> findAllByOrderByIdDesc(Pageable pageable);

    @Query("select coalesce(avg(f.rating), 0) from Feedback f")
    double averageRating();
}
