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
import { Injectable } from '@angular/core';

/**
 * A reference to the active drawer. Instances of this class
 * can be injected into components passed as drawer content.
 */
@Injectable()
export class ActiveDrawer {
  /**
   * Can be used to close the drawer, passing an optional result.
   */
  close(result?: any): void {} // tslint:disable-line:no-empty

  /**
   * Can be used to dismiss the drawer, passing an optional reason.
   */
  dismiss(reason?: any): void {} // tslint:disable-line:no-empty
}
