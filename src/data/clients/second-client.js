'use strict'

module.exports = {
  id: 'second-client',
  name: 'Apex Auto Repair',
  description: 'Full-service auto repair and preventive maintenance shop staffed by ASE-certified master mechanics.',
  location: '742 Industrial Parkway, Westside',
  hours: {
    monday: '8:00 AM - 6:00 PM',
    tuesday: '8:00 AM - 6:00 PM',
    wednesday: '8:00 AM - 6:00 PM',
    thursday: '8:00 AM - 6:00 PM',
    friday: '8:00 AM - 6:00 PM',
    saturday: '9:00 AM - 2:00 PM',
    sunday: 'Closed'
  },
  menu: [],
  services: [
    {
      name: 'Synthetic Oil Change & Inspection',
      price: '$49.99',
      description: 'Includes up to 5 quarts of full synthetic oil, new OEM filter, and a comprehensive 25-point safety inspection.'
    },
    {
      name: 'Brake Service & Pad Replacement',
      price: '$179.99',
      description: 'Front or rear ceramic brake pad installation and rotor resurfacing.'
    },
    {
      name: 'Engine Diagnostic Scan',
      price: '$89.00',
      description: 'Computer OBD-II scan to diagnose check engine lights and performance issues (fee waived if repairs done with us).'
    },
    {
      name: 'Tire Rotation & Balance',
      price: '$39.99',
      description: 'Four-wheel rotation and computer balancing to maximize tire tread life.'
    }
  ],
  faqs: [
    {
      question: 'Do you provide loaner vehicles while my car is being serviced?',
      answer: 'Yes! We provide complimentary loaner vehicles for any repair service taking longer than 24 hours (subject to availability).'
    },
    {
      question: 'Do you offer towing assistance?',
      answer: 'Yes, we partner with Westside 24/7 Towing. Call our main line and select option 1 for immediate dispatch.'
    },
    {
      question: 'What warranty do you provide on repairs?',
      answer: 'All parts and labor are backed by our 24-month or 24,000-mile nationwide warranty.'
    },
    {
      question: 'Do I need an appointment for an oil change?',
      answer: 'No appointment is needed for routine oil changes and wiper replacements; walk-ins are welcome.'
    }
  ],
  policies: [
    'A written estimate must be approved by the customer before any repair work commences.',
    'Payment is due upon vehicle completion. We accept Visa, MasterCard, Amex, Discover, and debit cards.',
    'Old parts will be retained and shown to the customer upon request.'
  ],
  contact: {
    phone: '(555) 987-6543',
    email: 'service@apexautorepair.example.com',
    address: '742 Industrial Parkway, Westside',
    website: 'https://apexautorepair.example.com'
  },
  quickQuestions: [
    'What are your opening hours?',
    'How much is an oil change?',
    'Do you provide loaner cars?',
    'What warranty do you offer?'
  ]
}
