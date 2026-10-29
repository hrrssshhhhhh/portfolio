"use client";

import { useActionState, useEffect } from "react";
import { sendMessage, type ContactState } from "@/app/contact/actions";
import { bitChord } from "@/components/game/audio";
import { RingIcon } from "@/components/icons";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky";
const field = `mt-2 w-full border-2 border-line bg-night-2 px-4 py-3 text-foreground placeholder:text-haze/60 transition-colors duration-200 hover:border-(--bit)/60 focus:border-(--bit) aria-invalid:border-sakura ${focusRing}`;

// The contact form (PLAN.md Step 35): Sending… / sent / error states, typed text kept after an
// error, and on success a gold ring burst with the data-bit chord (when sound is on).
export default function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, { status: "idle" });
  const sent = state.status === "sent";
  const err = state.errors ?? {};

  useEffect(() => {
    if (sent) bitChord(4);
  }, [sent]);

  return (
    <form action={action} noValidate className="max-w-xl">
      {/* Honeypot for bots; people never see or reach it. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block font-semibold">
          Name
          <input name="name" autoComplete="name" defaultValue={state.fields?.name} aria-invalid={!!err.name} aria-describedby="name-error" className={field} />
          {err.name && <span id="name-error" className="mt-1 block text-sm font-normal text-sakura">{err.name}</span>}
        </label>
        <label className="block font-semibold">
          Email
          <input name="email" type="email" autoComplete="email" defaultValue={state.fields?.email} aria-invalid={!!err.email} aria-describedby="email-error" className={field} />
          {err.email && <span id="email-error" className="mt-1 block text-sm font-normal text-sakura">{err.email}</span>}
        </label>
      </div>
      <label className="mt-5 block font-semibold">
        Message
        <textarea name="message" rows={5} defaultValue={state.fields?.message} aria-invalid={!!err.message} aria-describedby="message-error" className={`${field} resize-y`} />
        {err.message && <span id="message-error" className="mt-1 block text-sm font-normal text-sakura">{err.message}</span>}
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex min-h-14 items-center gap-3 border-2 border-night bg-(--bit) px-6 font-bold text-night shadow-[5px_5px_0_var(--color-white)] transition-[box-shadow,translate] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-white)] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none disabled:cursor-wait disabled:opacity-70 ${focusRing}`}
        >
          {pending ? "Sending…" : "Send message"}
        </button>

        <p aria-live="polite" className="min-h-6">
          {sent && (
            <span key={state.status} className="relative inline-flex animate-pop items-center gap-2 font-semibold text-sun">
              <span aria-hidden className="relative grid place-items-center">
                <RingIcon className="size-6" />
                <span className="absolute size-6 rounded-full border-2 border-sun motion-safe:animate-burst" />
              </span>
              Message delivered!
            </span>
          )}
          {state.status === "error" && state.message && <span className="text-sakura">{state.message}</span>}
        </p>
      </div>
    </form>
  );
}
