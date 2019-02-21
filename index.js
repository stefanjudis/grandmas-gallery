require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  BOT_NUMBER,
  GREETING
} = process.env;
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const download = require('download');

const isTruthy = value => !!value === true;

const DIST_DIRECTORY = path.join(__dirname, 'dist');
const MEDIA_DIRECTORY = path.join(DIST_DIRECTORY, 'media');

const enrichMessageWithMediaUrl = async message => {
  const { sid, body } = message;

  try {
    const media = await (await message.media()).list();

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
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: sans-serif;
        }
        .grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(18em,1fr));
        }

        img {
          max-width: 100%;
          display: block;
        }
      </style>
      <h1>${GREETING}</h1>
      <form name="contact" method="POST" data-netlify="true">
        <p>
          <button type="submit">Send me images kids!</button>
        </p>
        <p class="successMsg" hidden>Grand children notified</p>
      </form>
      <ul class="grid">
        ${messages
          .map(message => {
            return `<li>${message.media.map(
              ({ sid }) => `<img src="/media/${sid}.jpg"><p>${message.body}</p>`
            )}</li>`;
          })
          .join('')}
      </ul>
      <script>
        const form = document.querySelector('form');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          try {
            await fetch('/', {
              method: 'post',
              headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
              },
              body: new URLSearchParams(new FormData(form)).toString()
            });

            document.querySelector('.successMsg').hidden = false;
          } catch(e) {
            console.error(e);
          }
        });

        setTimeout(() => window.location.reload(), 1000 * 60 * 30);
      </script>
    `,
      'utf8'
    );
  } catch (e) {
    console.log(e);
  }
})();
