import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { AuthorizationCode } from "simple-oauth2";
import express = require("express");
import randomstring = require("randomstring");
import * as logger from "firebase-functions/logger";

const oauth = {
  client_id: defineString("OAUTH_CLIENT_ID", {
    description: "The OAuth client ID.",
  }),
  // retrieved from Google Secrets Manager
  client_secret: defineSecret("OAUTH_CLIENT_SECRET"),
  git_hostname: defineString("GIT_HOSTNAME", {
    default: "https://github.com",
    description: "The hostname of the git provider.",
  }),
  token_path: defineString("OAUTH_TOKEN_PATH", {
    default: "/login/oauth/access_token",
    description: "The OAuth access token path.",
  }),
  authorize_path: defineString("OAUTH_AUTHORIZE_PATH", {
    default: "/login/oauth/authorize",
    description: "The OAuth authorization path.",
  }),
  provider: defineString("OAUTH_PROVIDER", {
    default: "github",
    description: "The OAuth provider.",
  }),
  scopes: defineString("SCOPES", {
    default: "repo,user",
    description: "The OAuth scopes to allow.",
  }),
};

// eslint-disable-next-line require-jsdoc
function getScript(mess: string, content: any) {
  return `<!doctype html><html><body><script>
    (function() {
      function receiveMessage(e) {
        console.log("receiveMessage %o", e)
        window.opener.postMessage(
          'authorization:github:${mess}:${JSON.stringify(content)}',
          e.origin
        )
        window.removeEventListener("message",receiveMessage,false);
      }
      window.addEventListener("message", receiveMessage, false)
      console.log("Sending message: %o", "github")
      window.opener.postMessage("authorizing:github", "*")
      })()
    </script></body></html>`;
}

const oauthApp = express();

oauthApp.get("/auth", (req, res) => {
  try {
    const oauth2 = new AuthorizationCode({
      client: {
        id: oauth.client_id.value(),
        secret: oauth.client_secret.value(),
      },
      auth: {
        tokenHost: oauth.git_hostname.value(),
        tokenPath: oauth.token_path.value(),
        authorizePath: oauth.authorize_path.value(),
      },
    });

    const authorizationUri = oauth2.authorizeURL({
      scope: oauth.scopes.value(),
      state: randomstring.generate(32),
    });

    return res.redirect(authorizationUri);
  } catch (error) {
    logger.error("Authorization Error", error);
    return res.send(getScript("error", error));
  }
});

oauthApp.get("/callback", async (req, res) => {
  try {
    const oauth2 = new AuthorizationCode({
      client: {
        id: oauth.client_id.value(),
        secret: oauth.client_secret.value(),
      },
      auth: {
        tokenHost: oauth.git_hostname.value(),
        tokenPath: oauth.token_path.value(),
        authorizePath: oauth.authorize_path.value(),
      },
    });

    const options: any = {
      code: req.query.code,
    };

    if (oauth.provider.value() === "gitlab") {
      options.client_id = oauth.client_id.value();
      options.client_secret = oauth.client_secret.value();
      options.grant_type = "authorization_code";
    }

    const token = await oauth2.getToken(options);

    return res.send(
      getScript("success", {
        token: token.token.access_token,
        provider: oauth.provider.value(),
      })
    );
  } catch (error) {
    logger.error("Access Token Error", error);
    return res.send(getScript("error", error));
  }
});

oauthApp.get("/success", (req, res) => {
  res.send("");
});

oauthApp.get("/", (req, res) => {
  logger.log(oauth.client_id.value());
  res.redirect(301, "/auth");
});

exports.oauth = onRequest({ secrets: ["OAUTH_CLIENT_SECRET"] }, oauthApp);
