/**
 * Block component contract (View layer).
 *
 * Every UI element must implement this lifecycle interface. Blocks read state
 * exclusively from the central Store and NEVER initiate network requests.
 */
import type { AppState } from "../store";

export interface Block {
  /** Unique string identifier for the block instance. */
  readonly id: string;

  /** Human-readable title displayed in the card header. */
  readonly title: string;

  /**
   * Mounts the HTML structure of the block into a given parent container.
   * Called once when inserting the block into a column layout.
   *
   * @param parentContainer - The DOM node (e.g., column wrapper) holding this block.
   */
  mount(parentContainer: HTMLElement): void;

  /**
   * Called whenever the central Store updates its state.
   * The component should efficiently update its internal DOM elements here.
   *
   * @param currentState - Read-only reference to the global application state.
   */
  update(currentState: Readonly<AppState>): void;

  /**
   * Cleans up all attached DOM elements, event listeners, and timers.
   * Must be called before removing a block or swapping layout columns.
   */
  destroy(): void;
}
