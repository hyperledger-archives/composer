import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
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
