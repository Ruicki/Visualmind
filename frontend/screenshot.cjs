const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1024 });
        
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        
        const screenshotPath = path.join('C:\\Users\\ricar\\.gemini\\antigravity\\brain\\2823ced4-6c27-49b0-a4eb-9fef517be556', 'home_overlap.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        console.log('Screenshot saved to:', screenshotPath);
        
        // Also capture the admin products page
        await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
        const adminPath = path.join('C:\\Users\\ricar\\.gemini\\antigravity\\brain\\2823ced4-6c27-49b0-a4eb-9fef517be556', 'admin_overlap.png');
        await page.screenshot({ path: adminPath, fullPage: true });
        
        console.log('Admin screenshot saved to:', adminPath);

        await browser.close();
    } catch (err) {
        console.error(err);
    }
})();
