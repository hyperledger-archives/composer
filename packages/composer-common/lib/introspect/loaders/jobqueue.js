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

 // From: https://gitlab.com/dominicp/node-job-queue/blob/master/node-job-queue.js

'use strict';

const EventEmitter = require('events');

/**
 * A class to facilitate adding jobs to a queue and running them.
 * @private
 */
class JobQueue extends EventEmitter {

    /**
     * Setup class properties.
     *
     * @param {int} startDelay How long after a job is added should we want before
     *                       starting to process jobs in the queue.
     * @param {int} jobDelay   Once we are running jobs, how long should we wait
     *                       between each job in the queue.
     */
    constructor(startDelay = 0, jobDelay = 0) {

        // Call the EventEmitter constructor
        super();

        // Store the arguments as class properties
        this.startDelay = startDelay;

        this.jobDelay = jobDelay;

        // Setup the job queue
        this.jobs = [];

        // Setup a timer to use for startDelay
        this.timer = false;

        // Setup a switch to let us know if a synchronous job is running
        this.jobRunning = false;
    }

    /**
     * Add a job to the queue. After the job is added, we process the queue.
     *
     * @param {mixed} job This can be anything that your runJob method expects.
     */
    addJob(job) {

        // Add the job
        this.jobs.push(job);

        // Emit an event
        this.emit('jobAdd', job, this.jobs);

        // If we have a startDelay and the queue was empty, hurry up and wait
        if (this.startDelay && this.jobs.length < 2) {

            this.timer = setTimeout(() => this.processQueue(true), this.startDelay);

        } else {

            this.processQueue();
        }
    }

    /**
     * Remove a job from the queue. Continues processing the queue when finished.
     *
     * @param {int} index The array index of the job to remove in this.jobs
     */
    deleteJob(index) {

        if (! this.jobs[index]) {

            this.emit('queueError',
                new Error('Attempted to delete job that cannot be found: ' + index),
                this.jobs
            );

        } else {

            // Remove the job from the queue
            this.jobs.splice(index, 1);

            this.emit('jobRemove', this.jobs);
        }
    }

    /**
     * Run the next job in the queue.
     *
     * @param {bool} resetTimer If true we set the class timer to false.
     */
    processQueue(resetTimer) {

        // If we were asked to, clear the global timer
        if (resetTimer) { this.timer = false; }

        // If the queue is empty, we're done
        if (this.jobs.length < 1) { return; }

        // If a job is running, or we are waiting on a startDelay, just retry later
        if (this.jobRunning || this.timer) {

            setTimeout(() => this.processQueue(), 500);
            return;
        }

        const nextJob = this.jobs.findIndex(job => !! job);

        // Define a function to run when the sync is complete
        const finished = () => {

            // Reset the switch
            this.jobRunning = false;

            // Save a copy of the finished job before we remove it for the event
            const finishedJob = this.jobs[nextJob];

            // Remove the job from the queue
            this.deleteJob(nextJob);

            this.emit('jobFinish', finishedJob, this.jobs);

            // Run the next job
            this.timer = setTimeout(() => { this.processQueue(true); }, this.jobDelay);
        };

        this.jobRunning = true;

        this.emit('jobStart', this.jobs[nextJob], this.jobs);

        // Get the first job in the queue and run it
        this.runJob(this.jobs[nextJob])
            .then(finished)
            .catch((error) => {

                // Emit the error
                this.emit('queueError', error, this.jobs);

                // Still call the finished handler
                finished();
            });
    }

    /**
     * Simpler getter for the job queue. Since this.jobs should be private
     * access we provide this getter.
     *
     * @return {array} The current queue of jobs to run
     */
    getQueue() {

        return this.jobs;
    }

    /**
     * Abstract method: must be overriden.
     * @param {any} job - data for the job
     * @abstract
     */
    runJob(job) {
        throw new Error('runJob method must be subclassed.');
    }
}

module.exports = JobQueue;