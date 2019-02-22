const https = require('https');
const NETLIFY_HOOK_PATH = 'XXX';

const triggerNetlifyBuid = () => {
  return new Promise((resolve, reject) => {
    https
      .request(
        {
          host: 'api.netlify.com',
          path: NETLIFY_HOOK_PATH,
          method: 'POST'
        },
        res => {
          res.on('data', () => {});
          res.on('end', resolve);
        }
      )
      .on('error', reject)
      .end();
  });
};

exports.handler = function(context, event, callback) {
  const client = context.getTwilioClient();
  const twiml = new Twilio.twiml.MessagingResponse();
  const { Body, SmsMessageSid, NumMedia } = event;

  if (Body === '') {
    twiml.message('Please include a nice message for Grandma...');
    return callback(null, twiml);
  }

  if (NumMedia !== '1') {
    twiml.message(
      "Please send Grandma an image so that it's displayed nicely..."
    );
    return callback(null, twiml);
  }

  client
    .messages(SmsMessageSid)
    .fetch()
    .then(message => message.media())
    .then(media => media.list())
    .then(() => triggerNetlifyBuid())
    .then(() => {
      twiml.message(
        "Looks good! 👌 Let's update the site.\nI'll keep you posted..."
      );
      return callback(null, twiml);
    })
    .catch(e => console.log(e));
};
