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

 // From: https://gitlab.com/dominicp/node-job-queue/blob/master/test/job-queue.js

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const JobQueue = require('../../../lib/introspect/loaders/jobqueue');

const expect = chai.expect;
require('chai').should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

// How long should the test job runner take to run
const testJobTime = 200;

// Helper function to wait in a Promise chain
const delay = t => new Promise((resolve) => {

    setTimeout(resolve, t);
});

/**
 * Setup a simple test queue
 */
class TestJobQueue extends JobQueue {

    /**
     * Run a job
     * @param {*} job the job data
     * @returns {Promise} a promise to the result
     */
    runJob(job) {

        // If the job is a function call it and return the result (we assume it will return a Promise)
        if (typeof job === 'function') { return job(); }

        // If we have an error, reject now, allow us to simulate a job error
        if (this.jobError) { return Promise.reject(this.jobError); }

        // Otherwise, just delay and then resolve
        return delay(testJobTime);
    }
}

describe('JobQueue', function () {

    describe('Events', function () {

        let spy;
        let testJobs;

        beforeEach(function () {

            spy = sinon.spy();
            testJobs = new TestJobQueue();
        });

        afterEach(function () {

            spy = false;
            testJobs = false;
        });

        it('should throw if JobQueue is not subclassed', function () {

            const jobQueue = new JobQueue();
            jobQueue.on('jobAdd', spy);

            (() => {
                jobQueue.addJob('test job');
            }).should.throw(/runJob method must be subclassed/);
        });

        it('should emit an event when a job is added.', function () {

            testJobs.on('jobAdd', spy);

            testJobs.addJob('test job');

            expect(spy).to.have.been.calledWith('test job', ['test job']);
        });

        it('should emit an event when a job starts.', function () {

            testJobs.on('jobStart', spy);

            testJobs.addJob('test job');

            expect(spy).to.have.been.calledWith('test job', ['test job']);
        });

        it('should emit an event when a job finishes.', function (done) {

            testJobs.on('jobFinish', spy);

            testJobs.addJob('test job');

            setTimeout(() => {

                expect(spy).to.have.been.calledWith('test job', []);
                done();

            }, testJobTime + 10);
        });

        it('should emit an event when a job is removed.', function () {

            testJobs.on('jobRemove', spy);

            testJobs.addJob('test job');

            testJobs.deleteJob(0);

            expect(spy).to.have.been.calledWith([]);
        });

        it('should emit an event on job errors.', function (done) {

            testJobs.jobError = new Error('Test error.');

            testJobs.on('queueError', spy);

            testJobs.addJob('test job');

            // Wrap in setTimeout to give the Promise time to reject
            setTimeout(() => {

                expect(spy).to.have.been.calledWith(testJobs.jobError);
                done();

            }, 20);
        });
    });

    describe('Basic Operation', function () {

        it('should run all jobs in the queue in order.', function () {

            // We use a longer delay in the earlier jobs to make sure the later ones wait
            const spy1 = sinon.spy(() => delay(20));
            const spy2 = sinon.spy(() => delay(10));
            const spy3 = sinon.spy(() => delay(5));

            const testJobs = new TestJobQueue();

            testJobs.addJob(spy1);
            testJobs.addJob(spy2);
            testJobs.addJob(spy3);

            // Delay to allow for jobs to complete
            return delay(100).then(() => sinon.assert.callOrder(spy1, spy2, spy3));
        });

        it('should wait for the startDelay before starting to run jobs', function () {

            const startDelay = 300;

            const testJobs = new TestJobQueue(startDelay);

            testJobs.addJob('test job');

            return Promise.all([
                expect(delay(startDelay - 10).then(() => testJobs.jobRunning)).to.eventually.be.false,
                expect(delay(startDelay + 10).then(() => testJobs.jobRunning)).to.eventually.be.true
            ]);
        });

        it('should not delay after the first job if no delay is given.', function () {

            const startDelay = 200;

            const testJobs = new TestJobQueue(startDelay);

            testJobs.addJob('test job 1');
            testJobs.addJob('test job 2');

            return Promise.all([
                expect(delay(startDelay + testJobTime + 10).then(() => testJobs.getQueue())).to.eventually.have.lengthOf(1),

                expect(delay(startDelay + testJobTime + 10).then(() => testJobs.getQueue()[0])).to.eventually.equal('test job 2')
            ]);
        });

        it('should wait for the jobDelay in between jobs.', function () {

            const jobDelay = 80;

            const testJobs = new TestJobQueue(0, jobDelay);

            testJobs.addJob('test job 1');
            testJobs.addJob('test job 2');

            return Promise.all([
                expect(delay(testJobTime + (jobDelay / 2)).then(() => testJobs.jobRunning)).to.eventually.be.false,
                expect(delay(testJobTime + (jobDelay / 2)).then(() => testJobs.getQueue()[0])).to.eventually.equal('test job 2'),
                expect(delay(testJobTime + jobDelay + 10).then(() => testJobs.jobRunning)).to.eventually.be.true,
            ]);
        });
    });
});