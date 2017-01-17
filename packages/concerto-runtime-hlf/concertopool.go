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

// ConcertoPool holds a pool of Concerto objects.
type ConcertoPool struct {
	Pool chan *Concerto
}

// NewConcertoPool creates a new pool of Concerto objects.
func NewConcertoPool(max int) (result *ConcertoPool) {
	logger.Debug("Entering NewConcertoPool", max)
	defer func() { logger.Debug("Exiting NewChaincode", result) }()

	return &ConcertoPool{
		Pool: make(chan *Concerto, max),
	}
}

// Get returns an existing Concerto object from the pool, or creates a new one
// if no existing Concerto objects are available.
func (cp *ConcertoPool) Get() (result *Concerto) {
	logger.Debug("Entering ConcertoPool.Get")
	defer func() { logger.Debug("Exiting ConcertoPool.Get", result) }()

	select {
	case result = <-cp.Pool:
	default:
		result = NewConcerto()
	}
	return result
}

// Put stores an existing Concerto object in the pool, or discards it if the pool
// is currently at capacity.
func (cp *ConcertoPool) Put(concerto *Concerto) (result bool) {
	logger.Debug("Entering ConcertoPool.Put", concerto)
	defer func() { logger.Debug("Exiting ConcertoPool.Put", result) }()

	select {
	case cp.Pool <- concerto:
		return true
	default:
		return false
	}
}
