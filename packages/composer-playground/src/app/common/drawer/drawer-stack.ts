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
import {
  ApplicationRef,
  Injectable,
  Injector,
  ReflectiveInjector,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  TemplateRef
} from '@angular/core';

import { ContentRef } from './content-ref';
import { DrawerBackdropComponent } from './drawer-backdrop.component';
import { DrawerComponent } from './drawer.component';
import { ActiveDrawer } from './active-drawer';
import { DrawerRef } from './drawer-ref';

@Injectable()
export class DrawerStack {
  private _backdropFactory: ComponentFactory<DrawerBackdropComponent>;
  private _drawerFactory: ComponentFactory<DrawerComponent>;

  constructor(
      private _applicationRef: ApplicationRef, private _injector: Injector,
      private _componentFactoryResolver: ComponentFactoryResolver) {
    this._backdropFactory = _componentFactoryResolver.resolveComponentFactory(DrawerBackdropComponent);
    this._drawerFactory = _componentFactoryResolver.resolveComponentFactory(DrawerComponent);
  }

  open(moduleCFR: ComponentFactoryResolver, contentInjector: Injector, content: any, options): DrawerRef {
    const containerSelector = options.container || 'body';
    const containerEl = document.querySelector(containerSelector);

    if (!containerEl) {
      throw new Error(`The specified drawer container "${containerSelector}" was not found in the DOM.`);
    }

    const activeDrawer = new ActiveDrawer();
    const contentRef = this._getContentRef(moduleCFR, contentInjector, content, activeDrawer);

    let drawerCmptRef: ComponentRef<DrawerComponent>;
    let backdropCmptRef: ComponentRef<DrawerBackdropComponent>;
    let drawerRef: DrawerRef;

    if (options.backdrop !== false) {
      backdropCmptRef = this._backdropFactory.create(this._injector);
      this._applicationRef.attachView(backdropCmptRef.hostView);
      containerEl.appendChild(backdropCmptRef.location.nativeElement);
    }
    drawerCmptRef = this._drawerFactory.create(this._injector, contentRef.nodes);
    this._applicationRef.attachView(drawerCmptRef.hostView);
    containerEl.appendChild(drawerCmptRef.location.nativeElement);

    drawerRef = new DrawerRef(drawerCmptRef, contentRef, backdropCmptRef);

    activeDrawer.close = (result: any) => { drawerRef.close(result); };
    activeDrawer.dismiss = (reason: any) => { drawerRef.dismiss(reason); };

    this.applyDrawerOptions(drawerCmptRef.instance, options);

    return drawerRef;
  }

  private applyDrawerOptions(drawerInstance: DrawerComponent, options: Object): void {
    ['keyboard', 'drawerClass'].forEach((optionName: string) => {
      if (this._isDefined(options[optionName])) {
        drawerInstance[optionName] = options[optionName];
      }
    });
  }

  private _getContentRef(
      moduleCFR: ComponentFactoryResolver, contentInjector: Injector, content: any,
      context: ActiveDrawer): ContentRef {
    if (!content) {
      return new ContentRef([]);
    } else if (content instanceof TemplateRef) {
      const viewRef = content.createEmbeddedView(context);
      this._applicationRef.attachView(viewRef);
      return new ContentRef([viewRef.rootNodes], viewRef);
    } else if (this._isString(content)) {
      return new ContentRef([[document.createTextNode(`${content}`)]]);
    } else {
      const contentCmptFactory = moduleCFR.resolveComponentFactory(content);
      const drawerContentInjector =
          ReflectiveInjector.resolveAndCreate([{provide: ActiveDrawer, useValue: context}], contentInjector);
      const componentRef = contentCmptFactory.create(drawerContentInjector);
      this._applicationRef.attachView(componentRef.hostView);
      return new ContentRef([[componentRef.location.nativeElement]], componentRef.hostView, componentRef);
    }
  }

  private _isString(value: any): value is string {
    return typeof value === 'string';
  }

  private _isDefined(value: any): boolean {
    return value !== undefined && value !== null;
  }
}
