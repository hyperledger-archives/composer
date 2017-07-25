/**
 * Represent options available when opening new drawers.
 */
export interface DrawerOptions {
  /**
   * Whether a backdrop element should be created for a given drawer (true by default).
   * Alternatively, specify 'static' for a backdrop which doesn't close the drawer on click.
   */
  backdrop?: boolean | 'static';

  /**
   * An element to which to attach newly opened drawer windows.
   */
  container?: string;

  /**
   * Whether to close the drawer when escape key is pressed (true by default).
   */
  keyboard?: boolean;

  /**
   * Custom class to append to the drawer window
   */
  drawerClass?: string;
}
