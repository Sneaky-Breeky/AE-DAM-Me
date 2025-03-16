driver = await new Builder().forBrowser(Browser.CHROME).build();
await driver.get('https://thankful-field-0410c1a1e.6.azurestaticapps.net/#/login');

await driver.quit();