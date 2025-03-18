const {By, Builder, until} = require('selenium-webdriver');
const assert = require("assert");
const EMAIL = "user@gmail.com";
const PASSWORD = "password"

describe("User Tests", function () {
    let driver;
    this.timeout(60000);

    // Runs before all tests, inherently tests login
    before(async function () {
        driver = await new Builder().forBrowser("chrome").build();
        await driver.get('https://thankful-field-0410c1a1e.6.azurestaticapps.net/#/login');
        const emailInput = await driver.findElement(By.id("email"));
        const passwordInput = await driver.findElement(By.id("password"));
        const submitButton = await driver.findElement(By.css("button[type='submit']"));
        await emailInput.sendKeys(EMAIL);
        await passwordInput.sendKeys(PASSWORD);
        submitButton.click();
        await driver.wait(until.stalenessOf(emailInput), 30000);
    });

    // Tests Login functionality for normal user
    it("User Login Sanity Test", async function () {
        let currentUrl = await driver.getCurrentUrl();
        assert(currentUrl.includes("dashboard"));
    });

    after(async () => await driver.quit());
});