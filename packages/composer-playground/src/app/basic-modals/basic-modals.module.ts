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
import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { IdentityCardModule } from '../common/identity-card/identity-card.module';
import { BusyComponent } from './busy/busy.component';
import { DeleteComponent } from './delete-confirm/delete-confirm.component';
import { ErrorComponent } from './error/error.component';
import { ReplaceComponent } from './replace-confirm/replace-confirm.component';
import { SuccessComponent } from './success/success.component';
import { ConnectConfirmComponent } from './connect-confirm/connect-confirm.component';
import { AlertService } from './alert.service';
import { TestModule } from '../test/test.module';

@NgModule({
    imports: [CommonModule, NgbModule, IdentityCardModule, TestModule],
    entryComponents: [BusyComponent, DeleteComponent, ErrorComponent, ReplaceComponent, SuccessComponent, ConnectConfirmComponent],
    declarations: [BusyComponent, DeleteComponent, ErrorComponent, ReplaceComponent, SuccessComponent, ConnectConfirmComponent],
    providers: [AlertService],
    exports: [BusyComponent, DeleteComponent, ErrorComponent, ReplaceComponent, SuccessComponent]
})

export class BasicModalsModule {
}
