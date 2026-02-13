const axios = require('axios');

const port = process.env.PORT || 3000;
const url = `http://localhost:${port}/webhook`;

const exampleEvent = {
  id: 'evt_test_123',
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_123',
      amount: 1000,
      currency: 'usd'
    }
  }
};

async function send() {
  try {
    const res = await axios.post(url, exampleEvent, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Response status:', res.status);
    console.log('Response data:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Server responded with', err.response.status, err.response.data);
    } else {
      console.error('Request error', err.message);
    }
    process.exit(1);
  }
}

send();
