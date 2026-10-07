'use strict'

module.exports = {
  id: 'test-client',
  name: 'Bella Italia Trattoria',
  description: 'Authentic Italian dining with wood-fired pizzas, handmade pasta, and fine wine.',
  location: '123 Maple Street, Downtown',
  hours: {
    monday: '11:00 AM - 10:00 PM',
    tuesday: '11:00 AM - 10:00 PM',
    wednesday: '11:00 AM - 10:00 PM',
    thursday: '11:00 AM - 10:00 PM',
    friday: '11:00 AM - 11:00 PM',
    saturday: '10:00 AM - 11:00 PM',
    sunday: '10:00 AM - 9:00 PM'
  },
  menu: [
    {
      name: 'Margherita Pizza',
      price: '$16',
      description: 'Fresh mozzarella, San Marzano tomato sauce, fresh basil, extra virgin olive oil.'
    },
    {
      name: 'Truffle Tagliatelle',
      price: '$24',
      description: 'Handmade ribbon pasta with black truffle cream and aged parmesan.'
    },
    {
      name: 'Classic Lasagna',
      price: '$20',
      description: 'Slow-cooked beef bolognese, béchamel, and fresh mozzarella.'
    },
    {
      name: 'Tiramisu',
      price: '$9',
      description: 'Classic espresso-soaked ladyfingers with mascarpone cream and cocoa.'
    }
  ],
  services: [
    {
      name: 'Dine-In',
      price: 'Varies',
      description: 'Cozy indoor dining and heated outdoor patio seating.'
    },
    {
      name: 'Takeout & Delivery',
      price: 'Varies',
      description: 'Direct delivery within 5 miles and order pickup.'
    },
    {
      name: 'Private Events & Catering',
      price: 'Starting at $35/person',
      description: 'Customized family-style dining for private parties up to 75 guests.'
    }
  ],
  faqs: [
    {
      question: 'Do you offer vegetarian or gluten-free options?',
      answer: 'Yes! We offer gluten-free pasta and pizza crusts, and several vegetarian options clearly marked on our menu.'
    },
    {
      question: 'Do I need a reservation?',
      answer: 'Walk-ins are always welcome, but we recommend booking reservations for Friday and Saturday evenings.'
    },
    {
      question: 'Is parking available?',
      answer: 'Yes, we provide complimentary valet parking behind the restaurant from 5:00 PM onwards.'
    },
    {
      question: 'Do you have outdoor seating?',
      answer: 'Yes, we have a heated garden patio open year-round.'
    }
  ],
  policies: [
    'Reservations can be canceled up to 2 hours in advance without any fee.',
    'Well-behaved dogs are welcome on our outdoor patio.',
    'We accept all major credit cards, Apple Pay, and cash. Split checks allowed up to 4 cards.'
  ],
  contact: {
    phone: '(555) 234-5678',
    email: 'info@bellaitalia.example.com',
    address: '123 Maple Street, Downtown',
    website: 'https://bellaitalia.example.com'
  },
  quickQuestions: [
    'What are your opening hours?',
    "What's on the menu?",
    'Do you have vegetarian options?',
    'Where are you located?'
  ]
}