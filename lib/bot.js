'use strict'

const tls = require('tls')
const assert = require('assert')
const EventEmitter = require('events').EventEmitter
const parser = require('./parser')
const EVENTS = require('./events')

const TwitchBot = class TwitchBot extends EventEmitter {

  constructor({
    username,
    oauth,
    channel,
    port=443,
    silence=false
  }) {
    super()
    
    try {
      assert(username)
      assert(oauth)
      assert(channel)
    } catch(err) {
      throw new Error('missing required arguments')
    }

    this.username = username
    this.oauth = oauth
    this.channel = channel.toLowerCase()
    if(this.channel.charAt(0) !== '#') this.channel = '#' + this.channel

    this.irc = new tls.TLSSocket()
    this.port = port
    this.silence = silence

    this._connect()
  }

  async _connect() {
    this.irc.connect({
      host: 'irc.chat.twitch.tv',
      port: this.port
    })
    this.irc.setEncoding('utf8')
    this.irc.once('connect', () => {
      this.writeIrcMessage("PASS " + this.oauth)
      this.writeIrcMessage("NICK " + this.username)
      this.writeIrcMessage("JOIN " + this.channel)

      this.writeIrcMessage("CAP REQ :twitch.tv/membership")
      this.writeIrcMessage("CAP REQ :twitch.tv/tags")
      this.writeIrcMessage("CAP REQ :twitch.tv/commands")

      this.emit(EVENTS.CONNECTED)
      this.listen()
    })
    this.irc.on('error', err => this.emit(EVENTS.ERROR, err))
  }

  listen() {
    this.irc.on('data', data => {
      this.checkForError(data)
      
      if(data.includes('PING')) {
        this.emit(EVENTS.PING, data)
        this.writeIrcMessage('PONG :tmi.twitch.tv')
      }
      else if(data.includes('PONG')) {
        this.emit(EVENTS.PONG, data)
      }
      else if(data.includes('PRIVMSG')) {
        const chatter = parser.formatPRIVMSG(data)
        this.emit(EVENTS.MESSAGE, chatter)
      }
      else if(data.includes('WHISPER')) {
        const chatter = parser.formatWHISPER(data)
        this.emit(EVENTS.WHISPER, chatter)
      }
      else if(data.includes('JOIN')) {
        this.emit(EVENTS.USER_JOINED, data)
      }
      else if(data.includes('PART')) {
        this.emit(EVENTS.USER_LEAVED, data)
      }
      else {
        this.emit('new', data)
      }
    })
  }

  checkForError(event) {
    /* Login Authentication Failed */
    if(event.includes('Login authentication failed')) {
      this.irc.emit('error', {
        message: 'Login authentication failed'
      })
    }
    /* Auth formatting */
    if(event.includes('Improperly formatted auth')) {
      this.irc.emit('error', {
        message: 'Improperly formatted auth'
      })
    }
  }

  writeIrcMessage(text) {
    this.irc.write(text + "\r\n")
    this.emit('sent', text)
  }

  say(message, callback) {
    if(message.length >= 500) {
      this.cb(callback, {
        sent: false,
        message: 'Exceeded PRIVMSG character limit (500)'
      })
    } else {
      this.writeIrcMessage('PRIVMSG ' + this.channel + ' :' + message)
    }
  }

  timeout(username, duration=600, reason='') {
    this.say(`/timeout ${username} ${duration} ${reason}`)
  }

  ban(username, reason='') {
    this.say(`/ban ${username} ${reason}`)
  }

  close() {
    this.irc.destroy()
    this.emit('close')
  }

  cb(callback, obj) {
    if(callback) {
      obj.ts = new Date()
      callback(obj)
    }
  }

}

module.exports = TwitchBot
