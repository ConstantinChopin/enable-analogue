"use client";
/**
 * The toast: the attention model's confirmation away from where you acted, and its
 * notification for what arrives while you are elsewhere (VIS-097).
 *
 * Used for exactly three things:
 *   - an act whose result is not visible where you acted (a sheet closed, the result
 *     lives on another page): "Shared with the Paris desk".
 *   - an act that can be undone: the toast carries Undo for as long as it shows.
 *   - something that arrived while you were elsewhere (a supplier replied): once, with
 *     the way to it, and kept in the inbox as well.
 * Never for an error you must act on (that is a Blocker, on the object), and never as
 * the only record of anything: the lasting record lives on the object.
 *
 * It sits just above the dock, lasts about seven seconds, pauses while the pointer is
 * on it, and is announced politely (sonner renders it as a status region). With both a
 * way to the result and Undo, the way to the result is the button and Undo sits beside
 * it as the quieter one.
 */
import { toast } from "sonner";

export interface NotifyOptions {
  /** A second line: what changed, or where. */
  detail?: string;
  /** Reverses the act. Shown as "Undo" while the toast is up. */
  undo?: () => void;
  /** Where the result is: "Open the trip". */
  action?: { label: string; onClick: () => void };
  /** Seconds on screen. */
  seconds?: number;
}

export function notify(message: string, opts: NotifyOptions = {}) {
  const { detail, undo, action, seconds = 7 } = opts;
  const undoButton = undo
    ? { label: "Undo", onClick: () => { undo(); toast("Undone", { duration: 2500 }); } }
    : undefined;
  return toast(message, {
    description: detail,
    /* the primary button: the way to the result, or Undo when there is nowhere to go */
    action: action ? { label: action.label, onClick: action.onClick } : undoButton,
    /* the quieter one: Undo, when the primary is taken by the way to the result */
    cancel: action ? undoButton : undefined,
    duration: seconds * 1000,
  });
}
