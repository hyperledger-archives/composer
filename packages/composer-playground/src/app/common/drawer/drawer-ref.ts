/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Injectable, ComponentRef } from '@angular/core';

import { DrawerBackdropComponent } from './drawer-backdrop.component';
import { DrawerComponent } from './drawer.component';
import { ContentRef } from './content-ref';

/**
 * A reference to a newly opened drawer.
 */
@Injectable()
export class DrawerRef {
  /**
   * A promise that is resolved when a drawer is closed and rejected when a drawer is dismissed.
   */
  result: Promise<any>;

  private resolve: (result?: any) => void;
  private reject: (reason?: any) => void;

  /**
   * The instance of component used as drawer's content.
   * Undefined when a TemplateRef is used as drawer's content.
   */
  get componentInstance(): any {
    if (this.contentRef.componentRef) {
      return this.contentRef.componentRef.instance;
    }
  }

  // only needed to keep TS1.8 compatibility
  set componentInstance(instance: any) {} // tslint:disable-line:no-empty

  constructor(private drawerCmptRef: ComponentRef<DrawerComponent>, private contentRef: ContentRef, private backdropCmptRef?: ComponentRef<DrawerBackdropComponent>) {
    drawerCmptRef.instance.dismissEvent.subscribe((reason: any) => { this.dismiss(reason); });
    drawerCmptRef.instance.closedEvent.subscribe(() => { this.removeDrawerElements(); });
    if (backdropCmptRef) {
      backdropCmptRef.instance.dismissEvent.subscribe((reason: any) => { this.dismiss(reason); });
    }

    this.result = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    // tslint:disable-next-line:no-empty
    this.result.then(null, () => {});
  }

  /**
   * Can be used to close a drawer, passing an optional result.
   */
  close(result?: any): void {
    if (this.drawerCmptRef) {
      this.resolve(result);
      this.closeDrawer();
    }
  }

  /**
   * Can be used to dismiss a drawer, passing an optional reason.
   */
  dismiss(reason?: any): void {
    if (this.drawerCmptRef) {
      this.reject(reason);
      this.closeDrawer();
    }
  }

  private closeDrawer() {
    this.drawerCmptRef.instance.closing = true;
    if (this.backdropCmptRef) {
      this.backdropCmptRef.instance.closing = true;
    }
  }

  private removeDrawerElements() {
    const windowNativeEl = this.drawerCmptRef.location.nativeElement;
    windowNativeEl.parentNode.removeChild(windowNativeEl);
    this.drawerCmptRef.destroy();

    if (this.backdropCmptRef) {
      const backdropNativeEl = this.backdropCmptRef.location.nativeElement;
      backdropNativeEl.parentNode.removeChild(backdropNativeEl);
      this.backdropCmptRef.destroy();
    }

    if (this.contentRef && this.contentRef.viewRef) {
      this.contentRef.viewRef.destroy();
    }

    this.drawerCmptRef = null;
    this.contentRef = null;
  }
}
