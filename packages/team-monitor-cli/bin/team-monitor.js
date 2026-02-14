#!/usr/bin/env node

/**
 * Team Monitor CLI
 *
 * Usage:
 *   team-monitor [command] [options]
 *   tm [command] [options]
 *
 * Commands:
 *   start    Start the monitor (default)
 *   stop     Stop the monitor
 *   restart  Restart the monitor
 *   status   Check monitor status
 *   logs     Show logs
 *   doctor   Check system requirements
 *
 * Options:
 *   -p, --port <port>    Backend port (default: 3001)
 *   -c, --client <port>  Frontend port (default: 5173)
 *   -d, --detach         Run in background
 *   -v, --verbose        Verbose output
 *   -h, --help           Show help
 *
 * Examples:
 *   team-monitor                    # Start monitor
 *   team-monitor start -p 8080      # Start with custom backend port
 *   team-monitor stop               # Stop monitor
 *   team-monitor status             # Check status
 */

const { program } = require('commander');
const path = require('path');

// Simple ANSI color codes (no dependency)
const chalk = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`
};

const Monitor = require('../lib/monitor');
const pkg = require('../package.json');

program
  .name('team-monitor')
  .description('Agent Teams Monitor - Real-time dashboard for Claude Code agent teams')
  .version(pkg.version)
  .option('-p, --port <port>', 'Backend server port', '3001')
  .option('-c, --client <port>', 'Frontend server port', '5173')
  .option('-d, --detach', 'Run in background')
  .option('-v, --verbose', 'Verbose output');

program
  .command('start')
  .description('Start the monitor (backend + frontend)')
  .action(async (options, command) => {
    const opts = { ...command.parent.opts(), ...options };
    const monitor = new Monitor(opts);

    try {
      await monitor.start();
    } catch (error) {
      console.error(chalk.red('Failed to start:'), error.message);
      process.exit(1);
    }
  });

program
  .command('stop')
  .description('Stop the monitor')
  .action(async (options, command) => {
    const opts = { ...command.parent.opts(), ...options };
    const monitor = new Monitor(opts);

    try {
      await monitor.stop();
    } catch (error) {
      console.error(chalk.red('Failed to stop:'), error.message);
      process.exit(1);
    }
  });

program
  .command('restart')
  .description('Restart the monitor')
  .action(async (options, command) => {
    const opts = { ...command.parent.opts(), ...options };
    const monitor = new Monitor(opts);

    try {
      await monitor.restart();
    } catch (error) {
      console.error(chalk.red('Failed to restart:'), error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check monitor status')
  .action(async (options, command) => {
    const opts = { ...command.parent.opts(), ...options };
    const monitor = new Monitor(opts);

    await monitor.status();
  });

program
  .command('logs')
  .description('Show logs')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <lines>', 'Number of lines to show', '50')
  .action(async (options, command) => {
    const opts = { ...command.parent.opts(), ...options };
    const monitor = new Monitor(opts);

    await monitor.logs(options);
  });

program
  .command('doctor')
  .description('Check system requirements')
  .action(async () => {
    const { doctor } = require('../lib/doctor');
    await doctor();
  });

// Default command (start)
program
  .action(async (options) => {
    const monitor = new Monitor(options);

    try {
      await monitor.start();
    } catch (error) {
      console.error(chalk.red('Failed to start:'), error.message);
      process.exit(1);
    }
  });

program.parse();
