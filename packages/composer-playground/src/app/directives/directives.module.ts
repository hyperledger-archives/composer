import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';

import { FileImporterComponent } from './file-importer.component';
import { FileDragDropDirective } from './file-drag-drop/file-drag-and-drop.directive';
import { CheckOverFlowDirective } from './check-overflow/check-overflow.directive';
import { DebounceDirective } from './debounce/debounce.directive';
import { FocusHereDirective } from './focus-here/focus-here.directive';
import { ScrollToElementDirective } from './scroll/scroll-to-element.directive';

@NgModule({
    imports: [CommonModule],
    declarations: [CheckOverFlowDirective, DebounceDirective, FocusHereDirective, ScrollToElementDirective],
    providers: [],
    exports: [CheckOverFlowDirective, DebounceDirective, FocusHereDirective, ScrollToElementDirective]
})

export class DirectivesModule {
}
