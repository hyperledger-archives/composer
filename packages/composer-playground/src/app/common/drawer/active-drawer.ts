import { Injectable } from '@angular/core';

/**
 * A reference to the active drawer. Instances of this class
 * can be injected into components passed as drawer content.
 */
@Injectable()
export class ActiveDrawer {
  /**
   * Can be used to close the drawer, passing an optional result.
   */
  close(result?: any): void {} // tslint:disable-line:no-empty

  /**
   * Can be used to dismiss the drawer, passing an optional reason.
   */
  dismiss(reason?: any): void {} // tslint:disable-line:no-empty
}
