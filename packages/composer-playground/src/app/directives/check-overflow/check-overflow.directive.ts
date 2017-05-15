import { Directive, ElementRef, EventEmitter, Output, Input } from '@angular/core';

@Directive({
    selector: '[checkOverFlow]',
})

export class CheckOverFlowDirective {

    @Output()
    public hasOverFlow: EventEmitter<boolean> = new EventEmitter<boolean>();

    @Input()
    set changed(changed) {
        this._thing = changed;
        if (this._thing) {
            this.checkOverFlow();
        }
    }

    private _thing = null;

    constructor(private el: ElementRef) {
    }

    checkOverFlow() {
        let element = this.el;
        setTimeout(() => {
            let overFlowAmount = element.nativeElement.scrollHeight - element.nativeElement.offsetHeight;
            if (overFlowAmount > 10) {
                this.hasOverFlow.emit(true);
            } else {
                this.hasOverFlow.emit(false);
            }
        }, 0);
    }
}
