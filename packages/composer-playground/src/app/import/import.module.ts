import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';

import { ImportComponent } from './import.component';
import { FileImporterModule } from '../common/file-importer/file-importer.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';

@NgModule({
    imports: [CommonModule, FormsModule, FileImporterModule, PerfectScrollbarModule],
    entryComponents: [ImportComponent],
    declarations: [ImportComponent],
    exports : [ImportComponent]
})

export class ImportModule {
}
