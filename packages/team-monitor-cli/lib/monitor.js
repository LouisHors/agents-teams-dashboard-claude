const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const chalk = require('chalk');
const open = require('open');

class Monitor {
  constructor(options = {}) {
    this.backendPort = options.port || process.env.TEAM_MONITOR_BACKEND_PORT || '3001';
    this.frontendPort = options.client || process.env.TEAM_MONITOR_FRONTEND_PORT || '5173';
    this.verbose = options.verbose || false;
    this.detach = options.detach || false;

    // Get package root directory
    this.packageRoot = path.resolve(__dirname, '..');
    this.serverDir = path.join(this.packageRoot, 'server');
    this.clientDir = path.join(this.packageRoot, 'client');

    // Log files
    this.logDir = path.join(os.tmpdir(), 'team-monitor');
    this.backendLog = path.join(this.logDir, 'backend.log');
    this.frontendLog = path.join(this.logDir, 'frontend.log');

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      verbose: chalk.gray
    };

    if (type === 'verbose' && !this.verbose) return;

    console.log(colors[type] ? colors[type](message) : message);
  }

  async isPortInUse(port) {
    return new Promise((resolve) => {
      const cmd = process.platform === 'win32'
        ? `netstat -ano | findstr :${port}`
        : `lsof -ti:${port}`;

      exec(cmd, (error, stdout) => {
        resolve(!!stdout && stdout.trim().length > 0);
      });
    });
  }

  async checkDependencies(dir) {
    return fs.existsSync(path.join(dir, 'node_modules'));
  }

  async installDependencies(dir, name) {
    this.log(`Installing ${name} dependencies...`, 'info');

    return new Promise((resolve, reject) => {
      const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const install = spawn(npm, ['install'], {
        cwd: dir,
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      install.on('close', (code) => {
        if (code === 0) {
          this.log(`✓ ${name} dependencies installed`, 'success');
          resolve();
        } else {
          reject(new Error(`${name} dependencies installation failed`));
        }
      });

      install.on('error', reject);
    });
  }

  async startService(dir, port, name, logFile) {
    const isRunning = await this.isPortInUse(port);

    if (isRunning) {
      this.log(`✓ ${name} already running on port ${port}`, 'success');
      return { alreadyRunning: true };
    }

    // Check and install dependencies
    const hasDeps = await this.checkDependencies(dir);
    if (!hasDeps) {
      await this.installDependencies(dir, name);
    }

    this.log(`Starting ${name}...`, 'info');

    // Start service
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const proc = spawn(npm, ['run', 'dev'], {
      cwd: dir,
      detached: this.detach,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Write PID file
    const pidFile = path.join(this.logDir, `${name.toLowerCase().replace(' ', '-')}.pid`);
    fs.writeFileSync(pidFile, proc.pid.toString());

    // Log output
    if (!this.detach) {
      const logStream = fs.createWriteStream(logFile, { flags: 'a' });
      proc.stdout.pipe(logStream);
      proc.stderr.pipe(logStream);
    }

    // Wait for service to be ready
    await this.waitForPort(port, 30);

    this.log(`✓ ${name} started on port ${port}`, 'success');
    return { pid: proc.pid };
  }

  async waitForPort(port, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const inUse = await this.isPortInUse(port);
      if (inUse) return;
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error(`Port ${port} did not become ready in time`);
  }

  async start() {
    console.log(chalk.blue.bold('\n=== Agent Teams Monitor ===\n'));

    try {
      // Start backend
      const backend = await this.startService(
        this.serverDir,
        this.backendPort,
        'Backend',
        this.backendLog
      );

      // Start frontend
      const frontend = await this.startService(
        this.clientDir,
        this.frontendPort,
        'Frontend',
        this.frontendLog
      );

      console.log('\n' + chalk.green.bold('✓ Monitor is ready!'));
      console.log(chalk.cyan(`  Dashboard: http://localhost:${this.frontendPort}`));
      console.log(chalk.cyan(`  API:       http://localhost:${this.backendPort}`));

      if (!backend.alreadyRunning || !frontend.alreadyRunning) {
        console.log('\n' + chalk.gray('Opening browser...'));
        await open(`http://localhost:${this.frontendPort}`);
      }

      console.log('\n' + chalk.gray('Press Ctrl+C to stop'));

      if (!this.detach) {
        // Keep process running
        process.stdin.resume();
      }

    } catch (error) {
      this.log(`Failed to start: ${error.message}`, 'error');
      throw error;
    }
  }

  async stop() {
    console.log(chalk.blue('\n=== Stopping Agent Teams Monitor ===\n'));

    const services = [
      { port: this.backendPort, name: 'Backend' },
      { port: this.frontendPort, name: 'Frontend' }
    ];

    for (const service of services) {
      const isRunning = await this.isPortInUse(service.port);

      if (isRunning) {
        await this.killPort(service.port);
        this.log(`✓ ${service.name} stopped`, 'success');
      } else {
        this.log(`! ${service.name} not running`, 'warning');
      }
    }

    // Clean up PID files
    const pidFiles = [
      path.join(this.logDir, 'backend.pid'),
      path.join(this.logDir, 'frontend.pid')
    ];

    pidFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });

    console.log('');
  }

  async killPort(port) {
    return new Promise((resolve, reject) => {
      const cmd = process.platform === 'win32'
        ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`
        : `kill $(lsof -ti:${port}) 2>/dev/null`;

      exec(cmd, (error) => {
        // Ignore errors (process might already be dead)
        resolve();
      });
    });
  }

  async restart() {
    await this.stop();
    await new Promise(r => setTimeout(r, 2000));
    await this.start();
  }

  async status() {
    console.log(chalk.blue.bold('\n=== Team Monitor Status ===\n'));

    const services = [
      { port: this.backendPort, name: 'Backend', url: `http://localhost:${this.backendPort}` },
      { port: this.frontendPort, name: 'Frontend', url: `http://localhost:${this.frontendPort}` }
    ];

    for (const service of services) {
      const isRunning = await this.isPortInUse(service.port);
      const status = isRunning
        ? chalk.green('● running')
        : chalk.red('● stopped');
      console.log(`${status} ${service.name.padEnd(10)} ${service.url}`);
    }

    console.log('\n' + chalk.gray('Logs:'));
    console.log(`  Backend:  ${this.backendLog}`);
    console.log(`  Frontend: ${this.frontendLog}`);
    console.log('');
  }

  async logs(options = {}) {
    const { follow, lines = '50' } = options;
    const logFiles = [this.backendLog, this.frontendLog];

    for (const logFile of logFiles) {
      const name = path.basename(logFile, '.log').toUpperCase();
      console.log(chalk.blue(`\n=== ${name} Logs ===\n`));

      if (!fs.existsSync(logFile)) {
        console.log(chalk.gray('No logs found'));
        continue;
      }

      if (follow) {
        // Tail -f equivalent
        const tail = spawn('tail', ['-f', '-n', lines, logFile], {
          stdio: 'inherit'
        });

        tail.on('error', () => {
          // Fallback to reading file
          const content = fs.readFileSync(logFile, 'utf8');
          console.log(content);
        });
      } else {
        const content = fs.readFileSync(logFile, 'utf8');
        const linesArray = content.split('\n');
        const lastLines = linesArray.slice(-parseInt(lines));
        console.log(lastLines.join('\n'));
      }
    }
  }
}

module.exports = Monitor;
