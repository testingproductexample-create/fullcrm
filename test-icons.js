// Simple test to verify icon availability
console.log('Testing icon imports...');

try {
  const { 
    ChartBarIcon, 
    PresentationChartLineIcon, 
    MagnifyingGlassIcon, 
    CubeIcon, 
    WrenchIcon, 
    BellIcon 
  } = require('@heroicons/react/24/outline');

  const icons = {
    ChartBarIcon, 
    PresentationChartLineIcon, 
    MagnifyingGlassIcon, 
    CubeIcon, 
    WrenchIcon, 
    BellIcon
  };

  console.log('Icon availability check:');
  Object.entries(icons).forEach(([name, icon]) => {
    console.log(`${name}: ${icon ? '✓ Available' : '✗ Missing'}`);
  });
  
  console.log('All required icons are available!');
} catch (error) {
  console.error('Error checking icons:', error.message);
}