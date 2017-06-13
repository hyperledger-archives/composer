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

package main

// ComposerPool holds a pool of Composer objects.
type ComposerPool struct {
	Pool chan *Composer
}

// NewComposerPool creates a new pool of Composer objects.
func NewComposerPool(max int) (result *ComposerPool) {
	logger.Debug("Entering NewComposerPool", max)
	defer func() { logger.Debug("Exiting NewComposerPool", result) }()

	return &ComposerPool{
		Pool: make(chan *Composer, max),
	}
}

// Get returns an existing Composer object from the pool, or creates a new one
// if no existing Composer objects are available.
func (cp *ComposerPool) Get() (result *Composer) {
	logger.Debug("Entering ComposerPool.Get")
	defer func() { logger.Debug("Exiting ComposerPool.Get", result) }()

	select {
	case result = <-cp.Pool:
	default:
		result = NewComposer()
	}
	return result
}

// Put stores an existing Composer object in the pool, or discards it if the pool
// is currently at capacity.
func (cp *ComposerPool) Put(composer *Composer) (result bool) {
	logger.Debug("Entering ComposerPool.Put", composer)
	defer func() { logger.Debug("Exiting ComposerPool.Put", result) }()

	select {
	case cp.Pool <- composer:
		return true
	default:
		return false
	}
}
