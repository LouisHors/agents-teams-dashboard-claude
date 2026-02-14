const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

async function doctor() {
  console.log(chalk.blue.bold('\n=== Team Monitor Doctor ===\n'));

  const checks = [
    { name: 'Node.js', check: checkNode },
    { name: 'npm', check: checkNpm },
    { name: 'Claude CLI', check: checkClaudeCli },
    { name: 'Ports', check: checkPorts },
    { name: 'Disk Space', check: checkDiskSpace }
  ];

  let allPassed = true;

  for (const { name, check } of checks) {
    try {
      const result = await check();
      console.log(`${chalk.green('✓')} ${name.padEnd(15)} ${result}`);
    } catch (error) {
      console.log(`${chalk.red('✗')} ${name.padEnd(15)} ${error.message}`);
      allPassed = false;
    }
  }

  console.log('');

  if (allPassed) {
    console.log(chalk.green.bold('✓ All checks passed! You can use team-monitor.\n'));
  } else {
    console.log(chalk.yellow.bold('! Some checks failed. Please fix the issues above.\n'));
    process.exit(1);
  }
}

function checkNode() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);

  if (major < 18) {
    throw new Error(`Node.js ${version} (requires >= 18)`);
  }

  return version;
}

function checkNpm() {
  try {
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    return `v${version}`;
  } catch {
    throw new Error('npm not found');
  }
}

function checkClaudeCli() {
  try {
    execSync('which claude', { stdio: 'pipe' });
    return 'Installed';
  } catch {
    return chalk.yellow('Not installed (optional)');
  }
}

async function checkPorts() {
  const ports = [3001, 5173];
  const inUse = [];

  for (const port of ports) {
    try {
      execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
      inUse.push(port);
    } catch {
      // Port is free
    }
  }

  if (inUse.length > 0) {
    return chalk.yellow(`Ports ${inUse.join(', ')} in use`);
  }

  return 'All available';
}

function checkDiskSpace() {
  const stats = fs.statSync('/');
  // Simplified check - just verify we can write to temp
  const tmpDir = require('os').tmpdir();
  const testFile = path.join(tmpDir, '.team-monitor-test');

  try {
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return 'OK';
  } catch {
    throw new Error('Cannot write to temp directory');
  }
}

module.exports = { doctor };
