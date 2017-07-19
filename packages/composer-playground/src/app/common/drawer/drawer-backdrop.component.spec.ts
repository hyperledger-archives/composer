import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DrawerBackdropComponent } from './drawer-backdrop.component';
import { DrawerDismissReasons } from './drawer-dismiss-reasons';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

describe('DrawerBackdropComponent', () => {
  let sandbox;
  let fixture: ComponentFixture<DrawerBackdropComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DrawerBackdropComponent],
      imports: [NoopAnimationsModule]
    });

    fixture = TestBed.createComponent(DrawerBackdropComponent);
  });

  it('should render backdrop with required CSS classes', () => {
    fixture.detectChanges();

    fixture.nativeElement.classList.contains('drawer-backdrop').should.be.true;
  });

  it('should produce a dismiss event on backdrop click', (done) => {
    fixture.detectChanges();

    fixture.componentInstance.dismissEvent.subscribe(($event) => {
      try {
        $event.should.equal(DrawerDismissReasons.BACKDROP_CLICK);
      } catch (e) {
        done.fail(e);
      }
      done();
    });

    fixture.nativeElement.click();
  });

  it('should not produce a dismiss event when click is not on backdrop', (done) => {
    fixture.detectChanges();

    fixture.componentInstance.dismissEvent.subscribe(($event) => {
      done.fail(new Error('Should not trigger dismiss event'));
    });

    let childEl = document.createElement('div');
    fixture.nativeElement.appendChild(childEl);
    childEl.click();

    setTimeout(done, 200);
  });
});
