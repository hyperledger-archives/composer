import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ConnectionProfileRoutingModule } from './connection-profile-routing.module';
import { ConnectionProfileComponent } from './connection-profile.component';
import { ConnectionProfileDataComponent } from './connection-profile-data/connection-profile-data.component';
import { AddCertificateComponent } from './add-certificate/add-certificate.component';
import { AddConnectionProfileComponent } from './add-connection-profile/add-connection-profile.component';
import { DeleteConnectionProfileComponent } from './delete-connection-profile/delete-connection-profile.component';
import { ViewCertificateComponent } from './view-certificate/view-certificate.component';
import { FileImporterModule } from '../common/file-importer/file-importer.module';
import { SwitchIdentityComponent } from '../test/switch-identity/switch-identity.component';
import { FooterModule } from '../footer/footer.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, ReactiveFormsModule, FileImporterModule, ConnectionProfileRoutingModule, FooterModule],
    entryComponents: [AddCertificateComponent, AddConnectionProfileComponent, DeleteConnectionProfileComponent, ViewCertificateComponent, SwitchIdentityComponent],
    declarations: [ConnectionProfileComponent, ConnectionProfileDataComponent, AddCertificateComponent, AddConnectionProfileComponent, DeleteConnectionProfileComponent, ViewCertificateComponent, SwitchIdentityComponent],
    providers: []
})

export class ConnectionProfileModule {
}
