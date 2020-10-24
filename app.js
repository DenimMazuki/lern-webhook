/* eslint-disable no-console */

'use-strict';

require('dotenv').config();

const { PAGE_ACCESS_TOKEN } = process.env;
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const querystring = require('querystring');

const app = express().use(bodyParser.json());

app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Sends response messages via Send API
function callSendApi(senderPsid, responseMessage) {
  axios.post(process.env.SEND_ENDPOINT, {
    recipient: {
      id: senderPsid,
    },
    message: responseMessage,
  }, querystring.stringify({ access_token: PAGE_ACCESS_TOKEN }))
    .then((response) => {
      console.log('Message sent! ', response);
    })
    .catch((error) => {
      console.log('Unable to send message: ', error);
    });
}

// Handler messages events
function handleMessage(senderPsid, receivedMessage) {
  let response;

  // Check if message contains text
  if (receivedMessage.text) {
    // Create payload for basic text message
    response = {
      text: `You sent the message: "${receivedMessage.text}". Now send me an image!`,
    };

    callSendApi(senderPsid, response);
  }
}

// Handles messagingPostback events
function handlePostback(senderPsid, receviedPostback) {

}

app.post('/webhook', (req, res) => {
  const { body } = req;

  if (body.object === 'page') {
    body.entry.forEach((entry) => {
      const webhookEvent = entry.messaging[0];
      console.log(webhookEvent);

      const senderPsid = webhookEvent.sender.id;
      console.log(`Sender PSID: ${senderPsid}`);

      // Check if event is a message or postback and pass event to handler
      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.get('/webhook', (req, res) => {
  const { VERIFY_TOKEN } = process.env;
  console.log(VERIFY_TOKEN);
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});
