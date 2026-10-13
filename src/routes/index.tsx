import { createFileRoute } from "@tanstack/react-router";
import { ClosedDoor } from "@/components/hold/closed";
import { StaffTab } from "@/components/hold/staff-tab";
import { NightApp } from "@/components/night/shell";
import { getSiteMode } from "@/lib/staff";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      return await getSiteMode();
    } catch {
      return { live: false };
    }
  },
  component: Home,
  head: ({ loaderData }) => ({
    meta: [
      { title: "AVCLUB" },
      {
        name: "description",
        content: loaderData?.live
          ? "Share Ideas and Build."
          : "Share Ideas and Build. The door isn't open yet.",
      },
    ],
  }),
});

function Home() {
  const { live } = Route.useLoaderData();
  return (
    <>
      {live ? <NightApp staffDock /> : <ClosedDoor />}
      <StaffTab dock={live} />
    </>
  );
}
