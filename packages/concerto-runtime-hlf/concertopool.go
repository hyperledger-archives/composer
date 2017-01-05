/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
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
