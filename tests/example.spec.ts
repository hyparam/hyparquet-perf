import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const client = await page.context().newCDPSession(page);

  // Throttle the network, to have stable conditions for performance testing.
  await client.send('Network.overrideNetworkState', {
    offline: false, // must be online to get the page
    downloadThroughput: 400 * 1024 / 8, // 400 kbps
    uploadThroughput: 400 * 1024 / 8, // 400 kbps
    latency: 400, // 400 ms latency
  });

  // Throttle the CPU, to avoid performance differences being hidden by a too fast CPU.
  await client.send('Emulation.setCPUThrottlingRate', { rate: 10 }); // 10x slower

  await page.goto('http://localhost:3000');
})

test('has title', async ({ page }) => {
  await test.step('check title', async () => {
    await expect(page).toHaveTitle(/HighTable/);
  })
});

test('has cell content', async ({ page }) => {
  for (let i=0; i<100; i++) {
    await test.step('first-cell', async () => {
      await expect(page.getByRole('cell', { name: `Name0` })).toBeVisible();
    })
  }
});
