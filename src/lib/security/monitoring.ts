/* eslint-disable @typescript-eslint/no-explicit-any */
import { SecurityEvent, SecurityLogger } from '@/lib/middleware/security';

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  topIPs: Array<{ ip: string; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  recentEvents: SecurityEvent[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface ThreatIntelligence {
  suspiciousIPs: Set<string>;
  blockedPatterns: RegExp[];
  knownAttackSignatures: string[];
  lastUpdated: Date;
}

export class SecurityMonitor {
  private static threatIntel: ThreatIntelligence = {
    suspiciousIPs: new Set(),
    blockedPatterns: [],
    knownAttackSignatures: [],
    lastUpdated: new Date(),
  };

  private static readonly SUSPICIOUS_IP_THRESHOLD = 10; // Events per hour
  private static readonly RATE_LIMIT_THRESHOLD = 50; // Requests per minute

  public static getSecurityMetrics(timeRangeHours: number = 24): SecurityMetrics {
    const now = new Date();
    const start = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);

    const events = SecurityLogger.getEvents(1000).filter(event => event.timestamp >= start);

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    const endpointCounts: Record<string, number> = {};

    events.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

      // Count by IP
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;

      // Count by endpoint
      endpointCounts[event.endpoint] = (endpointCounts[event.endpoint] || 0) + 1;
    });

    // Sort and get top IPs and endpoints
    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      topIPs,
      topEndpoints,
      recentEvents: events.slice(-20), // Last 20 events
      timeRange: { start, end: now },
    };
  }

  public static identifyThreats(): {
    suspiciousIPs: string[];
    attackPatterns: string[];
    recommendations: string[];
  } {
    const metrics = this.getSecurityMetrics(1); // Last hour
    const suspiciousIPs: string[] = [];
    const attackPatterns: string[] = [];
    const recommendations: string[] = [];

    // Identify suspicious IPs
    metrics.topIPs.forEach(({ ip, count }) => {
      if (count > this.SUSPICIOUS_IP_THRESHOLD) {
        suspiciousIPs.push(ip);
        this.threatIntel.suspiciousIPs.add(ip);
      }
    });

    // Identify attack patterns
    const recentEvents = SecurityLogger.getEvents(100);
    const patternCounts: Record<string, number> = {};

    recentEvents.forEach(event => {
      if (event.type === 'blocked_request' || event.type === 'invalid_input') {
        const pattern = this.extractAttackPattern(event.message);
        if (pattern) {
          patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
        }
      }
    });

    Object.entries(patternCounts).forEach(([pattern, count]) => {
      if (count > 5) {
        // Pattern seen more than 5 times
        attackPatterns.push(`${pattern} (${count} occurrences)`);
      }
    });

    // Generate recommendations
    if (suspiciousIPs.length > 0) {
      recommendations.push(`Consider blocking ${suspiciousIPs.length} suspicious IP(s)`);
    }

    if (metrics.eventsByType.rate_limit > 50) {
      recommendations.push('High rate limiting activity - consider tightening limits');
    }

    if (metrics.eventsByType.invalid_input > 20) {
      recommendations.push('High invalid input activity - possible attack in progress');
    }

    if (attackPatterns.length > 0) {
      recommendations.push('Multiple attack patterns detected - review security rules');
    }

    return {
      suspiciousIPs,
      attackPatterns,
      recommendations,
    };
  }

  private static extractAttackPattern(message: string): string | null {
    // Extract common attack patterns from security event messages
    const patterns = [
      /SQL injection/i,
      /XSS attack/i,
      /Command injection/i,
      /Path traversal/i,
      /Prototype pollution/i,
      /Rate limit exceeded/i,
      /Invalid JSON/i,
      /Malicious pattern/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return pattern.source.replace(/[\/\\^$*+?.()|[\]{}]/g, '').toLowerCase();
      }
    }

    return null;
  }

  public static generateSecurityReport(): string {
    const metrics = this.getSecurityMetrics(24);
    const threats = this.identifyThreats();

    const report = `
# Security Report - ${new Date().toISOString()}

## Summary
- Total security events in last 24h: ${metrics.totalEvents}
- Critical events: ${metrics.eventsBySeverity.critical || 0}
- High severity events: ${metrics.eventsBySeverity.high || 0}
- Medium severity events: ${metrics.eventsBySeverity.medium || 0}

## Event Breakdown
${Object.entries(metrics.eventsByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

## Top Source IPs
${metrics.topIPs.map(({ ip, count }) => `- ${ip}: ${count} events`).join('\n')}

## Top Targeted Endpoints
${metrics.topEndpoints.map(({ endpoint, count }) => `- ${endpoint}: ${count} events`).join('\n')}

## Threat Analysis
### Suspicious IPs: ${threats.suspiciousIPs.length}
${threats.suspiciousIPs.map(ip => `- ${ip}`).join('\n')}

### Attack Patterns: ${threats.attackPatterns.length}
${threats.attackPatterns.map(pattern => `- ${pattern}`).join('\n')}

## Recommendations
${threats.recommendations.map(rec => `- ${rec}`).join('\n')}

## Recent Critical Events
${metrics.recentEvents
  .filter(event => event.severity === 'critical' || event.severity === 'high')
  .slice(-5)
  .map(event => `- ${event.timestamp.toISOString()}: ${event.message} (${event.ip})`)
  .join('\n')}
`;

    return report;
  }

  public static async sendAlerts(): Promise<void> {
    const threats = this.identifyThreats();

    // Send alerts for critical threats
    if (threats.suspiciousIPs.length > 5) {
      await this.sendAlert(
        'critical',
        `High number of suspicious IPs detected: ${threats.suspiciousIPs.length}`,
        { suspiciousIPs: threats.suspiciousIPs }
      );
    }

    if (threats.attackPatterns.length > 3) {
      await this.sendAlert(
        'high',
        `Multiple attack patterns detected: ${threats.attackPatterns.length}`,
        { attackPatterns: threats.attackPatterns }
      );
    }

    // Check for sustained attacks
    const recentEvents = SecurityLogger.getEvents(50);
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
    const recentCriticalEvents = recentEvents.filter(
      event =>
        event.timestamp >= last5Minutes &&
        (event.severity === 'critical' || event.severity === 'high')
    );

    if (recentCriticalEvents.length > 10) {
      await this.sendAlert(
        'critical',
        `Sustained attack detected: ${recentCriticalEvents.length} critical events in 5 minutes`,
        { recentEvents: recentCriticalEvents.slice(-10) }
      );
    }
  }

  private static async sendAlert(
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    metadata: any
  ): Promise<void> {
    // Log the alert
    console.error(`SECURITY ALERT [${severity.toUpperCase()}]: ${message}`, metadata);

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Send to AWS SNS, Slack, email, etc.
        // Implementation depends on your alerting infrastructure

        // Example: Send to webhook
        if (process.env.SECURITY_WEBHOOK_URL) {
          await fetch(process.env.SECURITY_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              severity,
              message,
              timestamp: new Date().toISOString(),
              metadata,
            }),
          });
        }
      } catch (error) {
        console.error('Failed to send security alert:', error);
      }
    }
  }

  public static isIPSuspicious(ip: string): boolean {
    return this.threatIntel.suspiciousIPs.has(ip);
  }

  public static addSuspiciousIP(ip: string): void {
    this.threatIntel.suspiciousIPs.add(ip);
    this.threatIntel.lastUpdated = new Date();
  }

  public static removeSuspiciousIP(ip: string): void {
    this.threatIntel.suspiciousIPs.delete(ip);
    this.threatIntel.lastUpdated = new Date();
  }

  public static updateThreatIntelligence(intel: Partial<ThreatIntelligence>): void {
    if (intel.suspiciousIPs) {
      this.threatIntel.suspiciousIPs = intel.suspiciousIPs;
    }
    if (intel.blockedPatterns) {
      this.threatIntel.blockedPatterns = intel.blockedPatterns;
    }
    if (intel.knownAttackSignatures) {
      this.threatIntel.knownAttackSignatures = intel.knownAttackSignatures;
    }
    this.threatIntel.lastUpdated = new Date();
  }

  public static getThreatIntelligence(): ThreatIntelligence {
    return { ...this.threatIntel };
  }
}

// Auto-run threat detection every 5 minutes
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(
    () => {
      SecurityMonitor.sendAlerts().catch(error => {
        console.error('Failed to send security alerts:', error);
      });
    },
    5 * 60 * 1000
  );
}
