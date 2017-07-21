import {
  ViewRef,
  ComponentRef
} from '@angular/core';

export class ContentRef {
  constructor(public nodes: any[], public viewRef?: ViewRef, public componentRef?: ComponentRef<any>) {}
}
