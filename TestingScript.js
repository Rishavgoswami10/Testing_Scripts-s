import http from 'k6/http';
import { check } from 'k6';
import { sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const options = {
  scenarios: {
    hourly_users: {
      executor: 'constant-arrival-rate',
      rate: 17,  // ~17 users per minute
      timeUnit: '1m',
      duration: '24h',
      preAllocatedVUs: 20,
      maxVUs: 50,
    },
  },
};

const registeredUsers = new Set();
const registrationRate = new Rate('registration_rate');

export default function () {
  if (!registeredUsers.has(__VU)) {
    const registerUrl = 'http://195.35.23.253:3001/api/user/register';
    const mobileNumber = Number(`9${Math.floor(Math.random() * 1e9).toString().padStart(9, '0')}`);
    
    const payload = JSON.stringify({
      mobile: mobileNumber,
      password: 'Password@123',
      inviteCode: '869017VDQYf8bfb8',
    });

    const headers = { 'Content-Type': 'application/json' };
    const response = http.post(registerUrl, payload, { headers });
    
    if (response.status === 201) {
      registeredUsers.add(__VU);
      registrationRate.add(1);
      console.log(`VU ${__VU} registered with mobile: ${mobileNumber}`);
    } else {
      console.error(`Registration failed for VU ${__VU}: ${response.body}`);
    }

    sleep(3);
  }
}