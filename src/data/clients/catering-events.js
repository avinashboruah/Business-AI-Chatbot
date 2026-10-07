'use strict'

module.exports = {
  id: 'catering-events',
  name: 'Artisan Feast Catering & Events',
  description: 'Full-service boutique catering for luxury weddings, corporate banquets, and intimate private celebrations.',
  location: '880 Culinary Plaza, Arts District',
  hours: {
    monday: '9:00 AM - 7:00 PM (Inquiries & Tasting Consultations)',
    tuesday: '9:00 AM - 7:00 PM',
    wednesday: '9:00 AM - 7:00 PM',
    thursday: '9:00 AM - 7:00 PM',
    friday: '9:00 AM - 8:00 PM',
    saturday: 'Event Operations & Weekend Tastings',
    sunday: 'Event Operations'
  },
  services: [
    {
      name: 'Luxury Wedding Catering',
      price: 'Starting at $65/person',
      description: 'Plated 3-course dinner or upscale family-style feasts with custom wine pairings and bar service.'
    },
    {
      name: 'Corporate Banquets & Galas',
      price: 'From $40/person',
      description: 'Chef-curated hot buffets, artisan boxed lunches, and cocktail hour passed hors d\'oeuvres.'
    },
    {
      name: 'Intimate Private Dining (Chef at Home)',
      price: 'Starting at $120/person (Minimum 8 guests)',
      description: 'Private executive chef preparing a 5-course tasting menu live in your home or rented venue.'
    },
    {
      name: 'Cocktail Hour & Passed Canapés',
      price: '$28/person (Choice of 6 hors d\'oeuvres)',
      description: 'Gourmet bite-sized creations including truffle croquettes, ahi tuna tartare, and duck confit sliders.'
    }
  ],
  faqs: [
    {
      question: 'What is your minimum guest count?',
      answer: 'Our standard minimum is 25 guests for drop-off or buffet catering, and 8 guests for private chef experiences. We can accommodate grand events up to 500 guests.'
    },
    {
      question: 'Do you offer dietary accommodations (vegan, gluten-free, halal)?',
      answer: 'Absolutely. Over 40% of our seasonal menus are customizable for vegan, vegetarian, gluten-free, dairy-free, kosher-style, and halal diets.'
    },
    {
      question: 'Do you provide bartenders, waitstaff, and dinnerware rentals?',
      answer: 'Yes! We provide full-service event staff including certified bartenders, servers, setup/cleanup crews, fine china, linens, and glassware.'
    },
    {
      question: 'How far in advance should we book a wedding or large event?',
      answer: 'We recommend reserving your date 3 to 9 months in advance. However, we always accommodate short-notice corporate dates based on seasonal kitchen availability.'
    }
  ],
  policies: [
    'A 25% deposit secures your event date on our calendar.',
    'Complimentary menu tastings for 2 are included for all booked weddings with 50+ guests.',
    'Final guest headcount and dietary requests are finalized 10 days before your event.'
  ],
  contact: {
    phone: '(555) 432-8080',
    email: 'events@artisanfeast.example.com',
    address: '880 Culinary Plaza, Arts District',
    website: 'https://artisanfeast.example.com'
  },
  notifications: {
    email: 'events@artisanfeast.example.com',
    telegramChatId: process.env.TEST_TELEGRAM_CHAT_ID || null
  },
  quickQuestions: [
    'What are your wedding catering packages?',
    'What is your minimum guest count?',
    'Can I request a custom event quote?',
    'Do you provide bartending and waitstaff?'
  ]
}
