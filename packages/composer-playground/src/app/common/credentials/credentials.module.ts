import { NgModule }           from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { CredentialsComponent } from './credentials.component';
import { FileImporterModule } from '../file-importer/file-importer.module';

@NgModule({
    imports: [CommonModule, FormsModule, FileImporterModule],
    entryComponents: [],
    declarations: [CredentialsComponent],
    providers: [],
    exports: [CredentialsComponent]
})

export class CredentialsModule {
}
