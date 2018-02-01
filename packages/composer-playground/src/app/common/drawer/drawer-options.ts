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
/**
 * Represent options available when opening new drawers.
 */
export interface DrawerOptions {
  /**
   * Whether a backdrop element should be created for a given drawer (true by default).
   * Alternatively, specify 'static' for a backdrop which doesn't close the drawer on click.
   */
  backdrop?: boolean | 'static';

  /**
   * An element to which to attach newly opened drawer windows.
   */
  container?: string;

  /**
   * Whether to close the drawer when escape key is pressed (true by default).
   */
  keyboard?: boolean;

  /**
   * Custom class to append to the drawer window
   */
  drawerClass?: string;
}
