require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, MY_NUMBER } = process.env;
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const download = require('download');

const isTruthy = value => !!value === true;

const MY_NUMBER = 'whatsapp:+4917684299215';
const DIST_DIRECTORY = path.join(__dirname, 'dist');
const MEDIA_DIRECTORY = path.join(DIST_DIRECTORY, 'media');

const enrichMessageWithMediaUrl = async message => {
  const { sid, body } = message;
  try {
    const media = await message.media().list();

    return {
      body,
      sid,
      mediaUrls: media.map(
        medium => `https://api.twilio.com${medium.uri.replace('.json', '')}`
      )
    };
  } catch (e) {
    return { body, sid };
  }
};

const downloadMessageMedia = message => {
  return Promise.all(
    message.mediaUrls.map(url => download(url, MEDIA_DIRECTORY))
  );
};

const includesMedia = message => message.mediaUrls && message.mediaUrls.length;

(async () => {
  try {
    console.log('Fetching messages');
    let messages = await client.messages.list({
      from: MY_NUMBER
    });

    console.log('Fetching media for messages');
    messages = await Promise.all(
      messages.map(message => enrichMessageWithMediaUrl(message))
    );

    console.log('Filter out messages without media');
    messages = messages.filter(includesMedia);

    console.log('Download media');
    await Promise.all(messages.map(message => downloadMessageMedia(message)));

    console.log('Write html file');
    await writeFile(
      path.join(DIST_DIRECTORY, 'index.html'),
      `<ul>
        ${messages
          .map(message => {
            return `<li>${message.mediaUrls.map(
              url => `<img src="${url}">`
            )}</li>`;
          })
          .join('')}
      </ul>
    `,
      'utf8'
    );
  } catch (e) {
    console.log(e);
  }
})();
