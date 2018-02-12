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
    EventEmitter,
    ElementRef,
    OnInit,
    Directive,
    Input,
    Output
} from '@angular/core';
import { Observable } from 'rxjs';
import { NgModel } from '@angular/forms';

@Directive({
    selector: '[debounce]'
})
export class DebounceDirective implements OnInit {
    @Input() delay: number = 500;
    @Output() debounceFunc: EventEmitter<any> = new EventEmitter();

    constructor(private elementRef: ElementRef, private model: NgModel) {
    }

    ngOnInit(): void {
        const eventStream = Observable.fromEvent(this.elementRef.nativeElement, 'keyup')
            .map(() => {
                return this.model.value;
            })
            .debounceTime(this.delay);
        eventStream.subscribe((input) => this.debounceFunc.emit(input));
    }

}
