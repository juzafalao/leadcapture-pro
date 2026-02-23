from playwright.sync_api import sync_playwright
import time
import subprocess
import os
import signal

def verify_login_image():
    # Start the static server
    server_process = subprocess.Popen(
        ["python3", "-m", "http.server", "3000", "--directory", "dashboard-build"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    # Give it a moment to start
    time.sleep(2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Navigate to login
            page.goto("http://localhost:3000/")

            # Wait for the image to be present
            # In LoginPage.jsx, the image has alt="LeadCapture Pro" or empty alt but src={logoLogin}
            # We can verify the presence of the login form
            page.wait_for_selector("form")

            # Take screenshot
            screenshot_path = "/app/verification/login_page.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            browser.close()

    finally:
        # Kill the server
        os.kill(server_process.pid, signal.SIGTERM)

if __name__ == "__main__":
    verify_login_image()
