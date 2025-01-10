import http from 'k6/http';
import { check } from 'k6';
import { sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Define custom metrics
export const registrationRate = new Rate('registration_rate');
export const registrationTime = new Trend('registration_time');

// To track already generated mobile numbers
const generatedMobileNumbers = new Set();

// Test options
export const options = {
  scenarios: {
    hourly_users: {
      executor: 'constant-arrival-rate',
      rate: 17, // 17 users per minute
      timeUnit: '1m',
      duration: '40m', // Run for 40 minutes
      preAllocatedVUs: 700, // Allocate enough VUs for the test
      maxVUs: 750, // Allow some buffer for unexpected load
    },
  },
};

export default function () {
  // API endpoint and payload setup
  const registerUrl = 'http://195.35.23.253:3001/api/user/register';

  let mobileNumber;

  // Generate a unique 10-digit mobile number starting with '9'
  do {
    mobileNumber = 9000000000 + Math.floor(Math.random() * 1e9); // 10-digit number starting with '9'
  } while (generatedMobileNumbers.has(mobileNumber)); // Ensure the number is unique

  // Add the mobile number to the set to track uniqueness
  generatedMobileNumbers.add(mobileNumber);

  const payload = JSON.stringify({
    mobile: mobileNumber, // Send the mobile number as a number
    password: 'Password@123',
    inviteCode: '869017VDQYf8bfb8', // Replace with a valid invite code if required
  });

  const headers = { 'Content-Type': 'application/json' };

  // Measure registration request time
  const startTime = Date.now();
  const response = http.post(registerUrl, payload, { headers });
  const endTime = Date.now();

  // Record registration time metric
  registrationTime.add(endTime - startTime);

  // Check and log results
  if (response.status === 201) {
    registrationRate.add(1); // Add to success rate metric
    console.log(`Registered successfully with mobile: ${mobileNumber}`);
  } else {
    console.error(`Registration failed (status: ${response.status}) - ${response.body}`);
  }

  // Simulate realistic user behavior
  sleep(3);
}
