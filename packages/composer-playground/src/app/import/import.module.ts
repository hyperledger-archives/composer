import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';

import { FileImporterModule } from '../common/file-importer/file-importer.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { UpdateComponent } from './update.component';
import { DeployComponent } from './deploy.component';
import { CredentialsModule } from '../common/credentials/credentials.module';

@NgModule({
    imports: [CommonModule, FormsModule, FileImporterModule, PerfectScrollbarModule, CredentialsModule],
    entryComponents: [DeployComponent, UpdateComponent],
    declarations: [DeployComponent, UpdateComponent],
    exports : [DeployComponent, UpdateComponent]
})

export class ImportModule {
}
