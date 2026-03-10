package com.almaengi.be.domain.user.repository;

import com.almaengi.be.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

}
