import { useEffect, useState } from "react";
import { Button, fieldClass } from "@/components/night/ui";
import { createInvites, listInvites, revokeInvite } from "@/lib/invite-actions";
import { invitationText, ticketScopeLabel, type InviteTicket } from "@/lib/invites";

interface Invite {
  id: number;
  code: string;
  percent: number;
  ticket: InviteTicket;
  label: string;
  usedName: string | null;
  usedAt: string | null;
}

export function Invites() {
  const [rows, setRows] = useState<Invite[]>([]);
  const [percent, setPercent] = useState("100");
  const [label, setLabel] = useState("");
  const [count, setCount] = useState("1");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    const next = await listInvites();
    setRows(next);
  }

  useEffect(() => {
    void load().catch(() => setError("Couldn't load codes."));
  }, []);

  const sample = invitationText({ code: "AV-CODE", percent: 100, ticket: "deposit" });

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold">Grant Codes</h2>
      <p className="mt-1 text-sm text-muted">Unique codes. 100% covers the entry. A lower percent takes that much off. Each code works once.</p>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const pct = Number(percent);
          const howMany = Number(count);
          void (async () => {
            setPending(true);
            setError("");
            setNotice("");
            try {
              const made = await createInvites({ data: { percent: pct, ticket: "deposit", label, count: howMany } });
              setRows((current) => [...made, ...current].slice(0, 100));
              setLabel("");
              setNotice(made.length === 1 ? `Made ${made[0]?.code}.` : `Made ${made.length} codes.`);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Couldn't make that code.");
            } finally {
              setPending(false);
            }
          })();
        }}
      >
        <label className="block text-sm font-semibold">
          Guest
          <input className={`${fieldClass} mt-2`} value={label} maxLength={80} placeholder="Ada" onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          Percent off
          <input
            className={`${fieldClass} mt-2`}
            inputMode="numeric"
            value={percent}
            onChange={(e) => setPercent(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
          />
        </label>
        <label className="block text-sm font-semibold">
          How many
          <input
            className={`${fieldClass} mt-2`}
            inputMode="numeric"
            value={count}
            onChange={(e) => setCount(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
          />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Making" : "Make codes"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setPercent("100");
            }}
          >
            100% off
          </Button>
        </div>
      </form>
      {error && <p className="mt-3 text-sm font-semibold text-accent">{error}</p>}
      {notice && <p className="mt-3 text-sm font-semibold">{notice}</p>}

      <h3 className="mt-8 text-sm font-extrabold tracking-wide text-muted uppercase">Template</h3>
      <pre className="mt-2 overflow-x-auto rounded-xl bg-surface p-4 text-sm whitespace-pre-wrap text-fg shadow-border">{sample}</pre>

      <ul className="mt-4 divide-y divide-line rounded-xl bg-surface shadow-border">
        {rows.length === 0 && <li className="px-4 py-3 text-sm text-muted">No codes yet.</li>}
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold tracking-widest">{row.code}</span>
              <span className="block text-sm text-muted">
                {row.percent}% off · {ticketScopeLabel(row.ticket)}
                {row.label ? ` · ${row.label}` : ""}
                {row.usedAt ? ` · Used by ${row.usedName}` : " · Open"}
              </span>
            </span>
            {!row.usedAt && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const text = invitationText(row);
                    void navigator.clipboard.writeText(text).then(
                      () => setNotice(`Copied the Grant Code for ${row.code}.`),
                      () => setError("Couldn't copy. Select the template and copy it."),
                    );
                  }}
                >
                  Copy Grant Code
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    void (async () => {
                      setError("");
                      try {
                        await revokeInvite({ data: { id: row.id } });
                        setRows((current) => current.filter((item) => item.id !== row.id));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Couldn't remove that code.");
                      }
                    })();
                  }}
                >
                  Remove
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
