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
    Input,
    Renderer,
    ContentChildren,
    AfterContentInit,
    QueryList
} from '@angular/core';

@Directive({
    selector: '[scroll-to-element]',
})

export class ScrollToElementDirective implements AfterContentInit {

    @Input()
    set elementId(elementId) {
        this._thing = elementId;
        if (this._thing && this.initialised) {
            this.performScrollAction();
        }
    }

    @ContentChildren('editorFileList') items: QueryList<ElementRef>;

    private _thing = null;
    private initialised = false;

    constructor(private el: ElementRef, private renderer: Renderer) {
    }

    ngAfterContentInit() {
        this.initialised = true;
    }

    performScrollAction() {
        let element = this.el;
        let selectedItem = this.retreiveSelectedItem();
        if (selectedItem && selectedItem.length > 0) {
            let parentOffset = element.nativeElement.offsetTop;
            let selectOffset = selectedItem[0].nativeElement.offsetTop;

            let endScrollTop = selectOffset - parentOffset - 10;
            let startScrollTop = element.nativeElement.scrollTop;
            let scrollDiff = startScrollTop - endScrollTop;

            let steps = 100; let timer = 0; let slow = 4;
            let step = scrollDiff / steps;
            let stepTarget = startScrollTop - step;
            while (steps > 0) {
                this.stepVerticalScoll(stepTarget, slow * timer);
                timer++; // slow on approach to target
                steps--; // while condition
                stepTarget -= step;
                // Prevent overshoot
                if ( this.isOvershoot(scrollDiff, endScrollTop, stepTarget) ) {
                    steps = 0;
                }
                // Final adjust
                if (steps === 0) {
                    this.stepVerticalScoll(endScrollTop, slow * timer);
                }
            }
        }
    }

    isOvershoot(scrollDiff, endScrollTop, stepTarget) {
        if (scrollDiff < 0) {
            return stepTarget > endScrollTop;
        } else {
            return stepTarget < endScrollTop;
        }
    }

    retreiveSelectedItem() {
        return this.items.filter( (item) => { return item.nativeElement.id === this._thing; });
    }

    stepVerticalScoll(yLocation, duration) {
        setTimeout(() => {
                this.renderer.setElementProperty(this.el.nativeElement, 'scrollTop', yLocation);
            }, duration);
    }
}
