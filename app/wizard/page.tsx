// File: app/wizard/page.tsx

import { Suspense } from "react";
import WizardClient from "./WizardClient";

export default function WizardPage() {
  return (
    <Suspense fallback={<div>Loading wizard...</div>}>
      <WizardClient />
    </Suspense>
  );
}
