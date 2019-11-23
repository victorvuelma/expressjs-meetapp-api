import Mail from '../../lib/Mail';

class SubscriptionOrganizerMail {
  get key() {
    return 'SubscriptionOrganizerMail';
  }

  async handle({ data }) {
    const { meetup, user } = data;
    const { user: organizer } = meetup;

    await Mail.sendMail({
      to: `${organizer.name} <${organizer.email}>`,
      subject: `Novo credenciamento em ${meetup.title}`,
      text: 'Você tem um novo credenciamento',
      template: 'subscription_organizer',
      context: {
        meetup: meetup.title,
        user: user.name,
        organizer: organizer.name,
      },
    });
  }
}

export default new SubscriptionOrganizerMail();
