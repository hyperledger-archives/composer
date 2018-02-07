/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
