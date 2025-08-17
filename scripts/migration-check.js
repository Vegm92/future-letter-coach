#!/usr/bin/env node

/**
 * Migration Issue Checker
 * 
 * This script checks for common issues that arise during codebase migrations:
 * - Direct Supabase calls in components that should use hooks
 * - Custom event usage that could be replaced with proper React patterns
 * - Missing prop interfaces
 * - Inconsistent state management patterns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Issues to check for
const checks = {
  directSupabaseCalls: {
    pattern: /supabase\.(from|auth|functions)/g,
    description: "Direct Supabase calls (consider using hooks)",
    severity: "medium"
  },
  customEvents: {
    pattern: /(CustomEvent|addEventListener|dispatchEvent)/g,
    description: "Custom events (consider React context)",
    severity: "high"
  },
  missingErrorHandling: {
    pattern: /catch\s*\(\s*error\s*\)\s*\{\s*console\.(log|error)/g,
    description: "Basic error handling (needs user feedback)",
    severity: "low"
  },
  directNavigation: {
    pattern: /navigate\(\s*['"`]/g,
    description: "Direct navigation calls (ensure state consistency)",
    severity: "medium"
  }
};

function scanFile(filePath, content) {
  const results = [];
  
  for (const [checkName, check] of Object.entries(checks)) {
    const matches = Array.from(content.matchAll(check.pattern));
    
    if (matches.length > 0) {
      results.push({
        file: filePath,
        check: checkName,
        description: check.description,
        severity: check.severity,
        occurrences: matches.length,
        lines: matches.map(match => {
          const beforeMatch = content.substring(0, match.index);
          const lineNumber = beforeMatch.split('\n').length;
          return lineNumber;
        })
      });
    }
  }
  
  return results;
}

function scanDirectory(dirPath, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  let allResults = [];
  
  function scanRecursive(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .git, dist, build directories
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          scanRecursive(itemPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        const content = fs.readFileSync(itemPath, 'utf8');
        const results = scanFile(path.relative(process.cwd(), itemPath), content);
        allResults = allResults.concat(results);
      }
    }
  }
  
  scanRecursive(dirPath);
  return allResults;
}

function generateReport(results) {
  console.log('\n🔍 Migration Issue Analysis Report\n');
  console.log('=' .repeat(50));
  
  if (results.length === 0) {
    console.log('✅ No issues found!');
    return;
  }
  
  // Group by severity
  const bySeverity = results.reduce((acc, result) => {
    if (!acc[result.severity]) acc[result.severity] = [];
    acc[result.severity].push(result);
    return acc;
  }, {});
  
  // Report by severity
  for (const severity of ['high', 'medium', 'low']) {
    if (bySeverity[severity]) {
      console.log(`\n🔴 ${severity.toUpperCase()} SEVERITY (${bySeverity[severity].length} files)\n`);
      
      bySeverity[severity].forEach(result => {
        console.log(`📄 ${result.file}`);
        console.log(`   Issue: ${result.description}`);
        console.log(`   Occurrences: ${result.occurrences}`);
        console.log(`   Lines: ${result.lines.join(', ')}`);
        console.log('');
      });
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`Total files with issues: ${results.length}`);
  console.log(`High severity: ${bySeverity.high?.length || 0}`);
  console.log(`Medium severity: ${bySeverity.medium?.length || 0}`);
  console.log(`Low severity: ${bySeverity.low?.length || 0}`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('1. Address high severity issues first (custom events, state inconsistencies)');
  console.log('2. Refactor direct Supabase calls to use proper hooks');
  console.log('3. Add proper error handling with user feedback');
  console.log('4. Consider implementing React context for cross-component communication');
}

// Main execution
function main() {
  const srcPath = path.join(process.cwd(), 'src');
  console.log(`Scanning ${srcPath} for migration issues...`);
  
  const results = scanDirectory(srcPath);
  generateReport(results);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { scanDirectory, generateReport };
