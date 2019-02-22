const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, BOT_NUMBER } = process.env;
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendMessageToEveryBody = msg => {
  return client.messages
    .list({
      to: BOT_NUMBER
    })
    .then(messages => {
      const numbers = [
        ...messages.reduce((acc, msg) => {
          acc.add(msg.from);
          return acc;
        }, new Set())
      ];

      return Promise.all(
        numbers.map(number => {
          client.messages.create({
            from: BOT_NUMBER,
            body: msg,
            to: number
          });
        })
      );
    });
};

module.exports = {
  sendMessageToEveryBody
};
