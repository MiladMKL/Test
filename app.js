const express = require('express');
const svgCaptcha = require('svg-captcha');

// use express
const app = express();

// define required vars
const requestCounts = {};
const maxRequestsPerSecond = 5;

// Use index.html
app.use(express.static(__dirname));

// Main route - check incomming requests
app.get('/', (req, res) => {
  const ip = req.ip;

  // initialize requestCounts for ip
  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 0, lastRequest: 0 };
  }

  // Increase count if request is made in less than 1 second
  if (Date.now() - requestCounts[ip].lastRequest < 1000) {
    requestCounts[ip].count += 1;
  } else {
    requestCounts[ip].count = 1;
  }

  // set last request to current date
  requestCounts[ip].lastRequest = Date.now();

  // redirect the user to the captcha route if maxRequestsPerSecond is exceeded
  if (requestCounts[ip].count > maxRequestsPerSecond) {
    res.redirect('/captcha');
  } else {
    res.send('Welcome!');
  }
});

// create a temporary store for captcha text
const captchaStore = {};

// captcha route - create and send captcha to user
app.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create();
  captchaStore[req.ip] = captcha.text;
  res.type('svg');
  res.send(captcha.data);
});

// verify captcha route - check captcha by comparing the answer with the text from captchaStore
app.get('/verify-captcha', (req, res) => {
  const userInput = req.query.answer;
  if (captchaStore[req.ip] && (userInput === captchaStore[req.ip])) {
    delete captchaStore[req.ip];
    requestCounts[req.ip] = { count: 0, lastRequest: 0 };
    res.send('Captcha verified. You may proceed.');
  } else {
    res.status(403).send('Captcha verification failed. Please try again.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
