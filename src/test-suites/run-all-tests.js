#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Mon Cercle App
 * This script runs all test suites and generates a coverage report
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

const testSuites = [
  {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    description: 'Testing individual functions and components'
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    description: 'Testing component interactions and API calls'
  },
  {
    name: 'End-to-End Tests',
    command: 'npm run test:e2e',
    description: 'Testing complete user flows'
  }
];

async function runTestSuite(suite) {
  console.log(chalk.blue(`\n=== Running ${suite.name} ===`));
  console.log(chalk.gray(suite.description));
  
  try {
    const { stdout, stderr } = await execAsync(suite.command);
    console.log(stdout);
    if (stderr) console.error(chalk.yellow(stderr));
    return { suite: suite.name, passed: true };
  } catch (error) {
    console.error(chalk.red(`${suite.name} failed:`));
    console.error(error.stdout || error.message);
    return { suite: suite.name, passed: false, error: error.message };
  }
}

async function runAllTests() {
  console.log(chalk.green.bold('\n🧪 Mon Cercle App - Comprehensive Test Suite\n'));
  
  const startTime = Date.now();
  const results = [];

  // Run all test suites
  for (const suite of testSuites) {
    const result = await runTestSuite(suite);
    results.push(result);
  }

  // Generate coverage report
  console.log(chalk.blue('\n=== Generating Coverage Report ==='));
  try {
    await execAsync('npm run test:coverage');
    console.log(chalk.green('✓ Coverage report generated'));
  } catch (error) {
    console.error(chalk.red('Failed to generate coverage report'));
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(chalk.bold('\n📊 Test Summary'));
  console.log(chalk.gray('─'.repeat(50)));
  
  results.forEach(result => {
    const status = result.passed ? chalk.green('✓ PASS') : chalk.red('✗ FAIL');
    console.log(`${status} ${result.suite}`);
    if (result.error) {
      console.log(chalk.red(`  └─ ${result.error}`));
    }
  });

  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Total: ${results.length} suites`);
  console.log(chalk.green(`Passed: ${passed}`));
  if (failed > 0) console.log(chalk.red(`Failed: ${failed}`));
  console.log(`Duration: ${duration}s`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});