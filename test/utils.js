const TwitchBot = require('../index')

module.exports = {
    CONFIG: {
    USERNAME: process.env.TWITCHBOT_USERNAME,
    OAUTH: process.env.TWITCHBOT_OAUTH,
    CHANNEL: process.env.TWITCHBOT_CHANNEL
  },

  NON_MOD_CONFIG: {
    USERNAME: process.env.TWITCHBOT_USERNAME_NON_MOD,
    OAUTH: process.env.TWITCHBOT_OAUTH_NON_MOD,
    CHANNEL: process.env.TWITCHBOT_CHANNEL_NON_MOD
  },

  createBotInstance({ username, oauth, channel }) {
    return new TwitchBot({
      username: username || this.CONFIG.USERNAME,
      oauth: oauth || this.CONFIG.OAUTH,
      channel: channel || this.CONFIG.CHANNEL
    })
  },

  createNonModBotInstance({ username, oauth, channel }) {
    return new TwitchBot({
      username: username || this.NON_MOD_CONFIG.USERNAME,
      oauth: oauth || this.NON_MOD_CONFIG.OAUTH,
      channel: channel || this.NON_MOD_CONFIG.CHANNEL
    })
  }

}