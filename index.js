const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

let apiUrl;
let requestData;
let method;
let numberOfRequests;
let requestsPerSecond;
let requestInterval;
let requestIds = [];
let results = {};
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
  // Add more user agent strings here
];

function getRandomUserAgent() {
  const randomIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomIndex];
}

app.post('/start', (req, res) => {
  apiUrl = req.body.apiUrl;
  requestData = req.body.requestData;
  method = req.body.method || 'GET'; // Default to GET method if not provided
  numberOfRequests = req.body.numberOfRequests;
  requestsPerSecond = req.body.requestsPerSecond;

  if (!apiUrl || !requestData || !numberOfRequests || !requestsPerSecond) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  requestIds = [];
  results = {};

  for (let i = 0; i < numberOfRequests; i++) {
    const requestId = i + 1;
    requestIds.push(requestId);
    results[requestId] = { status: 'Pending', response: null };
  }

  requestInterval = setInterval(sendRequests, 1000 / requestsPerSecond);

  res.status(200).json({ message: 'Requests started' });
});

app.get('/reset', (req, res) => {
  clearInterval(requestInterval);
  requestIds = [];
  results = {};
  res.status(200).json({ message: 'Reset successful' });
});

app.get('/check/:id', (req, res) => {
  const requestId = parseInt(req.params.id);

  if (!results.hasOwnProperty(requestId)) {
    return res.status(404).json({ message: 'Request not found' });
  }

  const { status, response } = results[requestId];
  res.status(200).json({ requestId, status, response });
});

function sendRequests() {
  if (requestIds.length === 0) {
    clearInterval(requestInterval);
    console.log('All requests completed.');
    return;
  }

  const requestId = requestIds.pop();
  const userAgent = getRandomUserAgent();

  axios({
    method: method,
    url: apiUrl,
    data: requestData,
    headers: {
      'User-Agent': userAgent,
    },
  })
    .then((response) => {
      results[requestId] = { status: 'Success', response: response.data };
      console.log(`sent ${requestId}`);
    })
    .catch((error) => {
      results[requestId] = { status: 'Failure', response: error.message };
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
