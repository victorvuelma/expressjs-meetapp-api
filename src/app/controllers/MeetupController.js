import * as Yup from 'yup';
import { parseISO, isBefore } from 'date-fns';

import Meetup from '../models/Meetup';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      image_id: Yup.number()
        .integer()
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { date } = req.body;
    const parsedDate = parseISO(date);

    if (isBefore(parsedDate, new Date())) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const meetup = await Meetup.create({
      ...req.body,
      date,
      user_id: req.userId,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      image_id: Yup.number().integer(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const parsedDate = parseISO(req.body.date);

    if (isBefore(parsedDate, new Date())) {
      return res.status(400).json({ error: 'Past date' });
    }

    const meetup = await Meetup.findByPk(Number(req.params.id));

    if (!meetup) {
      return res.status(400).json({ error: 'Invalid meetup' });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: "You can't edit this meetup" });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't update past meetups" });
    }

    await meetup.update({
      ...req.body,
      date: parsedDate,
    });

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(Number(req.params.id));

    if (!meetup) {
      return res.status(400).json({ error: 'Invalid meetup' });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: "You can't edit this meetup" });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't delete past meetups" });
    }

    await meetup.destroy();

    return res.json();
  }
}

export default new MeetupController();
