import dayjs from 'dayjs';


const files = [
    { Id: 0, FileName: "Bridge Construction", FilePath: `${process.env.PUBLIC_URL}/images/bridge.webp`, Metadata: ["bridge", "construction"], ProjectId: 0, Status: "Active", Date: dayjs("2024-09-10 00:16:01"), Location: "" },
    { Id: 1, FileName: "High-Rise Development", FilePath: `${process.env.PUBLIC_URL}/images/highrise.jpg`, Metadata: ["high-rise", "high rise", "highrise", "construction"], ProjectId: 1, Status: "Active", Date: dayjs("2024-12-28 00:16:01"), Location: "" },
    { Id: 2, FileName: "Highway Expansion", FilePath: `${process.env.PUBLIC_URL}/images/highway.jpg`, Metadata: ["highway", "expansion", "road"], ProjectId: 2, Status: "Active", Date: dayjs("2024-10-14 00:16:01"), Location: "" },
    { Id: 3, FileName: "Oil Pipeline Repair", FilePath: `${process.env.PUBLIC_URL}/images/pipeline.jpg`, Metadata: ["oil", "pipeline", "pipeline repair"], ProjectId: 3, Status: "Active", Date: dayjs("2024-11-07 00:16:01"), Location: "" },
    { Id: 4, FileName: "Park Restoration", FilePath: `${process.env.PUBLIC_URL}/images/park.jpeg`, Metadata: ["park", "restoration"], ProjectId: 4, Status: "Active", Date: dayjs("2025-01-31 00:16:01"), Location: "" },
    { Id: 5, FileName: "School Construction", FilePath: `${process.env.PUBLIC_URL}/images/school.png`, Metadata: ["school", "construction"], ProjectId: 5, Status: "Active", Date: dayjs("2024-12-18 00:16:01"), Location: "" },
    { Id: 6, FileName: "Airport Expansion", FilePath: `${process.env.PUBLIC_URL}/images/airport.webp`, Metadata: ["airport", "expansion"], ProjectId: 6, Status: "Active", Date: dayjs("2024-11-22 00:16:01"), Location: "" },
    { Id: 7, FileName: "Hospital Renovation", FilePath: `${process.env.PUBLIC_URL}/images/hospital.jpg`, Metadata: ["hospital", "renovation"], ProjectId: 7, Status: "Archived", Date: dayjs("2024-09-30 00:16:01"), Location: "" },
    { Id: 8, FileName: "Railway Modernization", FilePath: `${process.env.PUBLIC_URL}/images/railway.jpeg`, Metadata: ["railway", "modernization"], ProjectId: 8, Status: "Active", Date: dayjs("2024-07-10 00:16:01"), Location: "" },
    { Id: 9, FileName: "Water Treatment Plant", FilePath: `${process.env.PUBLIC_URL}/images/waterTreatment.webp`, Metadata: ["water", "treatment", "plant"], ProjectId: 9, Status: "Archived", Date: dayjs("2024-06-22 00:16:01"), Location: "" },
    { Id: 10, FileName: "Underground Parking Facility", FilePath: `${process.env.PUBLIC_URL}/images/undergroundParking.jpg`, Metadata: ["parking", "underground"], ProjectId: 10, Status: "Active", Date: dayjs("2024-05-05 00:16:01"), Location: "" },
    { Id: 11, FileName: "Renewable Energy Farm", FilePath: `${process.env.PUBLIC_URL}/images/energyFarm.png`, Metadata: ["renewable", "energy", "farm"], ProjectId: 11, Status: "Active", Date: dayjs("2024-04-12 00:16:01"), Location: "" }
];


const projects = [
    {
        id: 0,
        name: 'Bridge Construction', 
        location: 'Toronto', 
        date: dayjs("2024-12-18 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/bridge.webp`,
        accessLevel: 'Admins Only', 
        listUsers: [], 
        status: 'Active',
        phase: 2,
        fields: [{field: "test1", fieldMD: "test11"}, {field: "test2", fieldMD: "test22"}],
        lastUpdated: dayjs("2025-01-18 00:16:01"),
        files: files
    },
    {
        id: 1,
        name: 'High-Rise Development',
        location: 'Vancouver',
        date: dayjs("2024-12-28 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/highrise.jpg`,
        accessLevel: 'Everyone',
        listUsers: [],
        status: 'Active',
        phase: 1,
        fields: [],
        lastUpdated: dayjs("2025-01-12 00:16:01"),
        files: files
    },
    {
        id: 2,
        name: 'Highway Expansion',
        location: 'Montreal',
        date: dayjs("2024-10-14 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/highway.jpg`,
        accessLevel: 'Selected Users',
        listUsers: ['John Doe', 'Sarah Brown'],
        status: 'Inactive',
        phase: 3,
        fields: [],
        lastUpdated: dayjs("2025-01-10 00:16:01"),
        files: files
    },
    {
        id: 3,
        name: 'Oil Pipeline Repair',
        location: 'Alberta',
        date: dayjs("2024-11-07 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/pipeline.jpg`,
        accessLevel: 'Everyone',
        listUsers: [],
        status: 'Active',
        phase: 1,
        fields: [],
        lastUpdated: dayjs("2025-01-05 00:16:01"),
        files: files
    },
    {
        id: 4,
        name: 'Park Restoration',
        location: 'Ottawa',
        date: dayjs("2025-01-31 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/park.jpeg`,
        accessLevel: 'Everyone',
        listUsers: [],
        status: 'Active',
        phase: 2,
        fields: [],
        lastUpdated: dayjs("2025-01-20 00:16:01"),
        files: files
    },
    {
        id: 5,
        name: 'School Construction',
        location: 'Quebec City',
        date: dayjs("2024-12-18 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/school.png`,
        accessLevel: 'Everyone',
        listUsers: [],
        status: 'Active',
        phase: 1,
        fields: [],
        lastUpdated: dayjs("2025-01-08 00:16:01"),
        files: files
    },
    {
        id: 6,
        name: 'Airport Expansion',
        location: 'Calgary',
        date: dayjs("2024-11-22 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/airport.webp`,
        accessLevel: 'Admins Only',
        listUsers: [],
        status: 'Active',
        phase: 2,
        fields: [],
        lastUpdated: dayjs("2025-01-15 00:16:01"),
        files: files
    },
    {
        id: 7,
        name: 'Hospital Renovation',
        location: 'Winnipeg',
        date: dayjs("2024-09-30 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/hospital.jpg`,
        accessLevel: 'Selected Users',
        listUsers: ['Sarah Brown'],
        status: 'Inactive',
        phase: 1,
        fields: [],
        lastUpdated: dayjs("2025-01-10 00:16:01"),
        files: files
    },
    {
        id: 8,
        name: 'Railway Modernization',
        location: 'Halifax',
        date: dayjs("2024-07-10 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/railway.jpeg`,
        accessLevel: 'Everyone',
        listUsers: [],
        status: 'Active',
        phase: 2,
        fields: [],
        lastUpdated: dayjs("2025-01-12 00:16:01"),
        files: files
    },
    {
        id: 9,
        name: 'Water Treatment Plant',
        location: 'Regina',
        date: dayjs("2024-06-22 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/waterTreatment.webp`,
        accessLevel: 'Selected Users',
        listUsers: ['John Doe'],
        status: 'Inactive',
        phase: 3,
        fields: [],
        lastUpdated: dayjs("2025-01-10 00:16:01"),
        files: files
    },
    {
        id: 10,
        name: 'Underground Parking Facility',
        location: 'Mississauga',
        date: dayjs("2024-05-05 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/undergroundParking.jpg`,
        accessLevel: 'Everyone',
        listUsers: [],
        status: 'Active',
        phase: 1,
        fields: [],
        lastUpdated: dayjs("2025-01-08 00:16:01"),
        files: files
    },
    {
        id: 11,
        name: 'Renewable Energy Farm',
        location: 'Saskatoon',
        date: dayjs("2024-04-12 00:16:01"),
        thumbnail: `${process.env.PUBLIC_URL}/images/energyFarm.png`,
        accessLevel: 'Everyone',
        listUsers: [],
        status: 'Active',
        phase: 2,
        fields: [],
        lastUpdated: dayjs("2025-01-05 00:16:01"),
        files: files
    }
];


const logs = [
    { time: dayjs("2025-02-03 00:07:59"), action: 'File uploaded' },
    { time: dayjs("2025-02-03 00:07:53"), action: 'Files submitted to a project' },
    { time: dayjs("2025-02-02 00:18:30"), action: 'Project metadata updated' },
    { time: dayjs("2025-02-02 00:16:12"), action: 'File downloaded' },
    { time: dayjs("2025-02-02 00:12:02"), action: 'Files shared' },
    { time: dayjs("2025-02-01 00:13:03"), action: 'File uploaded' },
    { time: dayjs("2025-01-31 00:11:45"), action: 'Files submitted to a project' },
    { time: dayjs("2025-01-30 00:15:50"), action: 'Project metadata updated' },
    { time: dayjs("2025-01-30 00:10:27"), action: 'File downloaded' },
    { time: dayjs("2025-01-29 00:07:22"), action: 'Files shared' },
    { time: dayjs("2025-01-27 00:14:14"), action: 'Files shared' },
    { time: dayjs("2025-01-26 00:08:15"), action: 'File uploaded' },
];


const users = [
    { name: 'John Doe', email: 'johndoe123@example.com', role: 'User', status: 'Active', files: [], favProjs: [], workingProjs: []},
    { name: 'Sarah Brown', email: 'sarah.brown@example.com', role: 'Admin', status: 'Active', files: [], favProjs: [], workingProjs: []},
    { name: 'Michael Johnson', email: 'michael.j2009@example.com', role: 'User', status: 'Inactive', files: [], favProjs: [], workingProjs: [] }
];

export { projects, files, logs, users };