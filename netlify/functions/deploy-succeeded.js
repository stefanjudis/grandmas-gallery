require('dotenv').config();

const { sendMessageToEveryBody } = require('../../lib/twilio');

exports.handler = function(event, context, callback) {
  sendMessageToEveryBody(
    `Site updated. 🎉\nGo to ${process.env.URL} to see it!`
  )
    .then(() => callback())
    .catch(e => callback(e));
};
