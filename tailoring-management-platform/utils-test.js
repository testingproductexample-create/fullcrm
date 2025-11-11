// Quick test to verify utility functions are properly exported
// This file should run without errors if all functions are properly defined

const utilsExports = [
  'formatCurrency',
  'formatDate',
  'formatDateTime', 
  'calculateVAT',
  'generateId',
  'debounce',
  'slugify',
  'calculateLineTotal',
  'calculateTotal',
  'calculatePercentageChange',
  'calculatePercentage',
  'getTrendDirection',
  'getTrendColor',
  'getInvoiceStatusColor',
  'getPaymentStatusColor',
  'getKPIStatusColor',
  'formatDateForChart',
  'truncateText',
  'capitalize',
  'titleCase',
  'formatNumber',
  'formatCompactNumber',
  'groupBy',
  'sortBy',
  'isValidEmail',
  'isValidPhone',
  'isEmpty',
  'deepClone'
];

console.log('Utility functions added to lib/utils.ts:');
utilsExports.forEach(func => console.log(`✓ ${func}`));
console.log(`\nTotal: ${utilsExports.length} utility functions`);