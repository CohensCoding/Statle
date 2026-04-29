import { Suspense } from "react";
import StatleApp from "@/app/StatleApp";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <StatleApp />
    </Suspense>
  );
}
