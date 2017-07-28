import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ConnectionProfileComponent } from './connection-profile.component';
import { AddCertificateComponent } from './add-certificate/add-certificate.component';
import { AddConnectionProfileComponent } from './add-connection-profile/add-connection-profile.component';
import { ViewCertificateComponent } from './view-certificate/view-certificate.component';
import { FileImporterModule } from '../common/file-importer/file-importer.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, ReactiveFormsModule, FileImporterModule],
    entryComponents: [AddCertificateComponent, ViewCertificateComponent],
    declarations: [ConnectionProfileComponent, AddCertificateComponent, AddConnectionProfileComponent, ViewCertificateComponent],
    providers: [],
    exports: [ConnectionProfileComponent, AddConnectionProfileComponent]
})

export class ConnectionProfileModule {
}
