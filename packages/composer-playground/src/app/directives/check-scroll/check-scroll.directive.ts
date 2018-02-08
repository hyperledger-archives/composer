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
import {
    Directive,
    ElementRef,
    EventEmitter,
    Output,
    Renderer
} from '@angular/core';

@Directive({
    selector: '[checkScroll]',
})

export class CheckScrollDirective {

    @Output()
    public hasScroll: EventEmitter<boolean> = new EventEmitter<boolean>();

    private _thing = null;
    private _expanded = false;

    constructor(private el: ElementRef, private renderer: Renderer) {
        renderer.listen(el.nativeElement, 'scroll', () => {
            this.checkScroll();
        });
    }

    checkScroll() {
        this.hasScroll.emit(this.el.nativeElement.scrollTop > 0);
    }
}
