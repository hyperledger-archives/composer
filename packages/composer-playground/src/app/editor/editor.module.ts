import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { CodemirrorModule } from 'ng2-codemirror';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { EditorComponent } from './editor.component';
import { EditorFileComponent } from './editor-file/editor-file.component';
import { EditorService } from './editor.service';
import { EditorRoutingModule } from './editor-routing.module';
import { AddFileComponent } from './add-file/add-file.component';
import { ImportComponent } from './import/import.component';
import { FileImporterModule } from '../file-importer/file-importer.module';
import { DirectivesModule } from '../directives/directives.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, PerfectScrollbarModule, CodemirrorModule, DirectivesModule, FileImporterModule, EditorRoutingModule],
    entryComponents: [AddFileComponent, ImportComponent],
    declarations: [EditorComponent, EditorFileComponent, AddFileComponent, ImportComponent],
    providers: [EditorService]
})

export class EditorModule {
}
