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
  Output,
  EventEmitter,
  Input,
  ElementRef,
  Renderer2,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostBinding,
  HostListener
} from '@angular/core';

import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

import { Observable } from 'rxjs/Rx';

import { DrawerDismissReasons } from './drawer-dismiss-reasons';

@Component({
  selector: 'drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.scss'.toString()],
  animations: [
    trigger('slideOpenClosed', [
      state('open', style({
        transform: 'translateX(0)'
      })),
      state('closed', style({
        transform: 'translateX(575px)'
      })),
      transition('* => open', animate('.3s cubic-bezier(.5, .8, 0, 1)')),
      transition('* => closed', animate('.2s cubic-bezier(.5, .8, 0, 1)'))
    ])
  ]
})
export class DrawerComponent implements OnInit,
    AfterViewInit, OnDestroy {

  @Input('closing')
  closing: boolean | string = false;

  @Input('keyboard')
  keyboard: boolean = true;

  @Input('drawerClass')
  drawerClass: string;

  @Output('dismissEvent') dismissEvent = new EventEmitter();

  @Output('closedEvent') closedEvent = new EventEmitter();

  @HostBinding() tabindex = '-1';

  @HostBinding('class')
  get getClasses() {
    return 'drawer' + (this.drawerClass ? ' ' + this.drawerClass : '');
  }

  @HostBinding('@slideOpenClosed')
  get isClosing() {
    return this.closing ? 'closed' : 'open';
  }

  private _elWithFocus: Element;  // element that is focused prior to modal opening

  private dismissReason;

  constructor(private _elRef: ElementRef, private _renderer: Renderer2) {}

  @HostListener('@slideOpenClosed.done', ['$event.toState'])
  onSlide(state) {
    if (state === 'closed') {
      this.closedEvent.emit();
    }
  }

  @HostListener('keyup.esc', ['$event'])
  escKey(event: Event): void {
    if (this.keyboard && !event.defaultPrevented) {
      this.dismiss(DrawerDismissReasons.ESC);
    }
  }

  dismiss(reason): void { this.dismissEvent.emit(reason); }

  ngOnInit() {
    this._elWithFocus = document.activeElement;
    this._renderer.addClass(document.body, 'drawer-open');
  }

  ngAfterViewInit() {
    if (!this._elRef.nativeElement.contains(document.activeElement)) {
      this._elRef.nativeElement['focus'].apply(this._elRef.nativeElement, []);
    }
  }

  ngOnDestroy() {
    if (this._elWithFocus && document.body.contains(this._elWithFocus)) {
      this._elWithFocus['focus'].apply(this._elWithFocus, []);
    } else {
      document.body['focus'].apply(document.body, []);
    }

    this._elWithFocus = null;
    this._renderer.removeClass(document.body, 'drawer-open');
  }
}
