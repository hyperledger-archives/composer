import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';

import { FileImporterComponent } from './file-importer.component';
import { FileDragDropDirective } from './file-drag-drop/file-drag-and-drop.directive';

@NgModule({
    imports: [CommonModule],
    declarations: [FileImporterComponent, FileDragDropDirective],
    providers: [],
    exports: [FileImporterComponent, FileDragDropDirective]
})

export class FileImporterModule {
}
