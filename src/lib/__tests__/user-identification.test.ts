import {
  generateUserId,
  getUserId,
  setUserId,
  clearUserId,
  hashIP
} from '../user-identification';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('User Identification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('generateUserId', () => {
    it('generates unique user IDs', () => {
      const id1 = generateUserId();
      const id2 = generateUserId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^user_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^user_\d+_[a-z0-9]+$/);
    });

    it('includes timestamp in ID', () => {
      const beforeTime = Date.now();
      const userId = generateUserId();
      const afterTime = Date.now();
      
      const timestamp = parseInt(userId.split('_')[1]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getUserId', () => {
    it('generates new ID when no stored ID exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const userId = getUserId();
      
      expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('scam-hunt-user-id');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('returns stored ID when valid and not expired', () => {
      const storedData = {
        userId: 'user_123_abc',
        timestamp: Date.now() - 1000 // 1 second ago
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));
      
      const userId = getUserId();
      
      expect(userId).toBe('user_123_abc');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('generates new ID when stored ID is expired', () => {
      const storedData = {
        userId: 'user_123_abc',
        timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));
      
      const userId = getUserId();
      
      expect(userId).not.toBe('user_123_abc');
      expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('handles corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const userId = getUserId();
      
      expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const userId = getUserId();
      
      expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/);
    });
  });

  describe('setUserId', () => {
    it('stores user ID with timestamp', () => {
      const userId = 'user_123_abc';
      const beforeTime = Date.now();
      
      setUserId(userId);
      
      const afterTime = Date.now();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'scam-hunt-user-id',
        expect.stringContaining(userId)
      );
      
      const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(storedData.userId).toBe(userId);
      expect(storedData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(storedData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      expect(() => setUserId('test-user')).not.toThrow();
    });
  });

  describe('clearUserId', () => {
    it('removes user ID from localStorage', () => {
      clearUserId();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('scam-hunt-user-id');
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      expect(() => clearUserId()).not.toThrow();
    });
  });

  describe('hashIP', () => {
    it('generates consistent hash for same IP', () => {
      const ip = '192.168.1.1';
      const hash1 = hashIP(ip);
      const hash2 = hashIP(ip);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{1,16}$/);
    });

    it('generates different hashes for different IPs', () => {
      const hash1 = hashIP('192.168.1.1');
      const hash2 = hashIP('192.168.1.2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('uses salt in hash generation', () => {
      const ip = '192.168.1.1';
      const hash1 = hashIP(ip, 'salt1');
      const hash2 = hashIP(ip, 'salt2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('handles empty IP gracefully', () => {
      const hash = hashIP('');
      
      expect(hash).toMatch(/^[0-9a-f]{1,16}$/);
    });

    it('limits hash length to 16 characters', () => {
      const hash = hashIP('192.168.1.1');
      
      expect(hash.length).toBeLessThanOrEqual(16);
    });
  });

  describe('server-side behavior', () => {
    const originalWindow = global.window;

    beforeAll(() => {
      // Simulate server-side environment
      delete (global as any).window;
    });

    afterAll(() => {
      global.window = originalWindow;
    });

    it('generates temporary ID on server-side', () => {
      const userId = getUserId();
      
      expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/);
    });

    it('does not attempt localStorage operations on server-side', () => {
      setUserId('test-user');
      clearUserId();
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });
});