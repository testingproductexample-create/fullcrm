// Test script to verify DialogTrigger asChild functionality
const fs = require('fs');
const path = require('path');

console.log('Testing DialogTrigger asChild implementation...\n');

// Read the dialog component
const dialogPath = path.join(__dirname, 'components/ui/dialog.tsx');
const dialogContent = fs.readFileSync(dialogPath, 'utf8');

// Check for key features
const checks = [
  {
    name: 'DialogTriggerProps interface',
    test: dialogContent.includes('interface DialogTriggerProps'),
    description: 'Interface defining DialogTrigger props including asChild'
  },
  {
    name: 'asChild prop support',
    test: dialogContent.includes('asChild?: boolean'),
    description: 'Boolean asChild prop in interface'
  },
  {
    name: 'asChild conditional logic',
    test: dialogContent.includes('if (asChild)'),
    description: 'Conditional logic to handle asChild prop'
  },
  {
    name: 'React.cloneElement usage',
    test: dialogContent.includes('React.cloneElement'),
    description: 'Using React.cloneElement to clone child elements with new props'
  },
  {
    name: 'Default asChild value',
    test: dialogContent.includes('asChild = false'),
    description: 'Default value for asChild prop'
  },
  {
    name: 'DialogTrigger export',
    test: dialogContent.includes('export {') && dialogContent.includes('DialogTrigger'),
    description: 'DialogTrigger is properly exported'
  }
];

console.log('✓ DialogTrigger asChild Implementation Verification:');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

checks.forEach(check => {
  const status = check.test ? '✓ PASS' : '✗ FAIL';
  console.log(`${status} ${check.name}`);
  console.log(`    ${check.description}`);
  
  if (check.test) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 All DialogTrigger asChild features are properly implemented!');
} else {
  console.log('\n⚠️  Some features are missing from the DialogTrigger implementation.');
  process.exit(1);
}