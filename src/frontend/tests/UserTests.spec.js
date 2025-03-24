const { By, Builder, until } = require('selenium-webdriver');
const assert = require("assert");
const USER_EMAIL = "user@gmail.com";
const ADMIN_EMAIL = "admin@gmail.com";
const PASSWORD = "password"
const API_TIMEOUT = 5000;

let driver;

before(async function () {
    driver = await new Builder().forBrowser("chrome").build();
    await driver.get('https://thankful-field-0410c1a1e.6.azurestaticapps.net/#/login');

});

async function findXPathElement(xpath) {
    await driver.wait(until.elementLocated(By.xpath(xpath)));
    return await driver.findElement(By.xpath(xpath));
}

async function findIdElement(id) {
    await driver.wait(until.elementLocated(By.id(id)));
    return await driver.findElement(By.id(id));
}

function loadBeforeAndAfter(isAdmin = false) {
    before(async function () {
        // Login before each suite
        const emailInput = await findIdElement("email");
        const passwordInput = await await findIdElement("password");
        const submitButton = await driver.findElement(By.css("button[type='submit']"));
        await emailInput.sendKeys(isAdmin ? ADMIN_EMAIL : USER_EMAIL);
        await passwordInput.sendKeys(PASSWORD);
        submitButton.click();

        // Login may require time for database to boot up
        this.timeout(60000);
        await driver.wait(until.stalenessOf(emailInput), 30000);
    })

    after(async function () {
        // Logout after each suite
        const logoutButton = await findXPathElement("//span[text()='Logout']");
        logoutButton.click();
        const logoutConfirmButton = await findXPathElement("//button[text()='Logout']");
        logoutConfirmButton.click();
        await driver.wait(until.stalenessOf(logoutConfirmButton), API_TIMEOUT);
    });
}

describe("UI - Sanity tests", function () {
    loadBeforeAndAfter();

    it("UI-001 - User Login Sanity Test", async function () {
        let currentUrl = await driver.getCurrentUrl();
        assert(currentUrl.includes("dashboard"));
    });
});

describe("PROJ-ORG - Project organization", function () {
    loadBeforeAndAfter(true);

    this.beforeEach(async function () {
        const projectManagementButton = await findXPathElement("//span[text()='Project Management']");
        projectManagementButton.click();
    });

    let testProject = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Project Location"
    };

    let projectAdded = false;

    it("PROJ-ORG-001 - Project creation", async function () {
        // Get list of currently added projects
        const deleteProjectButton = await findXPathElement("//h4[text()='Delete Project']");
        deleteProjectButton.click();
        await driver.wait(until.elementLocated(By.css("tr")));
        const preProjects = await driver.findElements(By.css("tr"));

        // Add project
        const createProjectButton = await findXPathElement("//h4[text()='Create Project']");
        createProjectButton.click();
        const projectNameInput = await findIdElement("project_creation_projectName");
        const projectDescriptionInput = await findIdElement("project_creation_description");
        const projectLocationInput = await findIdElement("project_creation_location");
        await projectNameInput.sendKeys(testProject.name);
        await projectDescriptionInput.sendKeys(testProject.description);
        await projectLocationInput.sendKeys(testProject.location);
        const addProjectButton = await findXPathElement("//span[text()='Add Project']");
        addProjectButton.click();
        this.timeout(API_TIMEOUT);
        await findXPathElement("//span[text()='Project added successfully']");
        // TODO: THE FOLLOWING CODE ISN'T WORKING: imports can't be used outside a module?
        /*
        driver.wait(async function() {
            const projects = await fetchProjects();
            return projects.some((project) => 
                project.name === testProject.name &&
                project.description === testProject.description &&
                project.location === testProject.location
            );
        }, 5000);
        */

        // Check if element is present and get id
        deleteProjectButton.click();
        await driver.wait(until.elementLocated(By.css("tr")));
        const postProjects = await driver.findElements(By.css("tr"));
        assert(postProjects.length === preProjects.length + 1, "Number of projects before add: " + preProjects.length + " vs. after: " + postProjects.length);
        const projectIdElement = await postProjects[postProjects.length - 1].findElement(By.css("td"));
        testProject.id = (await projectIdElement.getText()).replace(/ .*/,'');
        console.log("ID found: " + testProject.id);
        projectAdded = true;
    });

    it("PROJ-ORG-002 - Project deletion", async function () {
        assert(projectAdded, "Project was not added, no test data to delete");
        const idElement = await findXPathElement("//td[text()='" + testProject.id + "']");
        const project = await idElement.findElement(By.xpath("./.."));
        const projectDeleteButton = await project.findElement(By.css("button"));
        projectDeleteButton.click();
        const projectDeleteConfirmButton = await findXPathElement("//span[text()='Yes']");
        projectDeleteConfirmButton.click();
        this.timeout(API_TIMEOUT);
        await findXPathElement("//span[text()='Project deleted successfully']");

        // Check if element is not present (via id)
        const projects = await driver.findElements(By.xpath("//td[text()='" + testProject.id + "']"));
        assert(projects == 0, "Found " + projects + " with same id as test project after deleting");

        const closeButton = await findXPathElement("//h4[text()='Close']");
        closeButton.click();
    });

    /*s
    it("PROJ-ORG-003 - Project modification", async function () {
        assert.fail("Test not implemented");
    });

    it("PROJ-ORG-004 - Project creation error handling", async function () {
        assert.fail("Test not implemented");
    });
    */
});

after(async () => await driver.quit());

/*
describe("IMG-UP - Image upload", function () {
    it("IMG-UP-001 - Single JPEG upload", async function () {
        assert.fail("Test not implemented");
    });

    it("IMG-UP-002 - Multiple file upload", async function () {
        assert.fail("Test not implemented");
    });

    it("IMG-UP-003 - Unsupported file upload", async function () {
        assert.fail("Test not implemented");
    });

    it("IMG-UP-004 - Oversized file upload", async function () {
        assert.fail("Test not implemented");
    });
});

describe("IMG-DEL - Image deletion", function () {
    it("IMG-DEL-001 - Single JPEG deletion", async function () {
        assert.fail("Test not implemented");
    });

    it("IMG-DEL-002 - Cancel image deletion", async function () {
        assert.fail("Test not implemented");
    });
});

describe("IMG-EDIT - Image editing", function () {
    it("IMG-EDIT-001 - Single image edit", async function () {
        assert.fail("Test not implemented");
    });
});

describe("IMG-SRCH - Image searching", function () {
    it("IMG-SRCH-001 - Only relevant files/project appear", async function () {
        assert.fail("Test not implemented");
    });
});

describe("IMG-ARCH - Image archiving", function () {
    it("IMG-ARCH-001 - Single image archive", async function () {
        assert.fail("Test not implemented");
    });

    it("IMG-ARCH-002 - Archive access", async function () {
        assert.fail("Test not implemented");
    });

    it("IMG-ARCH-003 - Archived image not displayed", async function () {
        assert.fail("Test not implemented");
    });

    it("IMG-ARCH-004 - Archived image retrieval", async function () {
        assert.fail("Test not implemented");
    });
});

describe("IMG-ARC - Image archiving", function () {
    it("IMG-ARC-001 - Single image archive and access", async function () {
        assert.fail("Test not implemented");
    });

    it("IMG-ARC-002 - Duplicate archive prevention", async function () {
        assert.fail("Test not implemented");
    });
});

describe("IMG-EXP - Image export", function () {
    it("IMG-EXP-001 - Export single image", async function () {
        assert.fail("Test not implemented");
    });

    it("IMG-EXP-002 - Multiple image ZIP export", async function () {
        assert.fail("Test not implemented");
    });

    it("IMG-EXP-003 - Unauthorized export blockage", async function () {
        assert.fail("Test not implemented");
    });
});

describe("LOG - Log generation", function () {
    it("LOG-001 - Single action log", async function () {
        assert.fail("Test not implemented");
    });

    it("LOG-002 - Multiple action log", async function () {
        assert.fail("Test not implemented");
    });
});


describe("SORT - Image sorting", function () {
    it("SORT-001 - Sort images by upload date", async function () {
        assert.fail("Test not implemented");
    });

    it("SORT-002 - No tag sorting", async function () {
        assert.fail("Test not implemented");
    });

    it("SORT-003 - Complex query", async function () {
        assert.fail("Test not implemented");
    });

    it("SORT-004 - Operator query", async function () {
        assert.fail("Test not implemented");
    });

    it("SORT-005 - AI query", async function () {
        assert.fail("Test not implemented");
    });

    it("SORT-006 - Sorting under load conditions", async function () {
        assert.fail("Test not implemented");
    });

    it("SORT-007 - Compatability with retrieval and display", async function () {
        assert.fail("Test not implemented");
    });
});

*/