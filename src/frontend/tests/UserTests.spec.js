const { By, Builder, until } = require('selenium-webdriver');
const assert = require("assert");
const USER_EMAIL = "user@gmail.com";
const ADMIN_EMAIL = "admin@gmail.com";
const PASSWORD = "password"
const API_TIMEOUT = 5000;
const PAGES = {
    DASHBOARD: "Dashboard",
    PROJECT_MANAGEMENT: "Project Management",
    USER_MANAGEMENT: "User Management",
    METADATA_MANAGEMENT: "Metadata Management",
    FILE_METADATA_MANAGEMENT: "File Metadata Management",
    PROJECT_SECURITY: "Project Security"
}

let driver;

before(async function () {
    this.timeout(API_TIMEOUT);
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
        await submitButton.click();

        // Login may require time for database to boot up
        this.timeout(60000);
        await driver.wait(until.stalenessOf(emailInput), 30000);
    })

    after(async function () {
        // Logout after each suite
        const logoutButton = await findXPathElement("//span[text()='Logout']");
        await logoutButton.click();
        const logoutConfirmButton = await findXPathElement("//button[text()='Logout']");
        logoutConfirmButton.click();
        await driver.wait(until.stalenessOf(logoutConfirmButton), API_TIMEOUT);
    });
}

async function navigateToPage(page) {
    const button = await findXPathElement("//span[text()='" + page + "']");
    await button.click();
}

async function getDisplayedMetadata(field) {
    const labelElement = await findXPathElement("//p[text()='" + field + "']");
    const ancestor = await labelElement.findElement(By.xpath("./../../.."));
    const foundNameElement = await ancestor.findElement(By.className("ant-form-item-control-input-content"));
    const foundName = await foundNameElement.getText();
    return foundName;
}

/* -------------------------------------------------------------------------- */
/*                              Tests Start Here                              */
/* -------------------------------------------------------------------------- */

/* ----------------------------------- UI ----------------------------------- */
describe("UI - Sanity tests", function () {
    loadBeforeAndAfter();

    it("UI-001 - User Login Sanity Test", async function () {
        let currentUrl = await driver.getCurrentUrl();
        assert(currentUrl.includes("dashboard"));
    });
});

/* -------------------------------- PROJ-ORG -------------------------------- */
describe("PROJ-ORG - Project organization", function () {
    loadBeforeAndAfter(true);

    let dateOptions = {
        month: "short",
        year: "numeric",
        day: "numeric"
    }
    let today = new Date();
    let testProject = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Project Location",
        date: today.toLocaleDateString("en-US", dateOptions),
        status: "Active"
    };
    today.setDate(today.getDate() - 1); // Yesterday
    let testProjectEdit = {
        name: "Edited Test Project",
        description: "Edited Test Project Description",
        location: "Edited Test Project Location",
        date: today.toLocaleDateString("en-US", dateOptions),
        status: "Edited",
        phase: "Phase Edit",
        newField: "Added"
    };
    let projectAdded = false;

    it("PROJ-ORG-001 - Project creation", async function () {
        navigateToPage(PAGES.PROJECT_MANAGEMENT);

        // Get list of currently added projects
        const deleteProjectButton = await findXPathElement("//h4[text()='Delete Project']");
        await deleteProjectButton.click();
        await driver.wait(until.elementLocated(By.css("tr")));
        const preProjects = await driver.findElements(By.css("tr"));

        // Add project
        const createProjectButton = await findXPathElement("//h4[text()='Create Project']");
        await createProjectButton.click();
        const projectNameInput = await findIdElement("project_creation_projectName");
        const projectDescriptionInput = await findIdElement("project_creation_description");
        const projectLocationInput = await findIdElement("project_creation_location");
        await projectNameInput.sendKeys(testProject.name);
        await projectDescriptionInput.sendKeys(testProject.description);
        await projectLocationInput.sendKeys(testProject.location);
        const addProjectButton = await findXPathElement("//span[text()='Add Project']");
        await addProjectButton.click();
        this.timeout(API_TIMEOUT);
        await findXPathElement("//span[text()='Project added successfully']");

        // Check if project was added and has correct parameters
        await deleteProjectButton.click();
        await driver.wait(until.elementLocated(By.css("tr")));
        const postProjects = await driver.findElements(By.css("tr"));
        assert.equal(postProjects.length, preProjects.length + 1);
        const projectIdElement = await postProjects[postProjects.length - 1].findElement(By.css("td"));
        testProject.id = (await projectIdElement.getText()).replace(/ .*/, '');

        // Check if project metadata is correct
        navigateToPage(PAGES.METADATA_MANAGEMENT);
        await driver.wait(until.elementLocated(By.css("tr")));
        const editTagElement = await findXPathElement("//strong[text()='" + testProject.id + "']");
        await editTagElement.click();
        projectAdded = true;
        const foundName = await getDisplayedMetadata("Project Name");
        const foundLocation = await getDisplayedMetadata("Location");
        const foundDate = await getDisplayedMetadata("Date");
        const foundStatus = await getDisplayedMetadata("Status")
        assert.equal(foundName, testProject.name);
        assert.equal(foundLocation, testProject.location);
        assert.equal(foundDate, testProject.date);
        assert.equal(foundStatus, testProject.status);
    });

    it("PROJ-ORG-003 - Project modification", async function () {
        assert(projectAdded, "Project was not added, no test data to delete");
        navigateToPage(PAGES.METADATA_MANAGEMENT);
        const editButton = await findXPathElement("//span[text()='Edit']");
        await editButton.click();

        // Enter existing fields
        const nameField = await findIdElement("md_edits_name");
        const locationField = await findIdElement("md_edits_location");
        const dateField = await findIdElement("md_edits_date");
        const statusField = await findIdElement("md_edits_status");
        const phaseField = await findIdElement("md_edits_phase");
        await nameField.clear();
        await nameField.sendKeys(testProjectEdit.name);
        await locationField.clear();
        await locationField.sendKeys(testProjectEdit.location);
        await dateField.clear();
        await dateField.sendKeys(today.toISOString());
        await statusField.clear();
        await statusField.sendKeys(testProjectEdit.status);
        await phaseField.clear();
        await phaseField.sendKeys(testProjectEdit.phase);
        
        // Add new field
        const addFieldButton = await findXPathElement("//span[text()='Add field']");
        await addFieldButton.click();
        const newFieldNameField = await findIdElement("md_edits_fields_0_field");
        const newFieldMetadataField = await findIdElement("md_edits_fields_0_fieldMD");
        await newFieldNameField.sendKeys("New Field");
        await newFieldMetadataField.sendKeys(testProjectEdit.newField);

        // Submit
        const submitButton = await findXPathElement("//span[text()='Submit']");
        await submitButton.click();
        await findXPathElement("//span[text()='Project updated successfully']");

        // Check if updated information is correct
        const foundName = await getDisplayedMetadata("Project Name");
        const foundLocation = await getDisplayedMetadata("Location");
        const foundDate = await getDisplayedMetadata("Date");
        const foundStatus = await getDisplayedMetadata("Status");
        const foundPhase = await getDisplayedMetadata("Phase");
        const foundNewField = await getDisplayedMetadata("New Field");
        assert.equal(foundName, testProjectEdit.name);
        assert.equal(foundLocation, testProjectEdit.location);
        assert.equal(foundDate, testProjectEdit.date);
        assert.equal(foundStatus, testProjectEdit.status);
        assert.equal(foundPhase, testProjectEdit.phase);
        assert.equal(foundNewField, testProjectEdit.newField);
    });

    it("PROJ-ORG-002 - Project deletion", async function () {
        assert(projectAdded, "Project was not added, no test data to delete");
        navigateToPage(PAGES.PROJECT_MANAGEMENT);
        const deleteProjectButton = await findXPathElement("//h4[text()='Delete Project']");
        deleteProjectButton.click();
        const idElement = await findXPathElement("//td[text()='" + testProject.id + "']");
        const project = await idElement.findElement(By.xpath("./.."));
        const projectDeleteButton = await project.findElement(By.css("button"));
        await projectDeleteButton.click();
        const projectDeleteConfirm = await findXPathElement("//span[text()='Yes']");
        await driver.wait(until.elementIsVisible(projectDeleteConfirm));
        await projectDeleteConfirm.click();
        await findXPathElement("//span[text()='Project deleted successfully']");

        // Check if element is not present (via id)
        const projects = await driver.findElements(By.xpath("//td[text()='" + testProject.id + "']"));
        assert.equal(projects, 0);

        const closeButton = await findXPathElement("//h4[text()='Close']");
        closeButton.click();
    });

    it("PROJ-ORG-004 - Project creation error handling", async function () {
        assert.fail("Test not implemented");
    });
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