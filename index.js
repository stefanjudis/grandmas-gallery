require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const download = require('download');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  BOT_NUMBER,
  GREETING
} = process.env;
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const DIST_DIRECTORY = path.join(__dirname, 'dist');
const MEDIA_DIRECTORY = path.join(DIST_DIRECTORY, 'media');

const enrichMessageWithMediaUrl = async message => {
  const { sid, body } = message;

  try {
    const media = await message.media().list();

    return {
      body,
      sid,
      media: media.map(({ sid, uri }) => ({
        url: `https://api.twilio.com${uri.replace('.json', '')}`,
        sid
      }))
    };
  } catch (e) {
    return { body, sid };
  }
};

const downloadMessageMedia = message => {
  return Promise.all(
    message.media.map(({ url }) => download(url, MEDIA_DIRECTORY))
  );
};

const includesMedia = message => message.media && message.media.length;
const includesBody = message => !!message.body;

(async () => {
  try {
    console.log('Fetching messages');
    let messages = await client.messages.list({
      to: BOT_NUMBER
    });

    console.log('Fetching media for messages');
    messages = await Promise.all(
      messages.map(message => enrichMessageWithMediaUrl(message))
    );

    console.log('Filter out messages without media');
    messages = messages.filter(includesBody).filter(includesMedia);

    console.log('Download media');
    await Promise.all(messages.map(message => downloadMessageMedia(message)));

    console.log('Write html file');
    await writeFile(
      path.join(DIST_DIRECTORY, 'index.html'),
      `
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Grandma's Gallery</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/styles.css">
        <meta name="theme-color" content="#fafafa">
      </head>

      <body>
        <h1>${GREETING}</h1>
        <p class="successMsg" hidden>Grand children notified</p>
        <form name="contact" class="form" method="POST" data-netlify="true">
          <button type="submit">Send me images kids!</button>
        </form>

        <div class="viewport">
          <div class="carousel-frame">
            <div class="carousel">
              <ul class="scroll">
              ${messages
                .map(message => {
                  return `<li class="scroll-item-outer">
                    <div class="scroll-item">
                      <figure>
                      ${message.media.map(
                        ({ sid }) => `<img src="/media/${sid}.jpg">`
                      )}
                      <figcaption>${message.body}</figcaption>
                      </figure>
                    </div>
                  </li>`;
                })
                .join('')}
              </ul>
            </div>
          </div>
        </div>
        <script src="/gallery.js"></script>
      </body>
      </html>`,
      'utf8'
    );
  } catch (e) {
    console.log(e);
  }
})();
