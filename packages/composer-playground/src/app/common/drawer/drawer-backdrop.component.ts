import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output
} from '@angular/core';

import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

import { DrawerDismissReasons } from './drawer-dismiss-reasons';

@Component({
  selector: 'drawer-backdrop',
  template: '',
  styleUrls: ['./drawer-backdrop.component.scss'.toString()],
  animations: [
    trigger('slideOpenClosed', [
      state('open', style({
        opacity: 0.7
      })),
      state('closed', style({
        opacity: 0
      })),
      transition('* => open', animate('.3s ease-out')),
      transition('* => closed', animate('.2s ease-out'))
    ])
  ]
})
export class DrawerBackdropComponent {

  @HostBinding('class.closing')
  @Input()
  closing: boolean | string = false;

  @HostBinding('class') classes = 'open drawer-backdrop';

  @Output('dismissEvent') dismissEvent = new EventEmitter();

  @HostBinding('@slideOpenClosed')
  get isClosing() {
    return this.closing ? 'closed' : 'open';
  }

  constructor(private _elRef: ElementRef) {}

  @HostListener('click', ['$event.target'])
  backdropClick(target): void {
    if (this._elRef.nativeElement === target) {
      this.dismissEvent.emit(DrawerDismissReasons.BACKDROP_CLICK);
    }
  }
}
