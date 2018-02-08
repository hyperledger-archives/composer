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
import { NgModule, ModuleWithProviders } from '@angular/core';

import { DrawerBackdropComponent } from './drawer-backdrop.component';
import { DrawerComponent } from './drawer.component';
import { DrawerStack } from './drawer-stack';
import { DrawerService } from './drawer.service';

export { DrawerService } from './drawer.service';
export { DrawerOptions } from './drawer-options';
export { DrawerRef } from './drawer-ref';
export { ActiveDrawer } from './active-drawer';
export { DrawerDismissReasons } from './drawer-dismiss-reasons';

@NgModule({
  declarations: [DrawerBackdropComponent, DrawerComponent],
  entryComponents: [DrawerBackdropComponent, DrawerComponent],
  providers: [DrawerService]
})
export class DrawerModule {
  static forRoot(): ModuleWithProviders { return {ngModule: DrawerModule, providers: [DrawerService, DrawerStack]}; }
}
