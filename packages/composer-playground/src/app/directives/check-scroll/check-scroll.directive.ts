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
