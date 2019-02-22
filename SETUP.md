# How to set up grandma's gallery

You can set this project up in just a few minutes using Netlify's deploy button. **But you still have to configure Netlify and Twilio to communicate properly with each other.** Make sure to follow the instructions below.

## Ready? Let's deploy grandma's gallery

### Get configuration data from Twilio

![Twilio Console with highlighted sid and auth token](./media/twilio-console.jpg)

![Twilio Console with highlighted sid and auth token](./media/twilio-sandbox.jpg)

### Deploy the site

Will ask for github permissions.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/stefanjudis/grandmas-gallery)

(👆 yes - press it!)

![Twilio Console with highlighted sid and auth token](./media/netlify-dialog.jpg)

### Define the webhook to trigger rebuilds

Overview > Site Settings > Build & Deploy > Continuous Deployment > Build hooks

![Netlify build hook](./media/netlify-build-hook.jpg)

### Create serverless function and trigger netlify build

![Netlify build hook](./media/twilio-function-create.jpg)

Copy the code from [here](...) and paste it to the new function.

![Netlify build hook](./media/twilio-function-edit.jpg)

![Netlify build hook](./media/twilio-function-enable-cred.jpg)

### And that's it!

As your running now with a sandbox you have to register it!
