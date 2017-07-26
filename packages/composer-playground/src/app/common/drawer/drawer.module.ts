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
