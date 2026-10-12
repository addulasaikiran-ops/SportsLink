import { Suspense } from "react";
import { OnboardingPage } from "@/components/OnboardingPage";

export const metadata = {
  title: "Complete Your Profile",
  description: "Set up your SPORTSLINK profile and connect with the world of sport.",
  robots: { index: false, follow: false }
};

function OnboardingFallback() {
  return <main className="onboarding-main"><section className="onboarding-card card onboarding-loading" role="status"><h2>Preparing your profile…</h2><p>Just a moment.</p></section></main>;
}

export default function Page() {
  return <Suspense fallback={<OnboardingFallback />}><OnboardingPage /></Suspense>;
}
