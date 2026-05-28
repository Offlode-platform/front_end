import { Suspense } from "react";
import { SchedulePageView } from "@/features/schedule/schedule-page-view";

export default function SchedulePage() {
  return (
    <Suspense>
      <SchedulePageView />
    </Suspense>
  );
}
