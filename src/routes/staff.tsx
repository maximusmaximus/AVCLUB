import { createFileRoute } from "@tanstack/react-router";
import { StaffDesk } from "@/components/staff/desk";
import { staffDesk } from "@/lib/staff";

export const Route = createFileRoute("/staff")({
  loader: () => staffDesk(),
  component: StaffPage,
  head: () => ({
    meta: [{ title: "AVCLUB Staff" }],
  }),
});

function StaffPage() {
  const initial = Route.useLoaderData();
  return <StaffDesk initial={initial} />;
}
