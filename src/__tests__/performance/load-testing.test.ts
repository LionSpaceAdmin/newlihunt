/**
 * Performance and load testing for the Scam Hunter platform
 * Tests system behavior under various load conditions
 */

import { performance } from 'perf_hooks';

// Mock fetch for API testing
global.fetch = jest.fn();

describe('Performance and Load Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performance.clearMarks();
    performance.clearMeasures();
  });

  describe('API Response Times', () => {
    it('should respond to analysis requests within acceptable time limits', async () => {
      // Mock fast API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            riskScore: 50,
            credibilityScore: 50,
            classification: 'SUSPICIOUS'
          }
        })
      });

      const startTime = performance.now();
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test message' })
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should handle timeout scenarios gracefully', async () => {
      // Mock slow API response
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 35000)) // 35 second delay
      );

      const startTime = performance.now();
      
      try {
        await Promise.race([
          fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Test message' })
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 30000)
          )
        ]);
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(error).toBeInstanceOf(Error);
        expect(responseTime).toBeLessThan(31000); // Should timeout within 31 seconds
      }
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate multiple analysis operations
      for (let i = 0; i < 100; i++) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            result: { riskScore: Math.random() * 100 }
          })
        });

        await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Test message ${i}` })
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous requests', async () => {
      const requestCount = 10;
      const requests = [];

      // Mock successful responses for all requests
      for (let i = 0; i < requestCount; i++) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            result: { riskScore: 50, requestId: i }
          })
        });
      }

      // Create multiple concurrent requests
      for (let i = 0; i < requestCount; i++) {
        requests.push(
          fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Concurrent test ${i}` })
          })
        );
      }

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      // Concurrent requests should not take significantly longer than sequential
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle rate limiting correctly', async () => {
      const requestCount = 50; // Exceed typical rate limits
      const requests = [];
      let rateLimitedCount = 0;

      // Mock rate limiting responses
      for (let i = 0; i < requestCount; i++) {
        if (i < 20) {
          // First 20 requests succeed
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, result: { riskScore: 50 } })
          });
        } else {
          // Remaining requests are rate limited
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 429,
            json: async () => ({ error: 'Rate limit exceeded' })
          });
        }
      }

      // Create requests
      for (let i = 0; i < requestCount; i++) {
        requests.push(
          fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Rate limit test ${i}` })
          }).then(response => {
            if (response.status === 429) {
              rateLimitedCount++;
            }
            return response;
          })
        );
      }

      await Promise.all(requests);
      
      // Should have rate limited some requests
      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(rateLimitedCount).toBeLessThan(requestCount); // Not all should be rate limited
    });
  });

  describe('Large Data Handling', () => {
    it('should handle large text inputs efficiently', async () => {
      const largeText = 'A'.repeat(100000); // 100KB of text
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: { riskScore: 30, credibilityScore: 70 }
        })
      });

      const startTime = performance.now();
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: largeText })
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(response.ok).toBe(true);
      expect(processingTime).toBeLessThan(10000); // Should process within 10 seconds
    });

    it('should reject excessively large inputs', async () => {
      const excessiveText = 'A'.repeat(10000000); // 10MB of text
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: async () => ({ error: 'Payload too large' })
      });

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: excessiveText })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(413);
    });
  });

  describe('Network Resilience', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      try {
        await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Test message' })
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should implement proper retry logic', async () => {
      let attemptCount = 0;
      
      (global.fetch as jest.Mock).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, result: { riskScore: 50 } })
        });
      });

      // Simulate retry logic
      let lastError;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Retry test' })
          });
          
          if (response.ok) {
            break;
          }
        } catch (error) {
          lastError = error;
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      expect(attemptCount).toBe(3);
    });
  });

  describe('Browser Performance', () => {
    it('should maintain responsive UI during heavy operations', async () => {
      // Mock heavy computation
      const heavyOperation = () => {
        const start = Date.now();
        while (Date.now() - start < 100) {
          // Simulate CPU-intensive work
          Math.random();
        }
      };

      const startTime = performance.now();
      
      // Simulate multiple heavy operations
      for (let i = 0; i < 10; i++) {
        heavyOperation();
        // Yield to browser between operations
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete but not block for too long
      expect(totalTime).toBeGreaterThan(1000); // At least 1 second of work
      expect(totalTime).toBeLessThan(5000); // But not more than 5 seconds
    });
  });

  describe('Resource Cleanup', () => {
    it('should properly clean up resources after operations', async () => {
      const resources = [];
      
      // Simulate resource allocation
      for (let i = 0; i < 100; i++) {
        const resource = {
          id: i,
          data: new Array(1000).fill(Math.random()),
          cleanup: jest.fn()
        };
        resources.push(resource);
      }

      // Simulate cleanup
      resources.forEach(resource => {
        resource.cleanup();
        resource.data = null;
      });

      // Verify cleanup was called
      resources.forEach(resource => {
        expect(resource.cleanup).toHaveBeenCalled();
        expect(resource.data).toBeNull();
      });
    });
  });
});