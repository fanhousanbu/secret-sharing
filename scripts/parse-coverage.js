#!/usr/bin/env node

/**
 * Parse coverage data from Jest output
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('📊 Parsing coverage data...\n');

try {
  // Run tests and capture output
  console.log('1. Running tests with coverage...');
  const output = execSync('npm run test:cov', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });

  // Find the coverage line
  const lines = output.split('\n');
  let coverageLine = null;
  
  for (const line of lines) {
    if (line.includes('All files')) {
      coverageLine = line;
      break;
    }
  }
  
  if (!coverageLine) {
    console.log('❌ Could not find coverage data');
    process.exit(1);
  }
  
  console.log('2. Found coverage line:', coverageLine);
  
  // Parse using split method (more reliable)
  const parts = coverageLine.split('|').map(p => p.trim());
  console.log('3. Parsed parts:', parts);
  
  if (parts.length >= 5) {
    const statements = parts[1];
    const branches = parts[2];
    const functions = parts[3];
    const lines = parts[4];
    
    console.log('✅ Parsed coverage data:');
    console.log(`   Statements: ${statements}%`);
    console.log(`   Branches: ${branches}%`);
    console.log(`   Functions: ${functions}%`);
    console.log(`   Lines: ${lines}%`);
    
    // Write to file for GitHub Actions
    const outputData = {
      statements,
      branches,
      functions,
      lines
    };
    
    fs.writeFileSync('coverage-data.json', JSON.stringify(outputData, null, 2));
    console.log('\n✅ Coverage data written to coverage-data.json');
    
    // Also write as environment variables format
    const envOutput = `STATEMENTS=${statements}
BRANCHES=${branches}
FUNCTIONS=${functions}
LINES=${lines}`;
    
    fs.writeFileSync('coverage-env.txt', envOutput);
    console.log('✅ Coverage data written to coverage-env.txt');
    
  } else {
    console.log('❌ Failed to parse coverage data');
    console.log('Parts:', parts);
    process.exit(1);
  }
  
} catch (error) {
  console.log('❌ Failed to parse coverage:', error.message);
  process.exit(1);
} 