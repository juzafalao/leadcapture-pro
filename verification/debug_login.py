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

            # Listen to console
            page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
            page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

            # Navigate to login
            print("Navigating to http://localhost:3000/ ...")
            page.goto("http://localhost:3000/")

            # Wait a bit regardless of success
            time.sleep(5)

            # Take screenshot even if form not found
            screenshot_path = "/app/verification/login_debug.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            browser.close()

    except Exception as e:
        print(f"Script Error: {e}")

    finally:
        # Kill the server
        os.kill(server_process.pid, signal.SIGTERM)

if __name__ == "__main__":
    verify_login_image()
