# netlify-cms-oauth-firebase

This is a [Firebase V2 Cloud Function](https://firebase.google.com/docs/functions/) that allows [Netlify CMS](https://www.netlifycms.org/) to authenticate with GitHub or GitLab via OAuth2.

## Setup

### 0. Prerequisites

These instructions assume that you have already created a [Firebase](https://firebase.google.com/) project and have installed and configured the [Firebase CLI Tools](https://github.com/firebase/firebase-tools). See the [Firebase CLI Reference](https://firebase.google.com/docs/cli/) for more details.

**Note:** The Firebase project must be configured to use the **Blaze** plan, as the function needs to be able to make outbound network requests to non-Google services. Additionally, the function uses > Node.js 10 runtime and Google Secret Manager, which are not available on the free plan.

### 1. Get the code

Clone the repository and install dependencies:

```bash
git clone https://github.com/BTx23/netlify-cms-oauth-firebase
cd netlify-cms-oauth-firebase/functions
npm i
```

### 2. Create an OAuth app

You will need an OAuth app to authenticate with.

For GitHub, the instructions can be found in the [GitHub Developer Documentation](https://developer.github.com/apps/building-oauth-apps/creating-an-oauth-app/).

For GitLab, the instructions can be found in the [GitLab Docs](https://docs.gitlab.com/ee/integration/oauth_provider.html). Grant the `api` scope when configuring application scopes.

For now, the values that you provide for the other fields do not matter. The **authorization callback URL** will need to be configured once you have the Firebase Function URL in order for the service to work.

### 3. Configure the Firebase environment

Tell Firebase which project to use:

```
firebase use your-project-id
```

Set the `OAUTH_CLIENT_SECRET` Firebase environment variable interactively using the value from the GitHub OAuth app:
```
firebase functions:secrets:set OAUTH_CLIENT_SECRET
# Should then prompt for secret
```

### 4. Deploy the function

Deploy the function to Firebase:

```bash
npm run deploy
```

Upon running deploy for the first time, you will need to interactively set your parameterized configuration. See below for provider-specific instructions. The default configurations will work for the `github` provider.

For GitHub Enterprise and GitLab you will need to set the `OAUTH_GIT_HOSTNAME` environment variable.

For GitLab you will also need to set the following additional environment variables as specified:

```.env
OAUTH_PROVIDER=gitlab
OAUTH_GIT_HOSTNAME=https://gitlab.com
OAUTH_AUTHORIZE_PATH=/oauth/authorize
OAUTH_TOKEN_PATH=/oauth/token
OAUTH_REDIRECT_URI=https://oauth-XXXXXXXXXX-XX.X.run.app
OAUTH_SCOPES=api
```

You should update the **authorization callback URL** in your GitHub or GitLab OAuth app's settings to point to the URL of your Firebase function, which should be of the form: `https://oauth-XXXXXXXXXX-XX.X.run.app/callback`. If you get an invalid redirect URI error when authenticating with GitLab, make sure your redirect URI is present in the list of Callback URLs in the GitLab OAuth application.

### 5. Configure Netlify CMS
Finally, update your Netlify CMS `config.yml` to point to the function:
```yaml
backend:
  name: github # Or gitlab
  repo: username/repo # Your username and repository
  branch: main # Branch to use
  base_url: https://oauth-XXXXXXXXXX-XX.X.run.app # The base URL for your Firebase Function
```
