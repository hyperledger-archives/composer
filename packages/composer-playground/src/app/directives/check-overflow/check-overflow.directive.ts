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
    Input,
    Renderer,
    ContentChild,
    AfterViewInit
} from '@angular/core';

@Directive({
    selector: '[checkOverFlow]',
})

export class CheckOverFlowDirective implements AfterViewInit {

    @Output()
    public hasOverFlow: EventEmitter<boolean> = new EventEmitter<boolean>();

    @Input()
    set changed(changed) {
        this._thing = changed;
        if (this._thing) {
            this.checkOverFlow();
        }
    }

    @Input()
    set expanded(expanded) {
        this._expanded = expanded;
        this.checkOverFlow();
    }

    @ContentChild('resourcedata') preEl: ElementRef;

    private _thing = null;
    private _expanded = false;

    constructor(private el: ElementRef, private renderer: Renderer) {
    }

    ngAfterViewInit() {
        this.checkOverFlow();
    }

    checkOverFlow() {
        let element = this.el;
        let preElement = this.preEl;

        if (!preElement) {
            return;
        }

        let expanded = this._expanded;

        setTimeout(() => {

            if (expanded) {
                let contentHeight = preElement.nativeElement.scrollHeight;
                this.renderer.setElementStyle(preElement.nativeElement, 'maxHeight', contentHeight + 'px');
            } else {
                this.renderer.setElementStyle(preElement.nativeElement, 'maxHeight', '100px');
            }

            let scrollHeight = preElement.nativeElement.scrollHeight;

            if (expanded || scrollHeight > 110) {
                this.hasOverFlow.emit(true);
            } else {
                this.hasOverFlow.emit(false);
            }
        }, 0);
    }
}
