import Bee from 'bee-queue';

import * as Sentry from '@sentry/node';

import redisConfig from '../config/redis';
import SubscriptionOrganizerMail from '../app/job/SubscriptionOrganizerMail';

const jobs = [SubscriptionOrganizerMail];

class Queue {
  constructor() {
    this.queues = [];

    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  addJob(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];

      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  handleFailure(job, err) {
    console.error(`Queue ${job.queue.name}: FAILED`, err);

    Sentry.captureException(err);
  }
}

export default new Queue();
