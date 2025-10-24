import ErrorBoundary from '@/components/ErrorBoundary';
import HelpSystem from '@/components/HelpSystem';
import LandingPage from '@/components/LandingPage';
import Navigation from '@/components/Navigation';
import SupportWidget from '@/components/SupportWidget';

export default function Home() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <Navigation lang="en" />
        <LandingPage lang="en" />
        <HelpSystem lang="en" />
        <SupportWidget lang="en" />
      </div>
    </ErrorBoundary>
  );
}
