import { Injectable, Injector, ComponentFactoryResolver } from '@angular/core';

import { DrawerOptions } from './drawer-options';
import { DrawerRef } from './drawer-ref';
import { DrawerStack } from './drawer-stack';

/**
 * A service to open drawers.
 *
 * Creating a drawer is the same as creating a modal: create a template and pass it as an argument to
 * the "open" method!
 *
 * See https://ng-bootstrap.github.io/#/components/modal for details.
 */
@Injectable()
export class DrawerService {
  constructor(
      private _moduleCFR: ComponentFactoryResolver, private _injector: Injector, private _drawerStack: DrawerStack) {}

  /**
   * Opens a new drawer with the specified content and using supplied options. Content can be provided
   * as a TemplateRef or a component type. If you pass a component type as content than instances of those
   * components can be injected with an instance of the ActiveDrawer class. You can use methods on the
   * ActiveDrawer class to close / dismiss drawers from "inside" of a component.
   */
  open(content: any, options: DrawerOptions = {}): DrawerRef {
    return this._drawerStack.open(this._moduleCFR, this._injector, content, options);
  }
}
