import { Router } from 'express/';

const routes = new Router();

routes.get('/', (req, res) => res.send('Hello Meetapp'));

export default routes