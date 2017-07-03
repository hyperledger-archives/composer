import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { BusyComponent } from './busy/busy.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { DeleteComponent } from './delete-confirm/delete-confirm.component';
import { ErrorComponent } from './error/error.component';
import { ReplaceComponent } from './replace-confirm/replace-confirm.component';
import { SuccessComponent } from './success/success.component';
import { AlertService } from './alert.service';

@NgModule({
    imports: [CommonModule, NgbModule],
    entryComponents: [BusyComponent, ConfirmComponent, DeleteComponent, ErrorComponent, ReplaceComponent, SuccessComponent],
    declarations: [BusyComponent, ConfirmComponent, DeleteComponent, ErrorComponent, ReplaceComponent, SuccessComponent],
    providers: [AlertService],
    exports: [BusyComponent, ConfirmComponent, DeleteComponent, ErrorComponent, ReplaceComponent, SuccessComponent]
})

export class BasicModalsModule {
}
