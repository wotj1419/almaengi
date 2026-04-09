package com.almaengi.be;

import org.redisson.api.RedissonClient;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class BeApplicationTests {

	@MockitoBean
	private RedissonClient redissonClient;

	@Test
	void contextLoads() {
	}

}
