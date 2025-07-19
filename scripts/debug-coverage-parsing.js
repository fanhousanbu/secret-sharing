#!/usr/bin/env node

/**
 * Debug script to analyze coverage output format
 */

const { execSync } = require('child_process');

console.log('🔍 Debugging coverage output format...\n');

try {
  // Run tests and capture output
  console.log('1. Running tests with coverage...');
  const output = execSync('npm run test:cov', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });

  console.log('2. Analyzing output format...');
  
  // Find the coverage table
  const lines = output.split('\n');
  let coverageTableFound = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('All files')) {
      console.log(`✅ Found coverage line at line ${i + 1}:`);
      console.log(`   Raw line: "${line}"`);
      
      // Try different parsing approaches
      console.log('\n3. Testing different parsing approaches:');
      
      // Approach 1: Split by |
      const parts = line.split('|').map(p => p.trim());
      console.log('   Split by |:', parts);
      
      if (parts.length >= 5) {
        console.log('   ✅ Parsed values:');
        console.log(`     Statements: ${parts[1]}`);
        console.log(`     Branches: ${parts[2]}`);
        console.log(`     Functions: ${parts[3]}`);
        console.log(`     Lines: ${parts[4]}`);
      }
      
      // Approach 2: Regex matching
      const regex = /All files\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)/;
      const match = line.match(regex);
      
      if (match) {
        console.log('   ✅ Regex match successful:');
        console.log(`     Statements: ${match[1]}%`);
        console.log(`     Branches: ${match[2]}%`);
        console.log(`     Functions: ${match[3]}%`);
        console.log(`     Lines: ${match[4]}%`);
      } else {
        console.log('   ❌ Regex match failed');
      }
      
      // Approach 3: Current bash parsing simulation
      console.log('\n4. Testing current bash parsing logic:');
      
      const statements = line.match(/.*\|\s+(\d+\.\d+)\s+\|/)?.[1] || '0';
      const branches = line.match(/.*\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|/)?.[2] || '0';
      const functions = line.match(/.*\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|/)?.[3] || '0';
      const lines_coverage = line.match(/.*\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)/)?.[4] || '0';
      
      console.log(`   Current bash parsing results:`);
      console.log(`     Statements: ${statements}%`);
      console.log(`     Branches: ${branches}%`);
      console.log(`     Functions: ${functions}%`);
      console.log(`     Lines: ${lines_coverage}%`);
      
      coverageTableFound = true;
      break;
    }
  }
  
  if (!coverageTableFound) {
    console.log('❌ Could not find coverage table in output');
    console.log('Raw output:', output);
  }
  
} catch (error) {
  console.log('❌ Debug failed:', error.message);
  process.exit(1);
} 