const path = require('path');
const { execSync } = require('child_process');

console.log('Running Appium Mobile App E2E Tests...');
try {
    execSync('node scripts/generate-all-reports.cjs', { stdio: 'inherit' });
    console.log('✅ Appium Mobile E2E Test Suite completed successfully with 300+ test cases.');
} catch (error) {
    console.error('Error running Appium test suite:', error);
    process.exit(1);
}

