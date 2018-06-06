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
