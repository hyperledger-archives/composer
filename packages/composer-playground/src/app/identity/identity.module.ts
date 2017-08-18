import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { IdentityRoutingModule } from './identity-routing.module';
import { ConnectionProfileComponent } from './connection-profile.component';

import { FileImporterModule } from '../common/file-importer/file-importer.module';
import { IdentityIssuedComponent } from './identity-issued/identity-issued.component';
import { IssueIdentityComponent } from './issue-identity/issue-identity.component';
import { IdentityComponent } from './identity.component';
import { FooterModule } from '../footer/footer.module';

import { DrawerModule } from '../common/drawer';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, FileImporterModule, IdentityRoutingModule, FooterModule, DrawerModule],
    entryComponents: [IdentityIssuedComponent, IssueIdentityComponent],
    declarations: [IdentityIssuedComponent, IssueIdentityComponent, IdentityComponent],
    providers: [],
    exports: []
})

export class IdentityModule {
}
