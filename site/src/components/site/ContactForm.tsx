"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          subject: fd.get("subject"),
          message: fd.get("message"),
          consent: fd.get("consent") === "on",
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setError(
        "Une erreur est survenue. Réessayez ou écrivez-nous directement à hello@ajpronos.fr.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="contact-form-success" role="status">
        <div className="contact-form-success-icon" aria-hidden="true">✓</div>
        <h3>Message envoyé.</h3>
        <p>
          On revient vers vous sous <strong>48h ouvrées</strong>. Pensez à
          vérifier vos spams si vous ne voyez pas notre réponse.
        </p>
        <button
          type="button"
          className="contact-form-reset"
          onClick={() => setStatus("idle")}
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form-row">
        <label className="contact-form-field">
          <span>Nom <em>*</em></span>
          <input
            type="text"
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="Votre nom"
          />
        </label>
        <label className="contact-form-field">
          <span>Email <em>*</em></span>
          <input
            type="email"
            name="email"
            required
            maxLength={120}
            autoComplete="email"
            placeholder="vous@exemple.fr"
          />
        </label>
      </div>

      <label className="contact-form-field">
        <span>Sujet <em>*</em></span>
        <select name="subject" required defaultValue="">
          <option value="" disabled>Choisir un sujet…</option>
          <option value="abonnement">Question sur l&apos;abonnement</option>
          <option value="support">Support technique</option>
          <option value="methode">Question sur la méthode</option>
          <option value="presse">Presse / Partenariat</option>
          <option value="autre">Autre</option>
        </select>
      </label>

      <label className="contact-form-field">
        <span>Message <em>*</em></span>
        <textarea
          name="message"
          required
          rows={6}
          minLength={10}
          maxLength={2000}
          placeholder="Décrivez votre demande en quelques lignes…"
        />
      </label>

      <label className="contact-form-consent">
        <input type="checkbox" name="consent" required />
        <span>
          J&apos;accepte que mes données soient utilisées pour traiter ma demande.{" "}
          <a href="/confidentialite">En savoir plus</a>.
        </span>
      </label>

      {error && (
        <p className="contact-form-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="contact-form-submit"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Envoi en cours…" : "Envoyer le message →"}
      </button>
    </form>
  );
}

export default ContactForm;
