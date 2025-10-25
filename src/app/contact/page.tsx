'use client';

import ErrorBoundary from '@/components/ErrorBoundary';
import Navigation from '@/components/Navigation';
import React from 'react';
import { FiGithub, FiMail, FiMessageCircle, FiTwitter } from 'react-icons/fi';

const ContactPage: React.FC = () => {
    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-black">
                <Navigation lang="en" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
                        <p className="text-xl text-gray-400">
                            Have questions, feedback, or want to report a scam? We're here to help.
                        </p>
                    </div>

                    {/* Contact Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {/* Email */}
                        <a
                            href="mailto:contact@scamhunter.app"
                            className="bg-dark-gray border border-gray-700 rounded-lg p-6 hover:border-accent-blue transition-colors"
                        >
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0">
                                    <FiMail className="text-blue-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
                                    <p className="text-gray-400 mb-2">
                                        Send us an email for general inquiries or detailed reports
                                    </p>
                                    <p className="text-accent-blue">contact@scamhunter.app</p>
                                </div>
                            </div>
                        </a>

                        {/* GitHub Issues */}
                        <a
                            href="https://github.com/LionSpaceAdmin/newlihunt/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-dark-gray border border-gray-700 rounded-lg p-6 hover:border-accent-blue transition-colors"
                        >
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center shrink-0">
                                    <FiGithub className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">GitHub Issues</h3>
                                    <p className="text-gray-400 mb-2">
                                        Report bugs, request features, or contribute to the project
                                    </p>
                                    <p className="text-accent-blue">View Issues →</p>
                                </div>
                            </div>
                        </a>

                        {/* Social Media */}
                        <a
                            href="https://twitter.com/scamhunter"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-dark-gray border border-gray-700 rounded-lg p-6 hover:border-accent-blue transition-colors"
                        >
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-cyan-900/20 rounded-lg flex items-center justify-center shrink-0">
                                    <FiTwitter className="text-cyan-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Social Media</h3>
                                    <p className="text-gray-400 mb-2">
                                        Follow us for updates and share your experiences
                                    </p>
                                    <p className="text-accent-blue">@scamhunter</p>
                                </div>
                            </div>
                        </a>

                        {/* Community */}
                        <div className="bg-dark-gray border border-gray-700 rounded-lg p-6">
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center shrink-0">
                                    <FiMessageCircle className="text-green-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
                                    <p className="text-gray-400 mb-2">
                                        Join our community to share experiences and help others
                                    </p>
                                    <p className="text-gray-500">Coming Soon</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="bg-dark-gray border border-gray-700 rounded-lg p-8 mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    How do I report a false positive?
                                </h3>
                                <p className="text-gray-400">
                                    Use the feedback buttons (thumbs up/down) on any analysis result. You can also email us with specific details about the false positive.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Can I submit scam examples to improve detection?
                                </h3>
                                <p className="text-gray-400">
                                    Yes! Please email us with examples of scams you've encountered. This helps us improve our detection algorithms.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Is my data private and secure?
                                </h3>
                                <p className="text-gray-400">
                                    Yes. All analyses are stored locally in your browser. We use anonymous user identification and never collect personal information. See our <a href="/privacy" className="text-accent-blue hover:underline">Privacy Policy</a> for details.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    How can I support this project?
                                </h3>
                                <p className="text-gray-400">
                                    You can support us directly via <a href="https://buymeacoffee.com/danielhanukayeb/e/471429" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">Buy Me a Coffee</a>, or support the IDF through <a href="https://www.fidf.org/donate" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">FIDF</a>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mission Statement */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4">
                            <img
                                src="/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp"
                                alt="Lion Guardian"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-4">
                            Protecting supporters of Israel and the IDF from online impersonation scams through advanced AI-powered detection and community awareness.
                        </p>
                        <p className="text-blue-400 font-semibold">🇮🇱 Am Yisrael Chai 🇮🇱</p>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default ContactPage;
