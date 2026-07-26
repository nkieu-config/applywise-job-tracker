// Shared Tailwind classes for form fields, so every form stays consistent.
export const inputClass =
  "rounded-sm border border-field-border bg-canvas px-3 py-2.5 text-body-lg font-normal text-ink outline-none focus:border-primary-ink focus:ring-1 focus:ring-primary-ink transition-colors";

export const labelClass =
  "flex flex-col gap-1.5 text-body-lg font-medium text-ink";

// A <label> that wraps its input lends the input its whole text content as an
// accessible name — so a hint, an error, a "Forgot?" link or a show-password
// button inside it all end up read out as part of the field's name. Where a
// field carries any of those, use these instead and associate explicitly.
export const fieldClass = "flex flex-col gap-1.5";
export const fieldLabelClass = "text-body-lg font-medium text-ink";
