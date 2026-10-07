'use strict'

module.exports = {
  id: 'dental-clinic',
  name: 'Apex Dental & Smile Studio',
  description: 'Premier family and cosmetic dentistry specializing in Invisalign, dental implants, smile makeovers, and emergency dental care.',
  location: '450 Health Sciences Blvd, Suite 200',
  hours: {
    monday: '8:00 AM - 6:00 PM',
    tuesday: '8:00 AM - 6:00 PM',
    wednesday: '8:00 AM - 6:00 PM',
    thursday: '8:00 AM - 6:00 PM',
    friday: '8:00 AM - 4:00 PM',
    saturday: '9:00 AM - 2:00 PM (By Appointment)',
    sunday: 'Closed (Emergency On-Call Available)'
  },
  services: [
    {
      name: 'Invisalign & Clear Aligners',
      price: 'Starting at $2,999 (Monthly plans from $99/mo)',
      description: 'Custom clear aligners to straighten teeth discreetly. Includes 3D digital iTero scan.'
    },
    {
      name: 'Dental Implants',
      price: 'From $1,499 per implant',
      description: 'Permanent, natural-looking replacement for missing teeth with lifetime warranty.'
    },
    {
      name: 'Professional Teeth Whitening',
      price: '$299 in-office ($149 take-home kit)',
      description: 'Zoom! 1-hour whitening treatment delivering up to 8 shades whiter smile.'
    },
    {
      name: 'Routine Cleaning & Exam',
      price: '$120 (Covered 100% by most PPO insurances)',
      description: 'Comprehensive oral exam, digital low-radiation X-rays, and gentle ultrasonic cleaning.'
    },
    {
      name: 'Emergency Dental Care',
      price: 'Same-day evaluation $99',
      description: 'Immediate relief for toothaches, chipped teeth, broken crowns, or dental trauma.'
    }
  ],
  faqs: [
    {
      question: 'Do you accept dental insurance?',
      answer: 'Yes! We accept all major PPO insurance plans (Delta Dental, MetLife, Cigna, Aetna, Guardian, and BlueCross). We also offer 0% interest financing through CareCredit.'
    },
    {
      question: 'Do you offer free consultations for Invisalign or Implants?',
      answer: 'Yes! We provide complimentary 30-minute consultations including a free 3D smile scan for all new Invisalign and implant candidates.'
    },
    {
      question: 'How quickly can I be seen for a dental emergency?',
      answer: 'We reserve daily slots for urgent cases and offer same-day emergency appointments during clinic hours.'
    },
    {
      question: 'What if I have dental anxiety?',
      answer: 'We offer sedation dentistry options (nitrous oxide and oral sedation) along with noise-canceling headphones to make your visit completely painless and stress-free.'
    }
  ],
  policies: [
    'Appointments can be rescheduled or canceled up to 24 hours in advance without any fee.',
    'Complimentary parking is available in the medical plaza parking garage.',
    'New patient forms can be filled online prior to your appointment.'
  ],
  contact: {
    phone: '(555) 789-2020',
    email: 'care@apexdentalstudio.example.com',
    address: '450 Health Sciences Blvd, Suite 200',
    website: 'https://apexdentalstudio.example.com'
  },
  notifications: {
    email: 'care@apexdentalstudio.example.com',
    telegramChatId: process.env.TEST_TELEGRAM_CHAT_ID || null
  },
  quickQuestions: [
    'How much does Invisalign cost?',
    'Do you accept my insurance?',
    'Can I book a consultation?',
    'Do you offer emergency appointments?'
  ]
}
