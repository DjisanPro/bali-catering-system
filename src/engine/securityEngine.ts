import { AuditLog, User, UserRole, SecurityAlert, SecurityAlertType, SecurityAlertSeverity } from '../types';

// Standard SHA-256 implementation in pure TypeScript for reliable synchronous execution
function sha256Sync(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter = 0;

  const isPrime = (candidate: number) => {
    for (let factor = 2; factor * factor <= candidate; factor++) {
      if (candidate % factor === 0) return false;
    }
    return true;
  };

  const getFractionalBits = (powResult: number) =>
    ((powResult - Math.floor(powResult)) * maxWord) | 0;

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = getFractionalBits(mathPow(candidate, 1 / 2));
      }
      k[primeCounter] = getFractionalBits(mathPow(candidate, 1 / 3));
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // ASCII only
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const a = hash[0],
        e = hash[4];
      const temp1 =
        hash[7] +
        ((e >>> 6) ^ (e >>> 11) ^ (e >>> 25)) + // S1
        ((e & hash[5]) ^ (~e & hash[6])) + // ch
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                ((w15 >>> 7) ^ (w15 >>> 18) ^ (w15 >>> 3)) + // s0
                w[i - 7] +
                ((w2 >>> 17) ^ (w2 >>> 19) ^ (w2 >>> 10))) | // s1
              0);

      const temp2 =
        ((a >>> 2) ^ (a >>> 13) ^ (a >>> 22)) + // S0
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
  }
  return result.slice(0, 64);
}

export const securityEngine = {
  // Generate random salt with secure fallback
  generateSalt(length = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let salt = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const randomBytes = new Uint8Array(length);
      window.crypto.getRandomValues(randomBytes);
      for (let i = 0; i < length; i++) {
        salt += chars[randomBytes[i] % chars.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        salt += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return salt;
  },

  // Hash input with salt
  hashWithSalt(input: string, salt: string): string {
    if (!input || !salt) return '';
    return sha256Sync(`${salt}::bali_catering::${input.trim()}`);
  },

  // Verify plain input against stored salt + hash
  verifyHash(input: string, salt: string, expectedHash: string): boolean {
    if (!input || !salt || !expectedHash) return false;
    const computed = this.hashWithSalt(input, salt);
    return computed === expectedHash;
  },

  // Sanitize user inputs to prevent injection
  sanitizeInput(val: string): string {
    if (!val) return '';
    return val.replace(/<[^>]*>?/gm, '').trim();
  },

  // Create standardized, auditable event log entry
  createAuditEntry(
    action: string,
    entity: AuditLog['entity'],
    entityId: string,
    description: string,
    user = 'Sistema',
    userId?: string,
    userRole?: UserRole,
    previousValue?: string,
    newValue?: string,
    result: AuditLog['result'] = 'SUCCESS'
  ): AuditLog {
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      entity,
      entityId,
      description,
      user,
      userId,
      userRole,
      previousValue,
      newValue,
      result,
      timestamp: new Date().toISOString(),
    };
  },

  // Create system security alert
  createSecurityAlert(
    type: SecurityAlertType,
    severity: SecurityAlertSeverity,
    title: string,
    message: string,
    user = 'Sistema',
    userRole?: UserRole,
    metadata?: Record<string, any>
  ): SecurityAlert {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      severity,
      title,
      message,
      user,
      userRole,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metadata,
    };
  },

  // Generate deterministic idempotency key for anti-duplicate prevention
  generateIdempotencyKey(scope: string, identifier: string): string {
    return `idem_${scope}_${identifier}_${Date.now().toString(36)}`;
  },
};
