import * as Yup from 'yup';
import { parseISO, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

class MeetupController {
  async get(req, res) {
    const id = Number(req.params.id);

    const meetup = await Meetup.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: File,
          as: 'image',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    if (!meetup) {
      return res.status(404).json({});
    }

    return res.json(meetup);
  }

  async index(req, res) {
    const schema = Yup.object().shape({
      date: Yup.date(),
      page: Yup.number().integer(),
    });

    if (!(await schema.isValid(req.query))) {
      return res.status(400).json({ error: 'Invalid query' });
    }

    const { page = 1, date } = req.query;
    const where = {};
    if (date) {
      const parsedDate = parseISO(date);

      where.date = {
        [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      limit: 10,
      offset: (page - 1) * 10,
      order: [['date', 'asc']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: File,
          as: 'image',
          attributes: ['path', 'url'],
        },
      ],
    });

    return res.json(meetups);
  }

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
