/**
 * Team Monitor CLI - Entry Point
 *
 * Main module exports for programmatic usage
 */

const Monitor = require('./lib/monitor');
const { doctor } = require('./lib/doctor');

module.exports = {
  Monitor,
  doctor
};
