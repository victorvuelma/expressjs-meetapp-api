import 'dotenv/config';

import * as Sentry from '@sentry/node';
import sentryConfig from './config/sentry';

import Queue from './lib/Queue';

Sentry.init({
  ...sentryConfig,
});
Queue.processQueue();
