const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();
  
  // Capture errors
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.setViewport({width: 375, height: 812});
  await page.goto('http://localhost:3000/shop.html');
  
  await page.waitForSelector('.bento-item');
  console.log('Clicking product...');
  await page.click('.bento-item:nth-child(1)');
  
  await page.waitForTimeout(1000);
  
  // Check if panel has "active" class
  const isPanelActive = await page.evaluate(() => {
    return document.querySelector('#product-detail-panel')?.classList.contains('active');
  });
  console.log('Panel is active:', isPanelActive);
  
  await browser.close();
})();
