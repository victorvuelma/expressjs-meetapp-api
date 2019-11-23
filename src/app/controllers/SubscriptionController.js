import { Op } from 'sequelize';
import { startOfHour, endOfHour } from 'date-fns';

import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Queue from '../../lib/Queue';
import SubscriptionOrganizerMail from '../job/SubscriptionOrganizerMail';
import File from '../models/File';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.gte]: new Date(),
            },
          },
          attributes: ['id', 'title', 'description', 'date', 'location'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name'],
            },
            {
              model: File,
              as: 'image',
              attributes: ['path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const {
      params: { meetupId },
      userId,
    } = req;

    const meetup = await Meetup.findByPk(meetupId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!meetup) {
      return res.status(400).json({ error: 'Invalid meetup' });
    }

    if (meetup.user_id === userId) {
      return res
        .status(401)
        .json({ error: "Can't subscribe on a meetup that you own" });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: "Can't subscribe on a past meetup" });
    }

    const userHasSubscription = await Subscription.findOne({
      where: {
        user_id: userId,
        meetup_id: meetupId,
      },
    });

    if (userHasSubscription) {
      return res
        .status(400)
        .json({ error: 'You already subscribed to this meetup' });
    }

    const userHasHourSubscription = await Subscription.findOne({
      where: {
        user_id: userId,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.between]: [startOfHour(meetup.date), endOfHour(meetup.date)],
            },
          },
        },
      ],
    });

    if (userHasHourSubscription) {
      return res
        .status(400)
        .json({ error: 'You already subscribed to a meetup in same hour.' });
    }

    const subscription = await Subscription.create({
      user_id: userId,
      meetup_id: meetupId,
    });

    const user = await User.findByPk(req.userId);

    await Queue.addJob(SubscriptionOrganizerMail.key, {
      meetup,
      user,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
