import { useEffect, useState } from "react";
import { Button } from "@/components/night/ui";
import { approveGrantApplication, declineGrantApplication, listGrantApplications } from "@/lib/grants";

type Row = Awaited<ReturnType<typeof listGrantApplications>>[number];

export function GrantDesk() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  async function refresh() {
    const next = await listGrantApplications();
    setRows(next);
  }

  useEffect(() => {
    void refresh().catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Couldn't load grants."));
  }, []);

  async function approve(id: number) {
    setError("");
    setBusy(id);
    try {
      const result = await approveGrantApplication({ data: { id } });
      await refresh();
      if (!result.emailed) setError(`Code ${result.code} is saved. The email is queued until Gmail can send.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't approve that.");
    } finally {
      setBusy(null);
    }
  }

  async function decline(id: number) {
    setError("");
    setBusy(id);
    try {
      await declineGrantApplication({ data: { id } });
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't decline that.");
    } finally {
      setBusy(null);
    }
  }

  const waiting = rows.filter((row) => row.status === "pending").length;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold">Grant tickets</h2>
      <p className="mt-1 text-sm text-muted">
        {waiting === 0 ? "No applications waiting." : `${waiting} waiting.`} Approving makes a Grant Code and emails it. Every address stays on this list.
      </p>
      {error && (
        <p className="mt-3 text-sm font-semibold text-accent" role="alert">
          {error}
        </p>
      )}
      {rows.length > 0 && (
        <ul className="mt-3 divide-y divide-line rounded-xl bg-surface shadow-border">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{row.name}</p>
                  <p className="truncate text-sm text-muted">{row.email}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold capitalize text-muted">{row.status}</span>
              </div>
              <p className="mt-2 text-sm text-pretty">{row.work}</p>
              {row.code && <p className="mt-2 text-sm font-extrabold tracking-widest">{row.code}</p>}
              {row.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button disabled={busy === row.id} onClick={() => void approve(row.id)}>
                    {busy === row.id ? "Saving" : "Approve"}
                  </Button>
                  <Button variant="ghost" disabled={busy === row.id} onClick={() => void decline(row.id)}>
                    Decline
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
