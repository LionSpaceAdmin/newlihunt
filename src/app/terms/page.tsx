'use client';

import ErrorBoundary from '@/components/ErrorBoundary';
import Navigation from '@/components/Navigation';
import React from 'react';

const TermsPage: React.FC = () => {
    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-black">
                <Navigation lang="en" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
                        <p className="text-gray-400">Last Updated: October 25, 2025</p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert max-w-none">
                        <div className="bg-dark-gray border border-gray-700 rounded-lg p-8 mb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Agreement to Terms</h2>
                            <p className="text-gray-300">
                                By accessing and using Scam Hunt Platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our service.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {/* Service Description */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">1. Service Description</h2>
                                <p className="text-gray-300 mb-4">
                                    Scam Hunt Platform provides an AI-powered analysis tool designed to help identify potential online scams, particularly those targeting supporters of Israel and the IDF. Our service:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Analyzes text, images, and URLs for suspicious patterns</li>
                                    <li>Provides risk scores and credibility assessments</li>
                                    <li>Offers recommendations for user safety</li>
                                    <li>Maintains analysis history locally in your browser</li>
                                </ul>
                            </section>

                            {/* Disclaimer */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">2. Important Disclaimers</h2>

                                <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4 mb-4">
                                    <p className="text-yellow-300 font-semibold mb-2">⚠️ No Guarantee of Accuracy</p>
                                    <p className="text-yellow-200">
                                        Our AI analysis is provided as-is and should be used as ONE tool in your decision-making process. We do not guarantee 100% accuracy and cannot be held liable for false positives or false negatives.
                                    </p>
                                </div>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-6">Use at Your Own Risk</h3>
                                <p className="text-gray-300 mb-4">
                                    You acknowledge that:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Our analysis is automated and may contain errors</li>
                                    <li>You should always use your own judgment</li>
                                    <li>False positives and false negatives can occur</li>
                                    <li>We are not responsible for financial or other losses</li>
                                    <li>This is not professional security advice</li>
                                </ul>
                            </section>

                            {/* User Responsibilities */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">3. User Responsibilities</h2>
                                <p className="text-gray-300 mb-4">When using our service, you agree to:</p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Use the service legally and ethically</li>
                                    <li>Not submit content that violates others' rights</li>
                                    <li>Not attempt to abuse, hack, or disrupt the service</li>
                                    <li>Not use the service for harassment or defamation</li>
                                    <li>Verify information independently before taking action</li>
                                    <li>Report false positives to help improve accuracy</li>
                                </ul>
                            </section>

                            {/* Prohibited Uses */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">4. Prohibited Uses</h2>
                                <p className="text-gray-300 mb-4">You may not use our service to:</p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Analyze private communications without consent</li>
                                    <li>Harass, stalk, or threaten individuals</li>
                                    <li>Spread misinformation or defamation</li>
                                    <li>Attempt to reverse engineer our AI models</li>
                                    <li>Overload our systems (rate limiting applies)</li>
                                    <li>Resell or redistribute our analysis results</li>
                                    <li>Use for any illegal purposes</li>
                                </ul>
                            </section>

                            {/* Intellectual Property */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>
                                <p className="text-gray-300 mb-4">
                                    The Scam Hunt Platform, including its code, design, graphics, and AI models, is proprietary and protected by copyright and other intellectual property laws.
                                </p>
                                <p className="text-gray-300 mb-4">
                                    <strong>Your Content:</strong> You retain ownership of content you submit for analysis. By submitting content, you grant us a license to process it for analysis purposes.
                                </p>
                                <p className="text-gray-300">
                                    <strong>Analysis Results:</strong> Analysis results are provided for your personal use and should not be redistributed without proper context.
                                </p>
                            </section>

                            {/* Limitations of Liability */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
                                <p className="text-gray-300 mb-4">
                                    TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>We provide the service "AS IS" without warranties</li>
                                    <li>We are not liable for any direct, indirect, or consequential damages</li>
                                    <li>We are not liable for false positives, false negatives, or missed scams</li>
                                    <li>We are not liable for financial losses resulting from your decisions</li>
                                    <li>Our total liability shall not exceed the amount you paid us (currently $0)</li>
                                </ul>
                            </section>

                            {/* Third-Party Services */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">7. Third-Party Services</h2>
                                <p className="text-gray-300 mb-4">
                                    Our service integrates with third-party services (Google Gemini AI, Vercel, etc.). These services have their own terms and privacy policies. We are not responsible for:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Third-party service availability or performance</li>
                                    <li>Third-party data handling practices</li>
                                    <li>Changes to third-party APIs or terms</li>
                                </ul>
                            </section>

                            {/* Service Availability */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">8. Service Availability</h2>
                                <p className="text-gray-300">
                                    We strive to provide reliable service but do not guarantee uninterrupted availability. We may:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Temporarily suspend service for maintenance</li>
                                    <li>Modify or discontinue features</li>
                                    <li>Implement rate limiting or usage restrictions</li>
                                    <li>Terminate accounts that violate these terms</li>
                                </ul>
                            </section>

                            {/* Changes to Terms */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
                                <p className="text-gray-300">
                                    We may update these terms from time to time. Significant changes will be communicated through:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Updated "Last Updated" date</li>
                                    <li>Notice on the website</li>
                                    <li>Email notification (if applicable)</li>
                                </ul>
                                <p className="text-gray-300 mt-4">
                                    Continued use of the service after changes constitutes acceptance of the new terms.
                                </p>
                            </section>

                            {/* Governing Law */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">10. Governing Law</h2>
                                <p className="text-gray-300">
                                    These terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through good-faith negotiation first.
                                </p>
                            </section>

                            {/* Contact */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">11. Contact Information</h2>
                                <p className="text-gray-300 mb-4">
                                    For questions about these Terms of Service:
                                </p>
                                <ul className="list-none text-gray-300 space-y-2">
                                    <li>📧 Email: <a href="mailto:legal@scamhunter.app" className="text-accent-blue hover:underline">legal@scamhunter.app</a></li>
                                    <li>🌐 Website: <a href="/contact" className="text-accent-blue hover:underline">Contact Page</a></li>
                                    <li>💻 GitHub: <a href="https://github.com/LionSpaceAdmin/newlihunt" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">Repository</a></li>
                                </ul>
                            </section>

                            {/* Acceptance */}
                            <section className="bg-linear-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
                                <p className="text-gray-300">
                                    By using Scam Hunt Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default TermsPage;
