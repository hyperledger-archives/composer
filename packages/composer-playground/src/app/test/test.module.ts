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
import { DirectivesModule } from '../directives/directives.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, CodemirrorModule, DirectivesModule, TestRoutingModule],
    entryComponents: [ResourceComponent, TransactionComponent],
    declarations: [RegistryComponent, ResourceComponent, TransactionComponent, TestComponent],
    providers: []
})

export class TestModule {
}
