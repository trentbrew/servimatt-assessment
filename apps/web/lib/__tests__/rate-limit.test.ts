import { rateLimit, getClientIp } from '../rate-limit';

describe('rateLimit', () => {
  // Helper to generate unique IPs for each test
  const getTestIp = (testName: string) => `test-ip-${testName}-${Date.now()}`;

  describe('basic rate limiting', () => {
    it('allows requests under the limit', () => {
      const ip = getTestIp('under-limit');
      const config = { limit: 5, window: 60000 };

      // First request should succeed
      const result1 = rateLimit(ip, config);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(4);

      // Second request should succeed
      const result2 = rateLimit(ip, config);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('blocks requests at the limit', () => {
      const ip = getTestIp('at-limit');
      const config = { limit: 3, window: 60000 };

      // Make exactly 3 requests (the limit)
      rateLimit(ip, config); // 1
      rateLimit(ip, config); // 2
      const result3 = rateLimit(ip, config); // 3
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);

      // 4th request should fail
      const result4 = rateLimit(ip, config);
      expect(result4.success).toBe(false);
      expect(result4.remaining).toBe(0);
    });

    it('blocks all requests after limit exceeded', () => {
      const ip = getTestIp('exceeded');
      const config = { limit: 2, window: 60000 };

      // Use up the limit
      rateLimit(ip, config);
      rateLimit(ip, config);

      // Multiple subsequent requests should all fail
      const blocked1 = rateLimit(ip, config);
      const blocked2 = rateLimit(ip, config);
      const blocked3 = rateLimit(ip, config);

      expect(blocked1.success).toBe(false);
      expect(blocked2.success).toBe(false);
      expect(blocked3.success).toBe(false);
    });
  });

  describe('time window behavior', () => {
    it('resets count after time window expires', async () => {
      const ip = getTestIp('reset');
      const config = { limit: 2, window: 100 }; // 100ms window

      // Use up the limit
      rateLimit(ip, config);
      rateLimit(ip, config);

      // Should be blocked now
      const blocked = rateLimit(ip, config);
      expect(blocked.success).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      const afterReset = rateLimit(ip, config);
      expect(afterReset.success).toBe(true);
      expect(afterReset.remaining).toBe(1);
    });

    it('provides correct resetAt timestamp', () => {
      const ip = getTestIp('timestamp');
      const config = { limit: 5, window: 60000 }; // 1 minute

      const now = Date.now();
      const result = rateLimit(ip, config);

      // resetAt should be approximately now + window
      const expectedResetAt = now + config.window;
      const timeDiff = Math.abs(result.resetAt - expectedResetAt);

      // Allow 100ms tolerance for execution time
      expect(timeDiff).toBeLessThan(100);
    });
  });

  describe('multiple IPs', () => {
    it('tracks different IPs independently', () => {
      const config = { limit: 2, window: 60000 };
      const ip1 = getTestIp('multi-1');
      const ip2 = getTestIp('multi-2');

      // IP1 makes requests
      rateLimit(ip1, config);
      rateLimit(ip1, config);

      // IP1 should be at limit
      const ip1Blocked = rateLimit(ip1, config);
      expect(ip1Blocked.success).toBe(false);

      // IP2 should still be able to make requests
      const ip2Result = rateLimit(ip2, config);
      expect(ip2Result.success).toBe(true);
      expect(ip2Result.remaining).toBe(1);
    });

    it('does not affect other IPs when one is blocked', () => {
      const config = { limit: 1, window: 60000 };
      const ip1 = getTestIp('block-1');
      const ip2 = getTestIp('block-2');
      const ip3 = getTestIp('block-3');

      // Block IP1
      rateLimit(ip1, config);
      const ip1Blocked = rateLimit(ip1, config);
      expect(ip1Blocked.success).toBe(false);

      // IP2 and IP3 should be unaffected
      const ip2Result = rateLimit(ip2, config);
      const ip3Result = rateLimit(ip3, config);

      expect(ip2Result.success).toBe(true);
      expect(ip3Result.success).toBe(true);
    });
  });

  describe('remaining count accuracy', () => {
    it('decrements remaining count correctly', () => {
      const ip = getTestIp('decrement');
      const config = { limit: 5, window: 60000 };

      expect(rateLimit(ip, config).remaining).toBe(4);
      expect(rateLimit(ip, config).remaining).toBe(3);
      expect(rateLimit(ip, config).remaining).toBe(2);
      expect(rateLimit(ip, config).remaining).toBe(1);
      expect(rateLimit(ip, config).remaining).toBe(0);
    });

    it('returns 0 remaining when blocked', () => {
      const ip = getTestIp('zero-remaining');
      const config = { limit: 1, window: 60000 };

      rateLimit(ip, config); // Use the one allowed request

      const blocked = rateLimit(ip, config);
      expect(blocked.remaining).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles limit of 1 correctly', () => {
      const ip = getTestIp('limit-one');
      const config = { limit: 1, window: 60000 };

      const first = rateLimit(ip, config);
      expect(first.success).toBe(true);
      expect(first.remaining).toBe(0);

      const second = rateLimit(ip, config);
      expect(second.success).toBe(false);
    });

    it('handles very short time windows', async () => {
      const ip = getTestIp('short-window');
      const config = { limit: 1, window: 50 }; // 50ms

      rateLimit(ip, config);
      const blocked = rateLimit(ip, config);
      expect(blocked.success).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 60));

      const allowed = rateLimit(ip, config);
      expect(allowed.success).toBe(true);
    });

    it('handles concurrent requests from same IP', () => {
      const ip = getTestIp('concurrent');
      const config = { limit: 5, window: 60000 };

      // Simulate near-concurrent requests
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(rateLimit(ip, config));
      }

      // First 5 should succeed, next 5 should fail
      expect(results.slice(0, 5).every((r) => r.success)).toBe(true);
      expect(results.slice(5).every((r) => !r.success)).toBe(true);
    });
  });

  describe('default configuration', () => {
    it('uses default config when not provided', () => {
      const ip = getTestIp('default');

      // Default is 20 requests per hour
      const result = rateLimit(ip);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(19);
    });
  });
});

describe('getClientIp', () => {
  it('extracts IP from x-real-ip header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '192.168.1.1' },
    });
    expect(getClientIp(request)).toBe('192.168.1.1');
  });

  it('extracts IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.2, 10.0.0.1' },
    });
    expect(getClientIp(request)).toBe('192.168.1.2');
  });

  it('extracts IP from cf-connecting-ip header (Cloudflare)', () => {
    const request = new Request('http://localhost', {
      headers: { 'cf-connecting-ip': '192.168.1.3' },
    });
    expect(getClientIp(request)).toBe('192.168.1.3');
  });

  it('returns "unknown" when no IP headers present', () => {
    const request = new Request('http://localhost');
    expect(getClientIp(request)).toBe('unknown');
  });

  it('prioritizes x-real-ip over x-forwarded-for', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-real-ip': '192.168.1.4',
        'x-forwarded-for': '10.0.0.2',
      },
    });
    expect(getClientIp(request)).toBe('192.168.1.4');
  });

  it('handles empty x-forwarded-for correctly', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '' },
    });
    expect(getClientIp(request)).toBe('unknown');
  });
});
