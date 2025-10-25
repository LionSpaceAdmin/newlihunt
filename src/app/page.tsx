import ErrorBoundary from '@/components/ErrorBoundary';
import { Footer } from '@/components/Footer';
import HelpSystem from '@/components/HelpSystem';
import LandingPage from '@/components/LandingPage';
import Navigation from '@/components/Navigation';
import SupportWidget from '@/components/SupportWidget';

export default function Home() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Navigation lang="en" />
        <LandingPage lang="en" />
        <HelpSystem lang="en" />
        <SupportWidget lang="en" />
        <Footer lang="en" />
      </div>
    </ErrorBoundary>
  );
}
