process.env.TZ = 'Asia/Kolkata';
import logger from './pino.js';
// logger.fatal('fatal');
// logger.error('error');
// logger.warn('warn');
// logger.info('info');

const user = {
  id: 'johndoe',
  name: 'John Doe',
  address: '123 Imaginary Street',
  passport: {
    number: 'BE123892',
    issued: 2023,
    expires: 2027,
  },
  password: '123',
  phone: '123-234-544',
};

logger.info({ user }, 'USER');
logger.debug({ password: 123 }, 'USER');

// LOG ERROR
// function errorFuntion() {
//   throw new Error('Something went wrong');
// }
// try {
//   errorFuntion();
// } catch (error) {
//   logger.error(error, 'An error occurred');
// }

const child = logger.child({ ID: 1 });
child.info('child');
