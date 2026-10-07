# Reusable Business AI Chatbot

A multi-business AI chatbot backend and embeddable widget designed for small businesses (restaurants, salons, auto shops, local services, etc.). A single backend serves multiple isolated businesses.

## Features

- **Multi-Tenant Architecture**: Serves multiple independent businesses with zero information cross-contamination.
- **RAG / Knowledge Engine**: Answers opening hours, menus, services, FAQs, locations, contact info, and policies based exclusively on verified business knowledge.
- **Accurate & Safe**: If the knowledge base does not contain an answer, replies: *"I'm not sure based on the information I have. You can contact the business directly to confirm."*
- **Framework-Independent Widget**: Plain JavaScript widget that can be embedded on WordPress, Wix, Squarespace, plain HTML, React, Next.js, etc.
- **Flexible LLM & Zero-Cost Mode**: Integrated with `@hey-amanthakur/chat-bot` and OpenRouter for free/low-cost LLM models, with a built-in deterministic fallback engine for 100% offline ₹0/month local development.
- **Ready for Render Deployment**: Deployable to Render Free in minutes.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment (Optional)

```bash
cp .env.example .env
```

If you have an OpenRouter API key, add it to `.env`:
```env
OPENROUTER_API_KEY=your_key_here
PORT=3000
```
*(If no API key is set, the chatbot runs locally in zero-cost mode using the verified business knowledge base.)*

### 3. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`.

---

## Verifying the 7 MVP Success Criteria (PRD Section 19)

### Test 1: Start locally and verify backend
```bash
curl http://localhost:3000/
# Output: {"status":"ok","message":"Chatbot backend is running", ...}
```

### Test 2: Business identification (`client_id = test-client`)
```bash
curl http://localhost:3000/api/client/test-client
# Returns Bella Italia Trattoria business information
```

### Test 3: Ask opening hours
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test-client","message":"What are your opening hours?"}'
# Returns Bella Italia opening hours (11:00 AM - 10:00 PM, etc.)
```

### Test 4: Second client with distinct information (`client_id = second-client`)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"clientId":"second-client","message":"What are your opening hours?"}'
# Returns Apex Auto Repair hours (8:00 AM - 6:00 PM, Closed Sunday)

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"clientId":"second-client","message":"Do you offer oil change?"}'
# Returns Apex Auto Repair oil change service ($49.99)
```

Notice that asking `test-client` about auto repair returns:
> *"I'm not sure based on the information I have. You can contact the business directly to confirm."*

### Test 5: Plain HTML Website Embedding
Visit `http://localhost:3000/test` in your browser. Click the chat button to interact with the widget on a live plain HTML page.

### Test 6: Deploy to Render
1. Push code to your GitHub repository.
2. Go to [Render.com](https://render.com) and create a **New Web Service**.
3. Select your repository.
4. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
5. Click **Create Web Service**.

### Test 7: External Website Widget Embedding
On any client website, add this single `<script>` tag:

```html
<script
  src="https://your-chatbot-backend.onrender.com/widget.js"
  data-client-id="test-client">
</script>
```

---

## Adding a New Business (Onboarding)

To onboard a new business (e.g. `el-primo`):

1. Create a data file `src/data/clients/el-primo.js`:
```javascript
module.exports = {
  id: 'el-primo',
  name: 'El Primo Tacos',
  description: 'Authentic Mexican street tacos and fresh agua fresca.',
  location: '45 Mission St, San Francisco',
  hours: {
    monday: '11:00 AM - 9:00 PM',
    tuesday: '11:00 AM - 9:00 PM',
    // ...
  },
  menu: [
    { name: 'Carne Asada Taco', price: '$4.50', description: 'Grilled steak with onions and cilantro' }
  ],
  services: [],
  faqs: [
    { question: 'Do you cater?', answer: 'Yes, we cater taco bars for 20+ guests.' }
  ],
  policies: [
    'Cash and cards accepted.'
  ],
  contact: {
    phone: '(555) 345-6789',
    email: 'tacos@elprimo.example.com'
  }
}
```

2. Register it in `src/config/clients.js`:
```javascript
const elPrimo = require('../data/clients/el-primo')
// add 'el-primo': elPrimo to clients map
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Backend health & status check |
| `GET` | `/api/health` | Deployment uptime health check |
| `GET` | `/api/clients` | List all configured `client_id`s |
| `GET` | `/api/client/:clientId` | Retrieve client business details |
| `GET` | `/api/knowledge/:clientId` | Retrieve client knowledge base |
| `POST` | `/api/knowledge` | Update client knowledge dynamically |
| `POST` | `/api/chat` | Send customer message to chatbot (`{ clientId, message }`) |
| `GET` | `/widget.js` | Embeddable client JavaScript widget |
| `GET` | `/test` | Live HTML demo page |

---

## Running Automated Tests

```bash
npm test
```
