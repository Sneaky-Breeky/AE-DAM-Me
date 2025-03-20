const { By, Builder, until } = require('selenium-webdriver');
const assert = require("assert");
const EMAIL = "user@gmail.com";
const PASSWORD = "password"

let driver;

// Runs before all tests, inherently tests login
before(async function () {
    this.timeout(60000);
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

describe("UI - Sanity tests", function () {
    it("UI-001 - User Login Sanity Test", async function () {
        let currentUrl = await driver.getCurrentUrl();
        assert(currentUrl.includes("dashboard"));
    });
});

describe("IMG-UP - Image upload", function () {
    it("IMG-UP-001 - Single JPEG upload", async function () {
    });

    it("IMG-UP-002 - Multiple file upload", async function () {
    });

    it("IMG-UP-003 - Unsupported file upload", async function () {
    });

    it("IMG-UP-004 - Oversized file upload", async function () {
    });
});

describe("IMG-DEL - Image deletion", function () {
    it("IMG-DEL-001 - Single JPEG deletion", async function () {
    });

    it("IMG-DEL-002 - Cancel image deletion", async function () {
    });
});

describe("IMG-EDIT - Image editing", function () {
    it("IMG-EDIT-001 - Single image edit", async function () {
    });
});

describe("IMG-SRCH - Image searching", function () {
    it("IMG-SRCH-001 - Only relevant files/project appear", async function () {
    });
});

describe("IMG-ARCH - Image archiving", function () {
    it("IMG-ARCH-001 - Single image archive", async function () {
    });

    it("IMG-ARCH-002 - Archive access", async function () {
    });

    it("IMG-ARCH-003 - Archived image not displayed", async function () {
    });

    it("IMG-ARCH-004 - Archived image retrieval", async function () {
    });
});

describe("IMG-ARC - Image archiving", function () {
    it("IMG-ARC-001 - Single image archive and access", async function () {
    });

    it("IMG-ARC-002 - Duplicate archive prevention", async function () {
    });
});

describe("IMG-EXP - Image export", function () {
    it("IMG-EXP-001 - Export single image", async function () {
    });

    it("IMG-EXP-002 - Multiple image ZIP export", async function () {
    });

    it("IMG-EXP-003 - Unauthorized export blockage", async function () {
    });
});

describe("PROJ-ORG - Project organization", function () {
    it("PROJ-ORG-001 - Project creation", async function () {
    });

    it("PROJ-ORG-002 - Project deletion", async function () {
    });

    it("PROJ-ORG-003 - Project modification", async function () {
    });

    it("PROJ-ORG-004 - Project creation error handling", async function () {
    });
});

describe("LOG - Log generation", function () {
    it("LOG-001 - Single action log", async function () {
    });

    it("LOG-002 - Multiple action log", async function () {
    });
});

describe("LOG - Log generation", function () {
    it("LOG-001 - Single action log", async function () {
    });

    it("LOG-002 - Multiple action log", async function () {
    });
});

describe("TAG - Image tagging", function () {
    it("TAG-001 - Assign tags to images", async function () {
    });

    it("TAG-002 - Too many tags", async function () {
    });

    it("TAG-003 - Tag deletion", async function () {
    });

    it("TAG-004 - Tag deletion", async function () {
    });

    it("TAG-005 - AI tag generation", async function () {
    });

    it("TAG-006 - AI tag retrieval", async function () {
    });

    it("TAG-007 - Invalid tag format", async function () {
    });
});

describe("SORT - Image sorting", function () {
    it("SORT-001 - Sort images by upload date", async function () {
    });

    it("SORT-002 - No tag sorting", async function () {
    });

    it("SORT-003 - Complex query", async function () {
    });

    it("SORT-004 - Operator query", async function () {
    });

    it("SORT-005 - AI query", async function () {
    });

    it("SORT-006 - Sorting under load conditions", async function () {
    });

    it("SORT-007 - Compatability with retrieval and display", async function () {
    });
});

after(async () => await driver.quit());