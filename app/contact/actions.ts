"use server";

import { site } from "@/lib/site";

// The contact form's Server Action (PLAN.md Step 34). Validates, then emails the message through
// Resend when RESEND_API_KEY is set (in .env.local, never sent to the browser). Without a key it
// only logs in development; in production it refuses, so a message is never silently lost.

export type ContactState = {
  status: "idle" | "sent" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "email" | "message", string>>;
  fields?: { name: string; email: string; message: string }; // refills the form after an error
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  // Honeypot: hidden from people, filled in by bots. Pretend it worked.
  if (String(form.get("website") ?? "")) return { status: "sent" };

  const fields = {
    name: String(form.get("name") ?? "").trim(),
    email: String(form.get("email") ?? "").trim(),
    message: String(form.get("message") ?? "").trim(),
  };
  const errors: ContactState["errors"] = {};
  if (!fields.name || fields.name.length > 100) errors.name = "Please enter your name (up to 100 characters).";
  if (!EMAIL.test(fields.email) || fields.email.length > 200) errors.email = "Please enter a valid email address.";
  if (fields.message.length < 10 || fields.message.length > 5000) errors.message = "Please write a message of 10 to 5000 characters.";
  if (Object.keys(errors).length) return { status: "error", errors, fields };

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.error("Contact form: RESEND_API_KEY is not set; message not sent.");
      return { status: "error", message: `Sending isn't set up yet. Please email ${site.email} directly.`, fields };
    }
    console.log("Contact form (dev, not sent):", fields);
    return { status: "sent" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Resend's shared sender works without a verified domain; set CONTACT_FROM once you have one.
        from: process.env.CONTACT_FROM ?? "Portfolio <onboarding@resend.dev>",
        to: process.env.CONTACT_TO ?? site.email,
        reply_to: fields.email,
        subject: `Portfolio message from ${fields.name}`,
        text: `${fields.message}\n\n— ${fields.name} <${fields.email}>`,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return { status: "sent" };
  } catch (e) {
    console.error("Contact form: send failed.", e);
    return { status: "error", message: `Something went wrong sending that. Please try again, or email ${site.email}.`, fields };
  }
}
