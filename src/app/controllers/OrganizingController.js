import Meetup from '../models/Meetup';
import File from '../models/File';

class OrganizingController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      order: [['date', 'asc']],
      include: [
        {
          model: File,
          as: 'image',
          attributes: ['id', 'path', 'url'],
        },
      ],
      attributes: [
        'id',
        'title',
        'description',
        'location',
        'date',
        'image_id',
        'user_id',
      ],
    });

    return res.json(meetups);
  }
}

export default new OrganizingController();
