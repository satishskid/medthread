/**
 * MedThread AI - Automated Test Suite
 * This script performs comprehensive testing of all application features
 * Run in browser console at http://localhost:5176/
 */

class MedThreadTestSuite {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      failures: []
    };
    this.testData = {
      hospital: 'Test General Hospital',
      location: 'Test City, TC',
      doctorName: 'Dr. Test Admin',
      users: [
        { name: 'Dr. John Smith', role: 'doctor', username: 'jsmith', password: 'test123' },
        { name: 'Nurse Jane Doe', role: 'nurse', username: 'jdoe', password: 'test456' },
        { name: 'Admin Bob Wilson', role: 'admin', username: 'bwilson', password: 'test789' }
      ]
    };
  }

  // Utility methods
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    this.testResults.total++;
    try {
      this.log(`Testing: ${name}`);
      await testFn();
      this.testResults.passed++;
      this.log(`PASSED: ${name}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.failures.push({ name, error: error.message });
      this.log(`FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  // Test helper methods
  clickElement(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.click();
    return element;
  }

  fillInput(selector, value) {
    const input = document.querySelector(selector);
    if (!input) throw new Error(`Input not found: ${selector}`);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return input;
  }

  selectOption(selector, value) {
    const select = document.querySelector(selector);
    if (!select) throw new Error(`Select not found: ${selector}`);
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return select;
  }

  assertElementExists(selector, message) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(message || `Element should exist: ${selector}`);
    return element;
  }

  assertElementNotExists(selector, message) {
    const element = document.querySelector(selector);
    if (element) throw new Error(message || `Element should not exist: ${selector}`);
  }

  assertTextContent(selector, expectedText, message) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    if (!element.textContent.includes(expectedText)) {
      throw new Error(message || `Expected text '${expectedText}' not found in element`);
    }
  }

  // Clear all localStorage data for fresh testing
  clearTestData() {
    localStorage.clear();
    this.log('Cleared all localStorage data');
  }

  // Onboarding Flow Tests
  async testOnboardingFlow() {
    this.log('=== STARTING ONBOARDING FLOW TESTS ===');

    await this.test('Step 1: Specialty Selection Display', async () => {
      this.assertElementExists('h2', 'Specialty selection header should exist');
      this.assertTextContent('h2', 'Choose Your Medical Specialty');
      
      // Check all specialties are present
      const specialties = ['fertility', 'pediatrics', 'radiology', 'general'];
      specialties.forEach(specialty => {
        this.assertElementExists(`button[onclick*="${specialty}"], button:has-text("${specialty}")`); 
      });
    });

    await this.test('Step 1: Select Fertility Specialty', async () => {
      // Find and click fertility specialty
      const fertilityButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Fertility'));
      if (!fertilityButton) throw new Error('Fertility specialty button not found');
      
      fertilityButton.click();
      await this.wait(500);
      
      // Should now be on step 2
      this.assertTextContent('h2', 'Personalize Your Setup');
    });

    await this.test('Step 2: Fill Personalization Data', async () => {
      // Fill required fields
      this.fillInput('input[placeholder*="Dr. Jane Smith"]', this.testData.doctorName);
      this.fillInput('input[placeholder*="General Hospital"]', this.testData.hospital);
      this.fillInput('input[placeholder*="New York"]', this.testData.location);
      
      // Click continue
      const continueBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Continue'));
      if (!continueBtn) throw new Error('Continue button not found');
      
      continueBtn.click();
      await this.wait(500);
      
      // Should now be on step 3
      this.assertTextContent('h2', 'Create User Accounts');
    });

    await this.test('Step 3: Create User Accounts', async () => {
      // Create test users
      for (const user of this.testData.users) {
        this.fillInput('#newUserName', user.name);
        this.selectOption('#newUserRole', user.role);
        this.fillInput('#newUserUsername', user.username);
        this.fillInput('#newUserPassword', user.password);
        
        // Click Add User
        const addBtn = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('Add User'));
        if (!addBtn) throw new Error('Add User button not found');
        
        addBtn.click();
        await this.wait(300);
      }
      
      // Verify users were created
      this.testData.users.forEach(user => {
        this.assertTextContent('body', user.name);
        this.assertTextContent('body', user.username);
      });
      
      // Continue to step 4
      const continueBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Continue') && !btn.disabled);
      if (!continueBtn) throw new Error('Continue button not found or disabled');
      
      continueBtn.click();
      await this.wait(500);
      
      this.assertTextContent('h2', 'AI Configuration');
    });

    await this.test('Step 4: AI Configuration (Skip)', async () => {
      // Skip API key for now
      const continueBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Continue'));
      if (!continueBtn) throw new Error('Continue button not found');
      
      continueBtn.click();
      await this.wait(500);
      
      this.assertTextContent('h2', 'Review Configuration');
    });

    await this.test('Step 5: Complete Setup', async () => {
      // Verify configuration display
      this.assertTextContent('body', this.testData.hospital);
      this.assertTextContent('body', this.testData.location);
      
      // Complete setup
      const completeBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Complete Setup'));
      if (!completeBtn) throw new Error('Complete Setup button not found');
      
      completeBtn.click();
      await this.wait(2000); // Wait for page reload
      
      // Should now be on login page
      this.assertTextContent('body', 'Sign In');
    });
  }

  // Login System Tests
  async testLoginSystem() {
    this.log('=== STARTING LOGIN SYSTEM TESTS ===');

    await this.test('Login Page Display', async () => {
      this.assertElementExists('input[placeholder*="username"]', 'Username input should exist');
      this.assertElementExists('input[type="password"]', 'Password input should exist');
      this.assertTextContent('body', this.testData.hospital);
      
      // Check available users are displayed
      this.testData.users.forEach(user => {
        this.assertTextContent('body', user.name);
      });
    });

    await this.test('Invalid Login Attempt', async () => {
      this.fillInput('input[placeholder*="username"]', 'invalid');
      this.fillInput('input[type="password"]', 'invalid');
      
      const signInBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Sign In'));
      if (!signInBtn) throw new Error('Sign In button not found');
      
      signInBtn.click();
      await this.wait(500);
      
      this.assertTextContent('body', 'Invalid username or password');
    });

    await this.test('Valid Doctor Login', async () => {
      const doctor = this.testData.users.find(u => u.role === 'doctor');
      
      this.fillInput('input[placeholder*="username"]', doctor.username);
      this.fillInput('input[type="password"]', doctor.password);
      
      const signInBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Sign In'));
      if (!signInBtn) throw new Error('Sign In button not found');
      
      signInBtn.click();
      await this.wait(2000);
      
      // Should now be in main application
      this.assertElementExists('.sidebar, nav, [class*="nav"]', 'Main app navigation should exist');
    });
  }

  // Core Features Tests
  async testCoreFeatures() {
    this.log('=== STARTING CORE FEATURES TESTS ===');

    await this.test('Main Application Interface', async () => {
      // Check main UI elements exist
      this.assertElementExists('body', 'Main app should be loaded');
      
      // Look for common UI elements
      const hasChat = document.querySelector('[class*="chat"], [id*="chat"]');
      const hasPatient = document.querySelector('[class*="patient"], [id*="patient"]');
      const hasAI = document.querySelector('[class*="ai"], [id*="ai"]');
      
      if (!hasChat && !hasPatient && !hasAI) {
        throw new Error('No main application features found');
      }
    });

    await this.test('Navigation Elements', async () => {
      // Check for navigation tabs or menu items
      const navElements = document.querySelectorAll('button, a, [role="tab"], [class*="tab"]');
      if (navElements.length === 0) {
        throw new Error('No navigation elements found');
      }
    });
  }

  // Data Persistence Tests
  async testDataPersistence() {
    this.log('=== STARTING DATA PERSISTENCE TESTS ===');

    await this.test('localStorage Data Integrity', async () => {
      const requiredKeys = ['licenseConfig', 'hospitalUsers', 'hospitalInfo', 'setupComplete'];
      
      requiredKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (!data) throw new Error(`Required localStorage key missing: ${key}`);
        
        // Verify JSON data is valid
        if (key !== 'setupComplete') {
          try {
            JSON.parse(data);
          } catch (e) {
            throw new Error(`Invalid JSON in localStorage key: ${key}`);
          }
        }
      });
    });

    await this.test('User Data Verification', async () => {
      const users = JSON.parse(localStorage.getItem('hospitalUsers') || '[]');
      if (users.length !== this.testData.users.length) {
        throw new Error(`Expected ${this.testData.users.length} users, found ${users.length}`);
      }
      
      this.testData.users.forEach(testUser => {
        const found = users.find(u => u.username === testUser.username);
        if (!found) throw new Error(`User not found: ${testUser.username}`);
        if (found.role !== testUser.role) throw new Error(`Wrong role for ${testUser.username}`);
      });
    });
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting MedThread AI Comprehensive Test Suite');
    this.log('=' .repeat(60));
    
    try {
      // Clear data and start fresh
      this.clearTestData();
      await this.wait(1000);
      
      // Reload page to start onboarding
      window.location.reload();
      await this.wait(3000);
      
      // Run test suites
      await this.testOnboardingFlow();
      await this.testLoginSystem();
      await this.testCoreFeatures();
      await this.testDataPersistence();
      
    } catch (error) {
      this.log(`Critical test failure: ${error.message}`, 'error');
    }
    
    this.printResults();
  }

  // Print test results
  printResults() {
    this.log('=' .repeat(60));
    this.log('🏁 TEST EXECUTION COMPLETE');
    this.log('=' .repeat(60));
    
    console.log(`\n📊 TEST SUMMARY:`);
    console.log(`   Total Tests: ${this.testResults.total}`);
    console.log(`   ✅ Passed: ${this.testResults.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.failed}`);
    console.log(`   📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.failures.length > 0) {
      console.log(`\n🐛 FAILURES:`);
      this.testResults.failures.forEach((failure, index) => {
        console.log(`   ${index + 1}. ${failure.name}: ${failure.error}`);
      });
    }
    
    // Release readiness assessment
    const passRate = (this.testResults.passed / this.testResults.total) * 100;
    console.log(`\n🎯 RELEASE READINESS:`);
    
    if (passRate >= 95) {
      console.log(`   ✅ READY FOR RELEASE (${passRate.toFixed(1)}% pass rate)`);
    } else if (passRate >= 80) {
      console.log(`   ⚠️  NEEDS MINOR FIXES (${passRate.toFixed(1)}% pass rate)`);
    } else {
      console.log(`   ❌ NOT READY FOR RELEASE (${passRate.toFixed(1)}% pass rate)`);
    }
    
    return {
      ready: passRate >= 95,
      passRate,
      results: this.testResults
    };
  }
}

// Auto-run tests when script is loaded
const testSuite = new MedThreadTestSuite();

// Export for manual execution
window.MedThreadTests = {
  runAll: () => testSuite.runAllTests(),
  runOnboarding: () => testSuite.testOnboardingFlow(),
  runLogin: () => testSuite.testLoginSystem(),
  runCore: () => testSuite.testCoreFeatures(),
  runPersistence: () => testSuite.testDataPersistence(),
  clearData: () => testSuite.clearTestData()
};

console.log('🧪 MedThread Test Suite Loaded!');
console.log('Run tests with: MedThreadTests.runAll()');
console.log('Or run individual suites: MedThreadTests.runOnboarding(), etc.');