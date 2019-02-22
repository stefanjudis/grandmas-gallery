require('dotenv').config();

const { sendMessageToEveryBody } = require('../../lib/twilio');

exports.handler = function(event, context, callback) {
  sendMessageToEveryBody('Grandma wants to get a picture! 👵')
    .then(() => callback())
    .catch(e => callback(e));
};
