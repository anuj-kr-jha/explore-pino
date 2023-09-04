import pino from 'pino';

/**
 * @typedef {Object} fileOptions - Options for enable/disable the transport targets[file].
 * @property {boolean} enable - Enable file logging.
 * @property {string} path - file path for storing logs.
 */

/**
 * @typedef {boolean} consoleOptions - Options for enable/disable the transport targets[console].
 */

/**
 * @typedef {Object} mongoConnectionOptions - Options for enable/disable the transport targets[mongoDB].
 * @property {string} uri - Mongodb connection uri.
 * @property {string} database - Mongodb database name.
 * @property {string} collection - Mongodb collection name.
 */

/**
 * @typedef {Object} mongoOptions - Options for enable/disable the transport targets[mongoDB].
 * @property {boolean} enable - Enable mongo logging.
 * @property {mongoConnectionOptions} options - Mongodb connection options.
 */

/**
 * @typedef {Object} TargetsOptions - Options for configuring the logger.
 * @property {consoleOptions} console - Enable console logging.
 * @property {fileOptions} file - Enable file logging.
 * @property {mongoOptions} mongo - Enable mongo logging.
 */

/**
 * A custom logger class built on top of Pino.
 * @type {pino.Logger}
 */
class Logger {
  /**
   * @type {TargetsOptions}
   * @private
   */
  #meta = {
    console: true,
    file: { enable: false, path: './logs/app.log' },
    mongo: {
      enable: false,
      options: {
        uri: 'mongodb://mongo.one.db:27017,mongo.two.db:27017,mongo.three.db:27017/logs?replicaSet=dbrs',
        database: 'logs',
        collection: 'log-collection',
      },
    },
  };

  /**
   * Creates a new Logger instance.
   * @param {TargetsOptions} opts - Options for configuring the logger.
   */
  constructor(opts) {
    this.#meta = opts ?? this.#meta;
    this.logger = this.#init(opts);
    //
    this.trace = this.logger.trace.bind(this.logger); // 10
    this.debug = this.logger.debug.bind(this.logger); // 20
    this.info = this.logger.info.bind(this.logger); // 30
    this.notice = this.logger.notice.bind(this.logger); // 35
    this.warn = this.logger.warn.bind(this.logger); // 40
    this.error = this.logger.error.bind(this.logger); // 50
    this.fatal = this.logger.fatal.bind(this.logger); // 60
    this.child = this.logger.child.bind(this.logger); // child logger
  }

  /**
   * Initializes the logger.
   * @returns {pino.Logger} - The Pino logger instance.
   * @private
   */
  #init() {
    return pino(this.#options, this.#transport);
  }

  get #options() {
    return {
      level: 'trace',
      timestamp: pino.stdTimeFunctions.isoTime,
      // msgPrefix: 'pino:',
      level: 'trace',
      errorKey: 'err',
      messageKey: 'msg',
      nestedKey: 'data',
      formatters: {
        // level: (label) => ({ level: label.toUpperCase() }),
        bindings: (bindings) => ({ host: bindings.hostname, pid: bindings.pid }),
      },
      customLevels: {
        notice: 35,
      },
      // Keeping sensitive data out of your logs
      redact: {
        paths: ['user.address', 'user.passport', 'user.phone', '*.password'], // * is a wildcard covering a depth of 1
        censor: '[PINO REDACTED]', // - placeholder for redacted values
        remove: true, // - remove redacted keys instead of censoring values
      },

      // serializers: {
      //   req: pino.stdSerializers.req,
      //   res: pino.stdSerializers.res,
      //   err: pino.stdSerializers.err,
      // },
    };
  }

  get #transport() {
    const targets = [];
    if (this.#meta?.console) targets.push(this.#consoleLogger);
    if (this.#meta?.file?.enable) targets.push(this.#fileLogger);
    if (this.#meta?.mongo?.enable) targets.push(this.#mongoDbLogger);
    return pino.transport({ targets });
  }

  get #consoleLogger() {
    return {
      level: 'trace',
      target: 'pino-pretty', // must be installed separately
      options: {
        colorize: true,
        minLength: 1024,
        sync: false,
        singleLine: true,
        levelFirst: true,
        translateTime: 'SYS:standard', // - 'yyyy-mm-dd HH:MM:ss.l',
      },
    };
  }

  get #fileLogger() {
    return {
      level: 'trace',
      target: 'pino/file',
      options: {
        destination: this.#meta.file.path ?? '',
        minLength: 1024,
        sync: false,
      },
    };
  }

  get #mongoDbLogger() {
    return {
      target: 'pino-mongodb',
      level: 'info',
      options: {
        uri: this.#meta.mongo.options.uri ?? '',
        database: this.#meta.mongo.options.database ?? '',
        collection: this.#meta.mongo.options.uri ?? '',
        mongoOptions: {},
        minLength: 1024,
        sync: false,
      },
    };
  }
}

export default new Logger({
  console: true,
  file: { enable: true, path: './logs/app.log' },
  mongo: {
    enable: true,
    options: {
      uri: 'mongodb://mongo.one.db:27017,mongo.two.db:27017,mongo.three.db:27017/logs?replicaSet=dbrs',
      database: 'logs',
      collection: 'log-collection',
    },
  },
});

// log.info('%s %s %s %j', true, '2', '4', { a: 1, b: 2, c: { d: 1 } }); // it will auto stringify the object

// NOTES::
// - when 1st param is a string, it is treated as a message string, and other param is ignored
// - when 1st param is an object, it is treated as a context object, and 2nd param is treated as a message
//
// - message is available with the key "msg"
// - context object properties are available as keys in the root log object

// ref: https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/
