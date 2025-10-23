// Risk detection signals and rules for scam analysis

/**
 * Risk signal categories and their definitions
 */
const RISK_CATEGORIES = {
    ACCOUNT: 'Account-based signals (age, verification, activity patterns)',
    CONTENT: 'Content-based signals (urgency language, donation requests)',
    BEHAVIORAL: 'Behavioral signals (impersonation tactics, emotional manipulation)',
    TECHNICAL: 'Technical signals (suspicious URLs, image metadata)'
};

/**
 * Severity levels for risk signals
 */
const SEVERITY_LEVELS = {
    LOW: { points: 5, color: '#3b82f6' },      // Blue
    MEDIUM: { points: 15, color: '#f59e0b' },   // Yellow
    HIGH: { points: 25, color: '#ef4444' }     // Red
};

/**
 * Comprehensive risk signals database
 */
const RISK_SIGNALS = {
    // Account-based signals
    'new-account': {
        id: 'new-account',
        name: 'Recently Created Account',
        category: RISK_CATEGORIES.ACCOUNT,
        severity: 'MEDIUM',
        description: 'Account created within the last 30 days',
        keywords: ['new account', 'recently joined', 'created today']
    },
    
    'unverified-account': {
        id: 'unverified-account',
        name: 'Unverified Account',
        category: RISK_CATEGORIES.ACCOUNT,
        severity: 'LOW',
        description: 'Account lacks verification badges or official status',
        keywords: ['unverified', 'no verification', 'not verified']
    },
    
    'suspicious-profile': {
        id: 'suspicious-profile',
        name: 'Suspicious Profile Information',
        category: RISK_CATEGORIES.ACCOUNT,
        severity: 'HIGH',
        description: 'Profile contains inconsistent or suspicious information',
        keywords: ['fake profile', 'stolen photo', 'inconsistent info']
    },

    // Content-based signals
    'urgent-language': {
        id: 'urgent-language',
        name: 'Urgent Language Detected',
        category: RISK_CATEGORIES.CONTENT,
        severity: 'HIGH',
        description: 'Uses urgent or pressure language to prompt immediate action',
        keywords: ['urgent', 'immediately', 'act now', 'limited time', 'expires soon', 'emergency']
    },
    
    'donation-request': {
        id: 'donation-request',
        name: 'Unverified Donation Request',
        category: RISK_CATEGORIES.CONTENT,
        severity: 'HIGH',
        description: 'Requests donations without official verification',
        keywords: ['donate now', 'send money', 'financial help', 'contribute', 'fund']
    },
    
    'emotional-manipulation': {
        id: 'emotional-manipulation',
        name: 'Emotional Manipulation',
        category: RISK_CATEGORIES.CONTENT,
        severity: 'MEDIUM',
        description: 'Uses emotional appeals to manipulate decision-making',
        keywords: ['heartbreaking', 'desperate', 'life or death', 'tragic', 'suffering']
    },
    
    'poor-grammar': {
        id: 'poor-grammar',
        name: 'Poor Grammar/Language',
        category: RISK_CATEGORIES.CONTENT,
        severity: 'LOW',
        description: 'Contains grammatical errors or poor language quality',
        keywords: ['grammar errors', 'spelling mistakes', 'poor english']
    },

    // Behavioral signals
    'impersonation': {
        id: 'impersonation',
        name: 'Potential Impersonation',
        category: RISK_CATEGORIES.BEHAVIORAL,
        severity: 'HIGH',
        description: 'Appears to impersonate official organizations or individuals',
        keywords: ['official', 'IDF', 'Israeli government', 'military', 'authorized']
    },
    
    'pressure-tactics': {
        id: 'pressure-tactics',
        name: 'Pressure Tactics',
        category: RISK_CATEGORIES.BEHAVIORAL,
        severity: 'HIGH',
        description: 'Uses psychological pressure to force quick decisions',
        keywords: ['dont wait', 'last chance', 'wont ask again', 'final notice']
    },
    
    'social-proof-abuse': {
        id: 'social-proof-abuse',
        name: 'False Social Proof',
        category: RISK_CATEGORIES.BEHAVIORAL,
        severity: 'MEDIUM',
        description: 'Claims false endorsements or social validation',
        keywords: ['thousands donated', 'everyone is helping', 'viral campaign']
    },

    // Technical signals
    'suspicious-url': {
        id: 'suspicious-url',
        name: 'Suspicious URL',
        category: RISK_CATEGORIES.TECHNICAL,
        severity: 'HIGH',
        description: 'Contains suspicious or potentially malicious URLs',
        keywords: ['bit.ly', 'tinyurl', 'suspicious domain', 'redirect']
    },
    
    'domain-spoofing': {
        id: 'domain-spoofing',
        name: 'Domain Spoofing',
        category: RISK_CATEGORIES.TECHNICAL,
        severity: 'HIGH',
        description: 'Uses domains that mimic legitimate organizations',
        keywords: ['paypal', 'fidf', 'israeli-gov', 'idf-official']
    },
    
    'no-ssl': {
        id: 'no-ssl',
        name: 'No SSL Certificate',
        category: RISK_CATEGORIES.TECHNICAL,
        severity: 'MEDIUM',
        description: 'Website lacks proper SSL encryption',
        keywords: ['http://', 'not secure', 'no encryption']
    }
};

/**
 * Positive credibility signals (reduce risk score)
 */
const CREDIBILITY_SIGNALS = {
    'official-verification': {
        id: 'official-verification',
        name: 'Official Verification',
        points: -20,
        description: 'Account has official verification badges',
        keywords: ['verified', 'official account', 'blue checkmark']
    },
    
    'established-presence': {
        id: 'established-presence',
        name: 'Established Online Presence',
        points: -15,
        description: 'Long-standing account with consistent activity',
        keywords: ['established', 'long history', 'consistent posting']
    },
    
    'transparent-contact': {
        id: 'transparent-contact',
        name: 'Transparent Contact Information',
        points: -10,
        description: 'Provides clear, verifiable contact information',
        keywords: ['contact info', 'phone number', 'address', 'official website']
    },
    
    'third-party-endorsement': {
        id: 'third-party-endorsement',
        name: 'Third-party Endorsements',
        points: -15,
        description: 'Endorsed by known legitimate organizations',
        keywords: ['endorsed by', 'recommended by', 'partnered with']
    }
};

/**
 * Debiasing rules to prevent false positives
 */
const DEBIASING_RULES = {
    anonymous_profile_neutralized: {
        description: 'Anonymous profiles are not automatically flagged as suspicious',
        triggers: ['anonymous', 'private profile', 'no photo']
    },
    
    patriotic_tokens_neutralized: {
        description: 'Patriotic language is not considered a risk factor',
        triggers: ['israel', 'idf', 'jewish', 'zionist', 'patriotic']
    },
    
    sentiment_penalty_capped: {
        description: 'Emotional content penalty is limited to prevent over-flagging',
        triggers: ['emotional', 'heartfelt', 'passionate']
    }
};

/**
 * Safe donation channels (whitelist)
 */
const SAFE_DONATION_CHANNELS = [
    {
        name: 'Friends of the IDF (FIDF)',
        url: 'https://fidf.org',
        description: 'Official support organization for the IDF',
        verified: true
    },
    {
        name: 'Official IDF Website',
        url: 'https://idf.il',
        description: 'Official Israel Defense Forces website',
        verified: true
    },
    {
        name: 'Israeli Government Portal',
        url: 'https://gov.il',
        description: 'Official Israeli government portal',
        verified: true
    }
];

/**
 * Calculate risk score based on detected signals
 */
function calculateRiskScore(detectedSignals) {
    let totalScore = 0;
    
    detectedSignals.forEach(signal => {
        const severity = SEVERITY_LEVELS[signal.severity];
        if (severity) {
            totalScore += severity.points;
        }
    });
    
    // Cap at 100
    return Math.min(totalScore, 100);
}

/**
 * Calculate credibility score
 */
function calculateCredibilityScore(credibilitySignals, riskScore) {
    let credibilityBonus = 0;
    
    credibilitySignals.forEach(signal => {
        credibilityBonus += Math.abs(signal.points);
    });
    
    // Base credibility is inverse of risk, plus bonuses
    const baseCredibility = Math.max(0, 100 - riskScore);
    const finalCredibility = Math.min(100, baseCredibility + credibilityBonus);
    
    return finalCredibility;
}

/**
 * Determine classification based on scores
 */
function getClassification(riskScore, credibilityScore) {
    if (riskScore >= 70 || credibilityScore <= 30) {
        return 'HIGH_RISK';
    } else if (riskScore >= 40 || credibilityScore <= 60) {
        return 'SUSPICIOUS';
    } else {
        return 'SAFE';
    }
}

module.exports = {
    RISK_CATEGORIES,
    SEVERITY_LEVELS,
    RISK_SIGNALS,
    CREDIBILITY_SIGNALS,
    DEBIASING_RULES,
    SAFE_DONATION_CHANNELS,
    calculateRiskScore,
    calculateCredibilityScore,
    getClassification
};