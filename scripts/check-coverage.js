#!/usr/bin/env node

/**
 * Coverage Check Script
 * Used to check if test coverage meets the required thresholds locally
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking test coverage...\n');

try {
  // Run tests and get coverage data
  const output = execSync('npm run test:cov', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });

  // Parse coverage data
  const coverageMatch = output.match(/All files\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)/);
  
  if (coverageMatch) {
    const [, statements, branches, functions, lines] = coverageMatch;
    
    console.log('📊 Coverage Report:');
    console.log(`  Statements: ${statements}%`);
    console.log(`  Branches: ${branches}%`);
    console.log(`  Functions: ${functions}%`);
    console.log(`  Lines: ${lines}%`);
    console.log('');
    
    // Check if thresholds are met
    const thresholds = {
      statements: 65,
      branches: 50,
      functions: 55,
      lines: 65
    };
    
    const results = {
      statements: parseFloat(statements) >= thresholds.statements,
      branches: parseFloat(branches) >= thresholds.branches,
      functions: parseFloat(functions) >= thresholds.functions,
      lines: parseFloat(lines) >= thresholds.lines
    };
    
    let allPassed = true;
    
    Object.entries(results).forEach(([key, passed]) => {
      const value = key === 'statements' ? statements : 
                   key === 'branches' ? branches :
                   key === 'functions' ? functions : lines;
      const threshold = thresholds[key];
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${key}: ${value}% (threshold: ${threshold}%)`);
      
      if (!passed) {
        allPassed = false;
      }
    });
    
    console.log('');
    
    if (allPassed) {
      console.log('🎉 All coverage metrics meet the requirements! Safe to push code.');
      process.exit(0);
    } else {
      console.log('⚠️  Some coverage metrics are below the required thresholds. Please add more tests.');
      console.log('💡 Suggestions:');
      console.log('   - Check files with low coverage');
      console.log('   - Add more test cases');
      console.log('   - Ensure all branches are covered by tests');
      process.exit(1);
    }
  } else {
    console.log('❌ Unable to parse coverage data');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Failed to run tests:', error.message);
  process.exit(1);
} 