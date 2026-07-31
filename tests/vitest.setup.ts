import "@testing-library/jest-dom/vitest";

// jsdom ships <dialog> without its modal methods, so any component that opens
// one throws on render. These keep the `open` attribute honest, which is what
// `getByRole("dialog")` and the close paths actually read.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.show ??= function show(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}
