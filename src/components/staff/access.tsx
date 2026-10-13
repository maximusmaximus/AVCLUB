import { useState, type FormEvent } from "react";
import { grantAccess } from "@/lib/access";
import { Button, fieldClass } from "@/components/night/ui";

const ROLES = [
  { id: "door", label: "Door" },
  { id: "room", label: "Room" },
  { id: "floor", label: "Floor" },
] as const;

export function AccessGrants() {
  const [username, setUsername] = useState("");
  const [capability, setCapability] = useState<(typeof ROLES)[number]["id"]>("door");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
    try {
      const result = await grantAccess({ data: { username, capability } });
      setMessage(`@${result.username} can open ${result.capability}.`);
      setUsername("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't allow that.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold">Who can see what</h2>
      <p className="mt-1 text-sm text-muted">Door, room, and floor stay hidden until you allow a username in.</p>
      <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_9rem_auto]" onSubmit={onSubmit}>
        <label>
          <span className="sr-only">Username</span>
          <input
            className={fieldClass}
            value={username}
            placeholder="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={24}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
          />
        </label>
        <label>
          <span className="sr-only">View</span>
          <select
            className={fieldClass}
            value={capability}
            onChange={(e) => setCapability(e.target.value as (typeof ROLES)[number]["id"])}
          >
            {ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving" : "Allow"}
        </Button>
      </form>
      {message && <p className="mt-3 text-sm font-semibold">{message}</p>}
      {error && (
        <p className="mt-3 text-sm font-semibold text-accent" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
