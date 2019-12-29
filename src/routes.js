import { Router } from 'express';
import multer from 'multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import OrganizingController from './app/controllers/OrganizingController';
import SubscriptionController from './app/controllers/SubscriptionController';

import authMiddlware from './app/middlewares/auth';

import multerConfig from './config/multer';

const routes = new Router();

const upload = multer(multerConfig);

routes.get('/', (req, res) => res.send('Hello World'));

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddlware);

routes.put('/users', UserController.update);

routes.get('/meetups/:id', MeetupController.get);
routes.get('/meetups', MeetupController.index);
routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:id', MeetupController.update);
routes.delete('/meetups/:id', MeetupController.delete);

routes.get('/organizing', OrganizingController.index);

routes.get('/subscriptions', SubscriptionController.index);

routes.post('/meetups/:meetupId/subscription', SubscriptionController.store);
routes.delete('/meetups/:meetupId/subscription', SubscriptionController.delete);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
