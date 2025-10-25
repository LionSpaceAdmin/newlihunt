'use client';

import { ConfirmModal } from '@/components/ConfirmModal';
import Navigation from '@/components/Navigation';
import { getHistoryService } from '@/lib/history-service';
import { Classification } from '@/types/analysis';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const ProfilePage: React.FC = () => {
    const [stats, setStats] = useState({
        totalAnalyses: 0,
        safeCount: 0,
        suspiciousCount: 0,
        highRiskCount: 0,
        averageRiskScore: 0,
        averageCredibilityScore: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
    const [showClearModal, setShowClearModal] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        loadUserStats();
    }, []);

    const loadUserStats = async () => {
        try {
            setLoading(true);
            const historyService = getHistoryService();
            const analyses = await historyService.getHistory();

            const safeCount = analyses.filter((a) => a.analysis.analysisData.classification === Classification.SAFE).length;
            const suspiciousCount = analyses.filter((a) => a.analysis.analysisData.classification === Classification.SUSPICIOUS).length;
            const highRiskCount = analyses.filter((a) => a.analysis.analysisData.classification === Classification.HIGH_RISK).length;

            const totalRiskScore = analyses.reduce((sum, a) => sum + a.analysis.analysisData.riskScore, 0);
            const totalCredibilityScore = analyses.reduce((sum, a) => sum + a.analysis.analysisData.credibilityScore, 0);

            setStats({
                totalAnalyses: analyses.length,
                safeCount,
                suspiciousCount,
                highRiskCount,
                averageRiskScore: analyses.length > 0 ? Math.round(totalRiskScore / analyses.length) : 0,
                averageCredibilityScore: analyses.length > 0 ? Math.round(totalCredibilityScore / analyses.length) : 0,
            });

            setRecentAnalyses(analyses.slice(0, 5));
        } catch (error) {
            console.error('Failed to load user stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        setIsClearing(true);
        try {
            const historyService = getHistoryService();
            await historyService.clearHistory();
            setShowClearModal(false);
            await loadUserStats(); // Reload stats
        } catch (error) {
            console.error('Failed to clear history:', error);
        } finally {
            setIsClearing(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    const getClassificationColor = (classification: Classification) => {
        switch (classification) {
            case Classification.SAFE:
                return 'text-green-400 bg-green-900/20';
            case Classification.SUSPICIOUS:
                return 'text-yellow-400 bg-yellow-900/20';
            case Classification.HIGH_RISK:
                return 'text-red-400 bg-red-900/20';
            default:
                return 'text-gray-400 bg-gray-900/20';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black">
                <Navigation lang="en" />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading your profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <Navigation lang="en" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="bg-dark-gray rounded-lg border border-gray-800 p-8 mb-8">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Digital Guardian</h1>
                            <p className="text-gray-400 mb-1">Protecting the digital front since today</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4">
                                        <img
                                            src="/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp"
                                            alt="Lion"
                                            className="w-full h-full object-contain rounded"
                                        />
                                    </div>
                                    <span>Lions of Zion Member</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4">
                                        <img
                                            src="/lion-digital-guardian/status-success/digital-shield-success_v1_1x1.webp"
                                            alt="Shield"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span>Scam Hunter</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                    <span>Israel Supporter</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Statistics */}
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold text-white mb-6">Analysis Statistics</h2>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-dark-gray rounded-lg border border-gray-800 p-6 text-center">
                                <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalAnalyses}</div>
                                <div className="text-sm text-gray-400">Total Analyses</div>
                            </div>

                            <div className="bg-dark-gray rounded-lg border border-gray-800 p-6 text-center">
                                <div className="text-3xl font-bold text-green-400 mb-2">{stats.safeCount}</div>
                                <div className="text-sm text-gray-400">Safe Content</div>
                            </div>

                            <div className="bg-dark-gray rounded-lg border border-gray-800 p-6 text-center">
                                <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.suspiciousCount}</div>
                                <div className="text-sm text-gray-400">Suspicious</div>
                            </div>

                            <div className="bg-dark-gray rounded-lg border border-gray-800 p-6 text-center">
                                <div className="text-3xl font-bold text-red-400 mb-2">{stats.highRiskCount}</div>
                                <div className="text-sm text-gray-400">High Risk</div>
                            </div>

                            <div className="bg-dark-gray rounded-lg border border-gray-800 p-6 text-center">
                                <div className="text-3xl font-bold text-purple-400 mb-2">{stats.averageRiskScore}</div>
                                <div className="text-sm text-gray-400">Avg Risk Score</div>
                            </div>

                            <div className="bg-dark-gray rounded-lg border border-gray-800 p-6 text-center">
                                <div className="text-3xl font-bold text-cyan-400 mb-2">{stats.averageCredibilityScore}</div>
                                <div className="text-sm text-gray-400">Avg Credibility</div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-dark-gray rounded-lg border border-gray-800 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                            {recentAnalyses.length > 0 ? (
                                <div className="space-y-3">
                                    {recentAnalyses.map((analysis) => (
                                        <Link
                                            key={analysis.id}
                                            href={`/history/${analysis.id}`}
                                            className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getClassificationColor(analysis.analysis.analysisData.classification)}`}>
                                                    {analysis.analysis.analysisData.classification}
                                                </span>
                                                <span className="text-white text-sm truncate max-w-xs">
                                                    {analysis.input.message.substring(0, 50)}...
                                                </span>
                                            </div>
                                            <span className="text-gray-400 text-xs">
                                                {formatDate(analysis.timestamp)}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-12 mx-auto mb-4 rounded-lg overflow-hidden opacity-50">
                                        <Image
                                            src="/lion-digital-guardian/empty-state/calm-guardian_v1_4x3.webp"
                                            alt="No Activity"
                                            width={128}
                                            height={96}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="text-gray-400">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Mission Statement */}
                        <div className="bg-dark-gray rounded-lg border border-gray-800 p-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8">
                                    <img
                                        src="/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp"
                                        alt="Lion Guardian"
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Our Mission</h3>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                Protecting supporters of Israel and the IDF from online impersonation scams and fake accounts.
                                Together, we defend the digital front and expose those who seek to deceive and exploit.
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-blue-400">
                                <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                                <span>Am Yisrael Chai</span>
                            </div>
                        </div>

                        {/* Support Section */}
                        <div className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 rounded-lg border border-orange-800/30 p-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <span className="text-2xl">☕</span>
                                <h3 className="text-lg font-semibold text-white">Support Our Work</h3>
                            </div>
                            <p className="text-gray-300 text-sm mb-4">
                                Help us continue protecting the digital front and exposing fake accounts targeting Israel supporters.
                            </p>
                            <div className="space-y-2">
                                <a
                                    href="https://buymeacoffee.com/danielhanukayeb/e/471429"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors text-center"
                                >
                                    🎯 Support This Project
                                </a>
                                <a
                                    href="https://www.fidf.org/donate"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors text-center"
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                                            <svg className="w-2 h-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </div>
                                        <span>Support FIDF</span>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <div className="bg-dark-gray rounded-lg border border-gray-800 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
                            <div className="space-y-3">
                                <Link
                                    href="/history"
                                    className="w-full flex text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>View Full History</span>
                                    </div>
                                </Link>
                                <Link
                                    href="/"
                                    className="w-full flex text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>New Analysis</span>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => setShowClearModal(true)}
                                    className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>Clear All History</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clear History Modal */}
                <ConfirmModal
                    isOpen={showClearModal}
                    onClose={() => setShowClearModal(false)}
                    onConfirm={handleClearHistory}
                    title="Clear All History"
                    message="Are you sure you want to clear all analysis history? This action cannot be undone."
                    confirmText="Clear History"
                    cancelText="Cancel"
                    isDanger
                    isLoading={isClearing}
                />
            </div>
        </div>
    );
};

export default ProfilePage;