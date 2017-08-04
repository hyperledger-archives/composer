import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';

import { CheckOverFlowDirective } from './check-overflow/check-overflow.directive';
import { CheckScrollDirective } from './check-scroll/check-scroll.directive';
import { DebounceDirective } from './debounce/debounce.directive';
import { FocusHereDirective } from './focus-here/focus-here.directive';
import { ScrollToElementDirective } from './scroll/scroll-to-element.directive';

@NgModule({
    imports: [CommonModule],
    declarations: [CheckOverFlowDirective, CheckScrollDirective, DebounceDirective, FocusHereDirective, ScrollToElementDirective],
    providers: [],
    exports: [CheckOverFlowDirective, CheckScrollDirective, DebounceDirective, FocusHereDirective, ScrollToElementDirective]
})

export class DirectivesModule {
}
