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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CodemirrorModule } from 'ng2-codemirror';

import { TestComponent } from './test.component';
import { ResourceComponent } from './resource/resource.component';
import { TestRoutingModule } from './test-routing.module';
import { RegistryComponent } from './registry/registry.component';
import { TransactionComponent } from './transaction/transaction.component';
import { ViewTransactionComponent } from './view-transaction/view-transaction.component';
import { DirectivesModule } from '../directives/directives.module';
import { FooterModule } from '../footer/footer.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, CodemirrorModule, DirectivesModule, TestRoutingModule, FooterModule],
    entryComponents: [ResourceComponent, TransactionComponent, ViewTransactionComponent],
    declarations: [RegistryComponent, ResourceComponent, TransactionComponent, TestComponent, ViewTransactionComponent],
    providers: []
})

export class TestModule {
}
