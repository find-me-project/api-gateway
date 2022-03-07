'use strict';

class AuthPlugin {
  config;

  constructor (config) {
    this.config = config;
  }

  async access (kong) {
    const authorization = await kong.request.getHeader('Authorization');

    await kong.service.request.clearHeader('kong-auth-plugin-person-id');
    await kong.service.request.clearHeader('kong-auth-plugin-account-id');
    await kong.service.request.clearHeader('kong-auth-plugin-token-id');
    await kong.service.request.clearHeader('kong-auth-plugin-status');
    await kong.service.request.clearHeader('kong-auth-plugin-role');
    await kong.service.request.clearHeader('kong-auth-plugin-created-at');

    if (authorization) {
      // TODO: Token secret (.env)
      const SECRET_TOKEN_KEY = '<SECRET_TOKEN_KEY>';
      const { verify } = require('jsonwebtoken');

      const payload = verify(authorization, SECRET_TOKEN_KEY);
      if (!payload || typeof payload === 'string') {
        return;
      }

      if (!payload.personId
        || !payload.accountId
        || !payload.tokenId
        || !payload.status
        || !payload.role
        || !payload.createdAt) {
        return;
      }

      // TODO: Redis secret (.env)
      const REDIS_URL = 'redis://redis:6379';
      const { createClient } = require('redis');
      const client = createClient({
        url: REDIS_URL
      })
      await client.connect();
      const result = await client.get(payload.tokenId);
      await client.disconnect();

      if (!result) {
        await kong.service.request.setHeader('kong-auth-plugin-person-id', payload.personId);
        await kong.service.request.setHeader('kong-auth-plugin-account-id', payload.accountId);
        await kong.service.request.setHeader('kong-auth-plugin-token-id', payload.tokenId);
        await kong.service.request.setHeader('kong-auth-plugin-status', payload.status);
        await kong.service.request.setHeader('kong-auth-plugin-role', payload.role);
        await kong.service.request.setHeader('kong-auth-plugin-created-at', payload.createdAt);
      }
    }
  }
}

module.exports = {
  Plugin: AuthPlugin,
  Schema: [
    {
      message: { type: 'string' },
    },
  ],
  Version: '0.1.0',
  Priority: 0,
};
