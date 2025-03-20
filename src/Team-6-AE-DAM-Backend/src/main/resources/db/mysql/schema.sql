CREATE TABLE Project (
                         project_id INT PRIMARY KEY,
                         project_name VARCHAR(40),
                         status VARCHAR(8)
);

CREATE TABLE File (
                      file_id INT PRIMARY KEY,
                      file_name VARCHAR(25),
                      file_extension VARCHAR(5),
                      file_description VARCHAR(255),
                      thumbnail_path VARCHAR(255),
                      view_path VARCHAR(255),
                      original_path VARCHAR(255),
                      gps_latitude DECIMAL(9,6),
                      gps_longitude DECIMAL(10,6),
                      gps_altitude DECIMAL(7,2),
                      date_time_original TIMESTAMP,
                      pixel_width INT,
                      pixel_height INT,
                      make VARCHAR(20),
                      model VARCHAR(50),
                      focal_length SMALLINT,
                      aperture FLOAT(3,2),
    profile_copyright VARCHAR(50)
);

CREATE TABLE Tag (
                     tag_id INT PRIMARY KEY,
                     tag_name VARCHAR(20)
);

CREATE TABLE User (
                      user_id INT PRIMARY KEY,
                      first_name VARCHAR(20),
                      last_name VARCHAR(20),
                      role VARCHAR(5)
);

CREATE TABLE Logger (
                        log_id INT PRIMARY KEY,
                        timestamp TIMESTAMP,
                        action VARCHAR(8)
);

CREATE TABLE Palette (
                         palette_id INT PRIMARY KEY,
                         media_count TINYINT UNSIGNED
);



-- Scripts by Gary
-- db connection string:
-- sqlcmd -S ae-server-319.database.windows.net -U aeadmin -P A772513a -d AE-DAM-AUTH
CREATE TABLE Users (
    Id INT IDENTITY PRIMARY KEY,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL, -- Now storing Base64 hash
    Role INT NOT NULL CHECK (Role IN (0, 1)), -- 0: User, 1: Admin
    Status BIT DEFAULT 1 -- 1: Active, 0: Inactive
);

-- Declare variables for hashed passwords
DECLARE @UserHashBase64 NVARCHAR(255);
DECLARE @AdminHashBase64 NVARCHAR(255);

-- Compute SHA-256 hashes as VARBINARY
DECLARE @UserHash VARBINARY(32) = HASHBYTES('SHA2_256', 'password');
DECLARE @AdminHash VARBINARY(32) = HASHBYTES('SHA2_256', 'password');

-- Convert VARBINARY hashes to Base64 encoding
SELECT @UserHashBase64 = CAST('' AS XML).value('xs:base64Binary(xs:hexBinary(sql:column("HashValue")))', 'NVARCHAR(255)')
FROM (SELECT @UserHash AS HashValue) AS HashData;

SELECT @AdminHashBase64 = CAST('' AS XML).value('xs:base64Binary(xs:hexBinary(sql:column("HashValue")))', 'NVARCHAR(255)')
FROM (SELECT @AdminHash AS HashValue) AS HashData;

-- Insert hashed values into Users table
INSERT INTO Users (FirstName, LastName, Email, PasswordHash, Role, Status)
VALUES ('user', 'mock', 'user@gmail.com', @UserHashBase64, 0, 1);

INSERT INTO Users (FirstName, LastName, Email, PasswordHash, Role, Status)
VALUES ('admin', 'mock', 'admin@gmail.com', @AdminHashBase64, 1, 1);

-- connect to Dhruv's database:
-- sqlcmd -S dam-dev.database.windows.net -U dkhanna -P Thisis@strongpaswd -d dam-dev

-- ALTER TABLE Projects NOCHECK CONSTRAINT ALL;
INSERT INTO Projects (Name, Description, Location, Status, Phase, LastUpdate, AccessLevel, ImagePath)
VALUES
    ('Bridge Construction', 'Construction of a new bridge in Toronto.', 'Toronto', 'Active', 2, '2025-01-18 00:16:01', 0, '/images/bridge.webp'),
    ('High-Rise Development', 'Development of a 50-story skyscraper.', 'Vancouver', 'Active', 1, '2025-01-12 00:16:01', 1, '/images/highrise.jpg'),
    ('Highway Expansion', 'Expanding highway lanes to reduce congestion.', 'Montreal', 'Inactive', 3, '2025-01-10 00:16:01', 2, '/images/highway.jpg'),
    ('Oil Pipeline Repair', 'Maintenance and repair of the oil pipeline.', 'Alberta', 'Active', 1, '2025-01-05 00:16:01', 1, '/images/pipeline.jpg'),
    ('Park Restoration', 'Restoring historical park infrastructure.', 'Ottawa', 'Active', 2, '2025-01-20 00:16:01', 1, '/images/park.jpeg'),
    ('School Construction', 'New elementary school development.', 'Quebec City', 'Active', 1, '2025-01-08 00:16:01', 1, '/images/school.png'),
    ('Airport Expansion', 'Expansion of Calgary airport facilities.', 'Calgary', 'Active', 2, '2025-01-15 00:16:01', 0, '/images/airport.webp'),
    ('Hospital Renovation', 'Upgrading old hospital infrastructure.', 'Winnipeg', 'Inactive', 1, '2025-01-10 00:16:01', 2, '/images/hospital.jpg'),
    ('Railway Modernization', 'Upgrading railway tracks and stations.', 'Halifax', 'Active', 2, '2025-01-12 00:16:01', 1, '/images/railway.jpeg'),
    ('Water Treatment Plant', 'New water purification plant.', 'Regina', 'Inactive', 3, '2025-01-10 00:16:01', 2, '/images/waterTreatment.webp'),
    ('Underground Parking Facility', 'New underground parking structure.', 'Mississauga', 'Active', 1, '2025-01-08 00:16:01', 1, '/images/undergroundParking.jpg'),
    ('Renewable Energy Farm', 'Development of a solar and wind energy farm.', 'Saskatoon', 'Active', 2, '2025-01-05 00:16:01', 1, '/images/energyFarm.png');

GO

-- ALTER TABLE Projects WITH CHECK CHECK CONSTRAINT ALL;

