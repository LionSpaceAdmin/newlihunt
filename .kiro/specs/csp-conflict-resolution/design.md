# Design Document

## Overview

The CSP conflict resolution involves consolidating Content Security Policy configurations from multiple sources (next.config.ts and vercel.json) into a single, authoritative configuration that properly allows the Buy Me a Coffee widget while maintaining security.

## Architecture

### Current State Analysis

- CSP is defined in `next.config.ts` with comprehensive directives
- `vercel.json` contains additional security headers but no CSP
- The Buy Me a Coffee widget domains are already included in next.config.ts CSP
- Conflict may be due to header ordering or Vercel platform processing

### Proposed Solution

1. **Single Source of Truth**: Use next.config.ts as the primary CSP configuration source
2. **Vercel Compatibility**: Ensure CSP format is compatible with Vercel's header processing
3. **Widget Support**: Verify all Buy Me a Coffee domains and directives are properly configured

## Components and Interfaces

### CSP Configuration Manager

- **Location**: `next.config.ts`
- **Responsibility**: Define and apply all CSP directives
- **Format**: Properly formatted CSP string with semicolon separators

### Security Headers Coordinator

- **Location**: Both `next.config.ts` and `vercel.json`
- **Responsibility**: Ensure non-conflicting security headers
- **Approach**: Move all CSP to next.config.ts, keep other security headers in vercel.json

## Data Models

### CSP Directive Structure

```typescript
interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'connect-src': string[];
  'font-src': string[];
  'frame-ancestors': string[];
  'base-uri': string[];
  'form-action': string[];
}
```

### Required Buy Me a Coffee Domains

- Script source: `https://cdnjs.buymeacoffee.com`
- Connect source: `https://buymeacoffee.com`, `https://cdnjs.buymeacoffee.com`
- Additional subdomains: `https://*.buymeacoffee.com`

## Error Handling

### CSP Violation Handling

- Development: Detailed console logging of violations
- Production: Silent handling with monitoring
- Fallback: Graceful degradation when widgets fail to load

### Configuration Validation

- Build-time validation of CSP syntax
- Runtime detection of CSP conflicts
- Clear error messages for developers

## Testing Strategy

### CSP Validation Tests

- Verify widget scripts load successfully
- Test CSP directive completeness
- Validate no console errors in browser

### Integration Tests

- Test Buy Me a Coffee widget functionality
- Verify other external resources still work
- Cross-browser compatibility testing

## Implementation Plan

1. **Audit Current CSP**: Review existing directives in next.config.ts
2. **Fix CSP Format**: Ensure proper semicolon separation and directive formatting
3. **Remove Conflicts**: Ensure vercel.json doesn't override CSP
4. **Test Widget Loading**: Verify Buy Me a Coffee widget loads without errors
5. **Validate Security**: Ensure no security regressions
