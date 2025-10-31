#!/usr/bin/env node

/**
 * Test Script: Exception Days Blocking for Leave Requests
 * 
 * This script verifies that the exception days functionality properly blocks
 * leave and OD requests when they overlap with scheduled exception days.
 * 
 * Usage: node test-exception-days-blocking.js
 */

import fetch from 'node-fetch';
import { format, addDays } from 'date-fns';

const API_BASE_URL = 'http://localhost:3009';

// Test configuration
const TEST_CONFIG = {
  // These would be actual credentials - replace with test user credentials
  testUser: {
    username: 'student_test_user', // Replace with actual test student username
    password: 'test_password'      // Replace with actual test password
  },
  adminUser: {
    username: 'admin',             // Replace with actual admin username  
    password: 'admin123'           // Replace with actual admin password
  }
};

class ExceptionDaysTest {
  constructor() {
    this.studentToken = null;
    this.adminToken = null;
    this.testExceptionDayId = null;
  }

  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: username, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return data.access_token;
    } catch (error) {
      console.error(`Login failed for ${username}:`, error.message);
      throw error;
    }
  }

  async createExceptionDay(token, date, reason) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/exception-days`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date,
          reason,
          description: 'Test exception day for blocking leave requests'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create exception day');
      }

      return data.id;
    } catch (error) {
      console.error('Failed to create exception day:', error.message);
      throw error;
    }
  }

  async deleteExceptionDay(token, exceptionDayId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/exception-days/${exceptionDayId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete exception day');
      }

      return true;
    } catch (error) {
      console.error('Failed to delete exception day:', error.message);
      return false;
    }
  }

  async createLeaveRequest(token, startDate, endDate, totalDays) {
    try {
      const response = await fetch(`${API_BASE_URL}/leave-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startDate,
          endDate,
          totalDays,
          subject: 'Test Leave Request',
          description: 'Testing exception days blocking functionality',
          duration_type: 'full_day'
        })
      });

      const data = await response.json();
      return { success: response.ok, data, status: response.status };
    } catch (error) {
      console.error('Failed to create leave request:', error.message);
      return { success: false, error: error.message };
    }
  }

  async createODRequest(token, startDate, endDate, totalDays) {
    try {
      const response = await fetch(`${API_BASE_URL}/od-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startDate,
          endDate,
          totalDays,
          purpose: 'Test OD Request',
          destination: 'Test Location',
          description: 'Testing exception days blocking functionality for OD requests',
          duration_type: 'full_day'
        })
      });

      const data = await response.json();
      return { success: response.ok, data, status: response.status };
    } catch (error) {
      console.error('Failed to create OD request:', error.message);
      return { success: false, error: error.message };
    }
  }

  async runTests() {
    console.log('🧪 Starting Exception Days Blocking Tests...\n');

    try {
      // Step 1: Login as admin
      console.log('1️⃣ Logging in as admin...');
      this.adminToken = await this.login(TEST_CONFIG.adminUser.username, TEST_CONFIG.adminUser.password);
      console.log('✅ Admin login successful\n');

      // Step 2: Login as student
      console.log('2️⃣ Logging in as student...');
      this.studentToken = await this.login(TEST_CONFIG.testUser.username, TEST_CONFIG.testUser.password);
      console.log('✅ Student login successful\n');

      // Step 3: Create a test exception day for tomorrow
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      console.log(`3️⃣ Creating exception day for ${tomorrow}...`);
      this.testExceptionDayId = await this.createExceptionDay(
        this.adminToken,
        tomorrow,
        'Test Exception Day - No Leave Applications'
      );
      console.log(`✅ Exception day created with ID: ${this.testExceptionDayId}\n`);

      // Step 4: Test leave request blocking
      console.log('4️⃣ Testing leave request blocking...');
      const leaveResult = await this.createLeaveRequest(
        this.studentToken,
        tomorrow,
        tomorrow,
        1
      );

      if (!leaveResult.success && leaveResult.status === 400) {
        console.log('✅ Leave request correctly blocked by exception day');
        console.log(`   Error message: ${leaveResult.data.error}\n`);
      } else {
        console.log('❌ Leave request was NOT blocked - this is a problem!');
        console.log('   Expected: 400 status with error message');
        console.log(`   Actual: ${leaveResult.status} - ${JSON.stringify(leaveResult.data)}\n`);
      }

      // Step 5: Test OD request blocking
      console.log('5️⃣ Testing OD request blocking...');
      const odResult = await this.createODRequest(
        this.studentToken,
        tomorrow,
        tomorrow,
        1
      );

      if (!odResult.success && odResult.status === 400) {
        console.log('✅ OD request correctly blocked by exception day');
        console.log(`   Error message: ${odResult.data.error}\n`);
      } else {
        console.log('❌ OD request was NOT blocked - this is a problem!');
        console.log('   Expected: 400 status with error message');
        console.log(`   Actual: ${odResult.status} - ${JSON.stringify(odResult.data)}\n`);
      }

      // Step 6: Test date range blocking
      const dayAfterTomorrow = format(addDays(new Date(), 2), 'yyyy-MM-dd');
      console.log('6️⃣ Testing date range blocking (tomorrow to day after tomorrow)...');
      const rangeResult = await this.createLeaveRequest(
        this.studentToken,
        tomorrow,
        dayAfterTomorrow,
        2
      );

      if (!rangeResult.success && rangeResult.status === 400) {
        console.log('✅ Date range request correctly blocked by exception day');
        console.log(`   Error message: ${rangeResult.data.error}\n`);
      } else {
        console.log('❌ Date range request was NOT blocked - this is a problem!');
        console.log('   Expected: 400 status with error message');
        console.log(`   Actual: ${rangeResult.status} - ${JSON.stringify(rangeResult.data)}\n`);
      }

      // Step 7: Test non-conflicting date (should work)
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      console.log(`7️⃣ Testing non-conflicting date (${nextWeek}) - should succeed...`);
      const nonConflictResult = await this.createLeaveRequest(
        this.studentToken,
        nextWeek,
        nextWeek,
        1
      );

      if (nonConflictResult.success) {
        console.log('✅ Non-conflicting leave request succeeded as expected\n');
      } else {
        console.log('⚠️ Non-conflicting leave request failed - check if there are other issues');
        console.log(`   Status: ${nonConflictResult.status} - ${JSON.stringify(nonConflictResult.data)}\n`);
      }

    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
    } finally {
      // Cleanup: Delete the test exception day
      if (this.testExceptionDayId && this.adminToken) {
        console.log('🧹 Cleaning up test exception day...');
        const deleted = await this.deleteExceptionDay(this.adminToken, this.testExceptionDayId);
        if (deleted) {
          console.log('✅ Test exception day deleted successfully');
        } else {
          console.log('⚠️ Failed to delete test exception day - you may need to delete it manually');
        }
      }
    }

    console.log('\n🎉 Exception Days Blocking Tests Complete!');
  }
}

// Run the tests
const tester = new ExceptionDaysTest();
tester.runTests().catch(console.error);
