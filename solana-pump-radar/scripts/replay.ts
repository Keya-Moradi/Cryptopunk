#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { config } from '../src/config';

async function replayFixture(fixturePath: string) {
  const fullPath = path.resolve(__dirname, '..', fixturePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`Fixture not found: ${fullPath}`);
    process.exit(1);
  }

  const fixtureData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

  console.log(`Replaying fixture: ${fixturePath}`);
  console.log(`Transactions: ${Array.isArray(fixtureData) ? fixtureData.length : 1}`);

  const url = `http://localhost:${config.port}/webhooks/helius`;
  console.log(`Sending to: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.webhookSecret}`,
      },
      body: JSON.stringify(fixtureData),
    });

    console.log(`Response status: ${response.status}`);

    const body = await response.json();
    console.log('Response body:', JSON.stringify(body, null, 2));

    if (!response.ok) {
      console.error('Request failed');
      process.exit(1);
    }

    console.log('✓ Replay successful');
  } catch (error) {
    console.error('Error replaying fixture:', error);
    process.exit(1);
  }
}

const fixturePath = process.argv[2] || 'fixtures/pumpfun-create.sample.json';
replayFixture(fixturePath);