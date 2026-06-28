import { Suspense } from "react";
import AppointmentsPage from "./AppointmentsPage";

function Loading() {
  return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AppointmentsPage />
    </Suspense>
  );
}
