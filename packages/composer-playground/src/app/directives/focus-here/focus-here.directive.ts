import { Directive, ElementRef } from '@angular/core';

@Directive({
    selector: '[focusHere]',
})

export class FocusHereDirective {

    constructor(private el: ElementRef) {
        let element = this.el;
        setTimeout(() => {
            element.nativeElement.focus();

        }, 0);
    }
}
