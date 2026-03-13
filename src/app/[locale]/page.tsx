import { Hero } from "@/components/landing/Hero";
import { InflationForm } from "@/components/landing/InflationForm";
import { LiveCounter } from "@/components/social/LiveCounter";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary">
      <Hero />
      <InflationForm />
      <LiveCounter />
    </main>
  );
}
