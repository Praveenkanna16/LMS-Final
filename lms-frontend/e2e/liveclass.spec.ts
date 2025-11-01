import { test, expect } from '@playwright/test';

test.describe('Live Class E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'student@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('**/dashboard');
  });

  test('should join a live class', async ({ page }) => {
    // Navigate to live classes
    await page.click('text=Live Classes');
    
    // Click join button on first class
    await page.click('button:has-text("Join Class")');
    
    // Wait for video container
    await expect(page.locator('video')).toBeVisible();
    
    // Verify class title is displayed
    await expect(page.locator('h1')).toContainText('Live Class');
  });

  test('should send a chat message', async ({ page }) => {
    // Join a class
    await page.goto('http://localhost:5173/live-class/1');
    
    // Open chat
    await page.click('button:has-text("Chat")');
    
    // Type and send message
    await page.fill('textarea[placeholder*="message"]', 'Hello from test!');
    await page.press('textarea[placeholder*="message"]', 'Enter');
    
    // Verify message appears
    await expect(page.locator('text=Hello from test!')).toBeVisible();
  });

  test('should raise hand', async ({ page }) => {
    // Join a class
    await page.goto('http://localhost:5173/live-class/1');
    
    // Click raise hand button
    await page.click('button:has-text("Raise Hand")');
    
    // Verify hand is raised (button changes state)
    await expect(page.locator('button:has-text("Lower Hand")')).toBeVisible();
  });

  test('should use whiteboard tools', async ({ page }) => {
    // Join as teacher
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('http://localhost:5173/live-class/1');
    
    // Open whiteboard
    await page.click('button:has-text("Whiteboard")');
    
    // Select pen tool
    await page.click('button[aria-label="Pen"]');
    
    // Draw on canvas
    const canvas = await page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Verify canvas is interactive
    await expect(canvas).toBeVisible();
  });

  test('should download recorded video', async ({ page }) => {
    // Navigate to recorded content
    await page.click('text=Recorded Content');
    
    // Find first video
    await page.click('text=View Details', { first: true });
    
    // Click download button
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download Video")')
    ]);
    
    // Verify download started
    expect(download.suggestedFilename()).toContain('.mp4');
  });

  test('should enroll in a batch', async ({ page }) => {
    // Navigate to browse batches
    await page.goto('http://localhost:5173/browse-batches');
    
    // Search for batch
    await page.fill('input[placeholder*="Search"]', 'Mathematics');
    
    // Click request enrollment
    await page.click('button:has-text("Request to Join")', { first: true });
    
    // Verify success toast
    await expect(page.locator('text=Enrollment request sent')).toBeVisible({ timeout: 5000 });
  });
});
