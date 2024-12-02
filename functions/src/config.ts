export type Provider = "github" | "gitlab";
export const providers: Provider[] = ["github", "gitlab"];

export const config = (
  provider: Provider,
  clientId: string,
  clientSecret: string,
  tokenHostOverride?: string
) => {
  if (!providers.includes(provider)) {
    throw new Error(`Unsupported provider ${provider}`);
  }

  const configuration = {
    client: {
      id: clientId,
      secret: clientSecret,
    },
    auth: auth[provider],
    scopes: scopes[provider],
  };

  if (tokenHostOverride) {
    configuration.auth.tokenHost = tokenHostOverride;
  }

  return configuration;
};

const auth: Record<Provider, {
  tokenHost: string; tokenPath: string; authorizePath: string
}> = {
  github: {
    tokenHost: "https://github.com",
    tokenPath: "/login/oauth/access_token",
    authorizePath: "/login/oauth/authorize",
  },
  gitlab: {
    tokenHost: "https://gitlab.com",
    tokenPath: "/oauth/token",
    authorizePath: "/oauth/authorize",
  },
};

const scopes: Record<Provider, string> = {
  github: "repo,user",
  gitlab: "api",
};
