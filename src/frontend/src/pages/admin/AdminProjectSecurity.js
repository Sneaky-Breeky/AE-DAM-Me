import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Typography, Button, Popover, Radio, Form, Input, Checkbox } from 'antd';
import { SearchOutlined, EditOutlined, CloseOutlined} from '@ant-design/icons';
import { projects, files, users } from '../../utils/dummyData.js';

import { fetchProjects, fetchUsersForProject } from '../../api/projectApi';
import { fetchUsers } from '../../api/authApi';
import {giveUserAccess} from "../../api/userApi";


const { Title } = Typography;

/*const projects = [
{name: 'Bridge Construction', accessLevel: 'Admins Only', metadata: ['Project Name', 'Location', 'Date', 'Image Description', 'Tags'], status: 'Active', listUsers: []},
{name: 'High-Rise Development', accessLevel: 'Everyone', metadata: ['Project Name', 'Location', 'Date', 'Tags'], status: 'Active', listUsers: []},
{name: 'Highway Expansion', accessLevel: 'Selected Users', metadata: ['Project Name', 'Location', 'Date'], status: 'Inactive', listUsers: ['John Doe', 'Sarah Brown']}
]; */

/*
const users = [
{name: 'John Doe', role: 'User', status: 'Active'},
{name: 'Sarah Brown', role: 'Admin', status: 'Active'},
{name: 'Michael Johnson', role: 'User', status: 'Inactive'}
];*/

const metadata = ["Project Name", "Location", "Date", "Image Description", "Tags"];

function PopupAccess(adminChecked, setAdminChecked, allChecked, setAllChecked, selectedChecked, setSelectedChecked, listUsers, setListUsers, fetchedUsersForAProject, setFetchedUsersForProject, originalUsersForProject, setOriginalUsersForProject) {
/*const [adminChecked, setAdminChecked] = useState(project.accessLevel === 'Admins Only');
const [allChecked, setAllChecked] = useState(project.accessLevel === 'Everyone');
const [selectedChecked, setSelectedChecked] = useState(project.accessLevel === 'Selected Users');
const [listUsers, setListUsers] = useState(project.listUsers || []); */

const onChange = (e) => {
// change access level here
console.log(`checked = ${e.target.checked}`);
};

const toggleAdminChecked = () => {
const isChecked = !adminChecked;

// Toggle Admin checkbox
setAdminChecked(isChecked);
setAllChecked(false);
setSelectedChecked(false);

// Debugging print
console.log("Toggling Admin checkbox. isChecked:", isChecked);
console.log("All users and their roles:");
listUsers.forEach(user => {
console.log(`${user.name}: ${user.role}`);
});

if (isChecked) {
const admins = listUsers.filter((user) => user.role === 1);
console.log("Admins selected:", admins.map(a => a.name));
setFetchedUsersForProject(admins);
} else {
setFetchedUsersForProject([]);
}
};




const toggleAllChecked = () => {
const isChecked = !allChecked;
setAllChecked(isChecked);
setAdminChecked(false);
setSelectedChecked(false);

if (isChecked) {
setFetchedUsersForProject([...listUsers]);
} else {
setFetchedUsersForProject([]);
}
};



const toggleUserChecked = (e, user) => {
const isChecked = e.target.checked;

let updatedUsers;
if (isChecked) {
updatedUsers = [...fetchedUsersForAProject, user];
} else {
updatedUsers = fetchedUsersForAProject.filter((u) => u.id !== user.id);
}

setFetchedUsersForProject(updatedUsers);
setSelectedChecked(true);
setAdminChecked(false);
setAllChecked(false);
};



return (
<div onClick={(e) => e.stopPropagation()}>
<table style={{width: '100%', borderCollapse: 'collapse'}}>
<tr style={{height: '50px'}}>
    <td style={{ fontSize: '12px', textAlign: 'left', borderBottom:'1px solid black'}} >
        <Checkbox checked={adminChecked}
                  onChange={toggleAdminChecked}>
            Admins Only
        </Checkbox>
    </td>
</tr>
<tr style={{height: '50px'}}>
    <td style={{ fontSize: '12px', textAlign: 'left', borderBottom:'1px solid black'}} >
        <Checkbox checked={allChecked && !adminChecked}
                  onChange={
                      toggleAllChecked}>
            Everyone
        </Checkbox>
    </td>
</tr>
{listUsers.map((user) => (
    <tr style={{height: '50px'}}>
        <td style={{ fontSize: '12px', textAlign: 'left', borderBottom:'1px solid black'}} >
            <Checkbox
                checked={Array.isArray(fetchedUsersForAProject) &&
                    fetchedUsersForAProject.some((u) => u.id === user.id)}
                onChange={(e) => toggleUserChecked(e, user)}
            >
                {user.name}
            </Checkbox>


        </td>
    </tr>
))}
</table>
</div>
);
}

function popupForm(project, setPopupFormOpen, adminChecked, setAdminChecked, allChecked, setAllChecked, selectedChecked, setSelectedChecked, listUsers, setListUsers, fetchedUsersForAProject, setFetchedUsersForProject, originalUsersForProject, setOriginalUsersForProject) {

return (
<Box
sx={{
display: 'flex',
flexDirection: 'column',
justifyContent: 'flex-start',
alignItems: 'left',
width: '80%',
height: '100%',
margin: '20px auto',
marginTop: '0',
backgroundColor: '#f5f5f5',
borderRadius: '10px',
padding: '20px',
paddingTop: '0',
paddingBottom: '10',
boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
overflow: 'auto'
}}
>
<div style={{overflowY: 'auto', width: '100%', height: '100%'}}>
<table style={{width: '100%', borderCollapse: 'collapse'}}>
    <tr>
        <th colspan="2" style={{height: '40px', textAlign: 'center', borderBottom:'1px solid black', padding: '0px'}} >
            <h4>Edit {project.name} Project's Metadata Viewing</h4></th>
    </tr>
    <tr style={{height: '50px'}}>
        <td style={{ fontSize: '12px', width: '20%', textAlign: 'left', borderBottom:'1px solid black'}} >Access Level: </td>
        <td style={{ fontSize: '12px', width: '5%', textAlign: 'center', borderBottom:'1px solid black'}} >{
            // reload if status input differs from original user.status
            // popup breaks
            <Popover
                content={PopupAccess(adminChecked, setAdminChecked,
                    allChecked, setAllChecked,
                    selectedChecked, setSelectedChecked,
                    listUsers, setListUsers, fetchedUsersForAProject, setFetchedUsersForProject, originalUsersForProject, setOriginalUsersForProject)}

                trigger="click"
            >
                <Button color="default" variant="text" size={"default"} icon={<EditOutlined />}/>
            </Popover>

        }</td>
    </tr>
    {metadata.map((md) => (
        <tr style={{height: '50px'}}>
            <td style={{ fontSize: '12px', textAlign: 'left', borderBottom:'1px solid black'}} >{md}</td>
            <td style={{ fontSize: '12px', width: '5%', textAlign: 'center', borderBottom:'1px solid black'}} >{
                // reload if status input differs from original user.status
                <Popover
                    content={
                        <Radio.Group style={{ display: 'flex', flexDirection: 'column', marginTop: "0px" }}>
                            <Radio value="admin"> <p style={{fontSize:'12px', margin: '0px'}}>Admin Only</p> </Radio>
                            <Radio value="everyone"> <p style={{fontSize:'12px', margin: '0px'}}>Everyone</p> </Radio>
                        </Radio.Group>}
                    trigger="click"
                >
                    <Button color="default" variant="text" size={"default"} icon={<EditOutlined />}/>
                </Popover>
            }</td>
        </tr>
    ))}
</table>
<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', margin: '20px auto', marginBottom: '0'}}>
    <Button color="default" variant="text" size={"default"} icon={<CloseOutlined/>}
            onClick={(e) => {
                e.stopPropagation();
                setPopupFormOpen(false);
            }}/>
    <Button type="primary" size={"default"}
            onClick={async (e) => {
                e.stopPropagation();
                setPopupFormOpen(false);

                const originalUserIds = new Set(originalUsersForProject.map(u => u.id));
                const updatedUserIds = new Set(fetchedUsersForAProject.map(u => u.id));

                // Find newly added users (users in updated list but not in original)
                const newUsers = fetchedUsersForAProject.filter(user => !originalUserIds.has(user.id));

                console.log("New users being added:", newUsers);

                // Call giveUserAccess for each new user
                for (const user of newUsers) {
                    await giveUserAccess(user.id, project.id);
                }

                // Update original users so next time it's correct
                setOriginalUsersForProject(fetchedUsersForAProject);
            }}
    >
        Submit
    </Button>


</div>

</div>

</Box>
);
}

export default function AdminProjectSecurity() {

const [searchQuery, setSearchQuery] = useState('');
const [isPopupFormOpen, setPopupFormOpen] = useState(false);
const [project, setProject] = useState(null);
const [fetchedProjects, setFetchedProjects] = useState([]);
const [fetchedUsersForAProject, setFetchedUsersForProject] = useState([]);
const [loading, setLoading] = useState(true);
const [adminChecked, setAdminChecked] = useState(false);
const [allChecked, setAllChecked] = useState(false);
const [selectedChecked, setSelectedChecked] = useState(false);
const [listUsers, setListUsers] = useState([]);
const [originalUsersForProject, setOriginalUsersForProject] = useState([]);

// Fetch users
useEffect(() => {
const getUsers = async () => {
try {
const users = await fetchUsers();
if (Array.isArray(users)) {
    setListUsers(users);
} else {
    console.error("Expected an array but got:", users);
    setListUsers([]);
}
} catch (error) {
console.error("Error fetching users:", error);
setListUsers([]);
}
};

getUsers();
}, []);

// Fetch projects
useEffect(() => {
const getProjects = async () => {
setLoading(true);
const response = await fetchProjects();

if (response.error) {
console.error("Error fetching projects:", response.error);
setFetchedProjects([]);
} else {
console.log("Fetched Projects:", response);
setFetchedProjects(response);
}

setLoading(false);
};

getProjects();
}, []);


const getUsersForProject = async (projectId) => {
setLoading(true);
const response = await fetchUsersForProject(projectId);
console.log("Fetched Users Response:", response);

if (response.error) {
console.error("Error fetching users:", response.error);
setFetchedUsersForProject([]);
} else {
setFetchedUsersForProject(response);
}

setLoading(false);
};




return (
<Box
sx={{
display: 'flex',
flexDirection: 'column',
height: '100vh',
}}
>
{/* Title */}
<Box
sx={{
    textAlign: 'center',
    padding: 4,
    marginBottom: '0',
}}
>
<Title level={1}>Project Security</Title>
</Box>

<Box
sx={{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'left',
    height: '100vh',
    width: '80%',
    margin: '20px auto',
    marginTop: '0',
    borderRadius: '10px',

    overflow: 'auto',
}}
>

{/* left container with users */}
<Box
    sx={{

        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'left',
        width: '50%',
        margin: '20px auto',
        borderRadius: '10px',
    }}
>

    <Input
        placeholder="Search for a project.."
        prefix={<SearchOutlined />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: '300px' }}
        disabled={loading}
    />

    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'left',
            width: '100%',
            height: '100%',
            margin: '20px auto',
            backgroundColor: '#f5f5f5',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            overflow: 'auto',
        }}
    >


        {loading ? (
            <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }} />
        ) : (
            <div style={{ overflowY: 'auto', width: '100%', height: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: '10px' }}>
                    <tr style={{ height: '50px' }}>
                        <th style={{ width: '25%', textAlign: 'left', borderBottom: '1px solid black' }}>Project</th>
                        <th colSpan="2" style={{ width: '15%', textAlign: 'left', borderBottom: '1px solid black' }}>Access Level</th>
                    </tr>
                    {fetchedProjects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
                        <tr key={p.id}
                            onClick={async () => {
                                setProject(p);
                                setPopupFormOpen(true);

                                setAdminChecked(false);
                                setAllChecked(false);
                                setSelectedChecked(false);
                                setFetchedUsersForProject([]);

                                let existingUsers = [];

                                if (p.accessLevel === 0) {  // Admins Only
                                    setAdminChecked(true);
                                    existingUsers = listUsers.filter((user) => user.role === 1);
                                } else if (p.accessLevel === 1) {  // Everyone
                                    setAllChecked(true);
                                    existingUsers = [...listUsers];
                                } else if (p.accessLevel === 2) {  // Selected Users
                                    setSelectedChecked(true);
                                    existingUsers = await getUsersForProject(p.id);
                                }

                                // Save original users list BEFORE updating fetched users
                                setOriginalUsersForProject(existingUsers);
                                setFetchedUsersForProject(existingUsers);
                            }}




                            style={{ height: '50px', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fcfcfc'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}>
                            <td style={{ fontSize: '12px', width: '40%', textAlign: 'left', borderBottom: '1px solid black' }}>{p.name}</td>
                            <td style={{ fontSize: '12px', width: '30%', textAlign: 'left', borderBottom: '1px solid black' }}>{p.accessLevel}</td>
                            <td style={{ fontSize: '12px', width: '5%', textAlign: 'left', borderBottom: '1px solid black' }}></td>
                        </tr>

                    ))}
                </table>
            </div>
        )}
    </Box>

    


</Box>

{/* right container with new users */}
<Box
    sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '40%',
        padding: '20px',
        paddingBottom: '10',
        paddingTop: '0'
    }}
>
    {isPopupFormOpen && popupForm(project, setPopupFormOpen, adminChecked, setAdminChecked, allChecked, setAllChecked, selectedChecked, setSelectedChecked, listUsers, setListUsers, fetchedUsersForAProject, setFetchedUsersForProject, originalUsersForProject, setOriginalUsersForProject)}

</Box>
</Box>

</Box>
);
}