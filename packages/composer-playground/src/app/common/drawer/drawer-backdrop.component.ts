import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output
} from '@angular/core';

import { DrawerDismissReasons } from './drawer-dismiss-reasons';

@Component({
  selector: 'drawer-backdrop',
  template: '',
  styleUrls: ['./drawer-backdrop.component.scss'.toString()]
})
export class DrawerBackdropComponent {

  @HostBinding('class.closing')
  @Input()
  closing: boolean | string = false;

  @HostBinding('class.open')
  get isOpen() {
    return !this.closing;
  }

  @HostBinding('class.drawer-backdrop') true;

  @Output('dismissEvent') dismissEvent = new EventEmitter();

  constructor(private _elRef: ElementRef) {}

  @HostListener('click', ['$event.target'])
  backdropClick(target): void {
    if (this._elRef.nativeElement === target) {
      this.dismissEvent.emit(DrawerDismissReasons.BACKDROP_CLICK);
    }
  }
}
