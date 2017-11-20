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

// The version of this chaincode, the default pool size, and the
// default garbage collection interval. All three values are
// replaced as part of the deployment process; version is replaced
// with the npm package version, and PoolSize/GCInterval are
// replaced with defaults or user specified overrides.
const version = "development"
const PoolSize = 8
const GCInterval = 5
