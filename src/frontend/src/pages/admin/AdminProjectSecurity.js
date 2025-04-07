import React, {useState, useEffect} from 'react';
import Box from '@mui/material/Box';
import {Typography, Button, Popover, Radio, Form, Input, Checkbox, Spin, message} from 'antd';
import {SearchOutlined, EditOutlined, CloseOutlined} from '@ant-design/icons';
import {fetchProjects, fetchUsersForProject, putProject} from '../../api/projectApi';
import {fetchUsers} from '../../api/authApi';
import {giveUserAccess, removeAllUserAccess} from "../../api/userApi";
import { useAuth } from '../../contexts/AuthContext';
import {addLog} from "../../api/logApi";


const {Title} = Typography;

function popupForm(project, setPopupFormOpen, adminChecked, setAdminChecked, allChecked, setAllChecked, selectedChecked, setSelectedChecked, listUsers, setListUsers, fetchedUsersForAProject, setFetchedUsersForProject, originalUsersForProject, setOriginalUsersForProject, handleAccessUpdate, setLoading, getProjects) {


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
            console.log(`${user.firstName + ' ' + user.lastName}: ${user.role}`);
        });

        if (isChecked) {
            const admins = listUsers.filter((user) => user.role === 1);
            console.log("Admins selected:", admins.map(a => `${a.firstName} ${a.lastName}`));
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

        if (!Array.isArray(fetchedUsersForAProject)) {
            setFetchedUsersForProject([user]); // start with one
            return;
        }

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
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'left',
                width: '80%',
                height: '60vh',
                marginTop: '0',
                backgroundColor: '#f5f5f5',
                borderRadius: '10px',
                padding: '20px',
                paddingTop: '0',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                overflow: 'auto'
            }}
        >
            <div style={{overflowY: 'auto', width: '100%', height: '100%'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <tr>
                        <th colspan="2" style={{
                            height: '40px',
                            textAlign: 'center',
                            borderBottom: '1px solid black',
                            padding: '0px'
                        }}>
                            <h4>Edit {project.name} Project's Access Level</h4></th>
                    </tr>
                </table>

                <div onClick={(e) => e.stopPropagation()}>
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                        <tr style={{height: '50px'}}>
                            <td style={{fontSize: '12px', textAlign: 'left', borderBottom: '1px solid black'}}>
                                <Checkbox checked={adminChecked}
                                          onChange={toggleAdminChecked}>
                                    Admins Only
                                </Checkbox>
                            </td>
                        </tr>
                        <tr style={{height: '50px'}}>
                            <td style={{fontSize: '12px', textAlign: 'left', borderBottom: '1px solid black'}}>
                                <Checkbox checked={allChecked && !adminChecked}
                                          onChange={
                                              toggleAllChecked}>
                                    Everyone
                                </Checkbox>
                            </td>
                        </tr>
                        {listUsers.map((user) => (
                            <tr style={{height: '50px'}}>
                                <td style={{fontSize: '12px', textAlign: 'left', borderBottom: '1px solid black'}}>
                                    <Checkbox
                                        checked={Array.isArray(fetchedUsersForAProject) &&
                                            fetchedUsersForAProject.some((u) => u.id === user.id)}
                                        onChange={(e) => toggleUserChecked(e, user)}
                                    >
                                        <span>{user.id}</span> - <span style={{ color: 'grey', fontStyle: 'italic' }}>{`${user.firstName} ${user.lastName}`}</span>
                                    </Checkbox>


                                </td>
                            </tr>
                        ))}
                    </table>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    margin: '20px auto',
                    marginBottom: '0'
                }}>
                    <Button color="default" variant="text" size={"default"} icon={<CloseOutlined/>}
                            onClick={(e) => {
                                e.stopPropagation();
                                setPopupFormOpen(false);
                            }}/>
                    <Button type="primary" size={"default"}
                            onClick={async (e) => {
                                e.stopPropagation();
                                await handleAccessUpdate({
                                    project,
                                    adminChecked,
                                    allChecked,
                                    fetchedUsersForAProject,
                                    originalUsersForProject,
                                    setOriginalUsersForProject,
                                    setPopupFormOpen,
                                    setLoading,
                                    getProjects,
                                    listUsers
                                });
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
    const { user } = useAuth();
// Fetch users
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

    useEffect(() => {
        getUsers();
    }, []);


// Fetch projects
    const getProjects = async () => {
        setLoading(true);
        const response = await fetchProjects();

        if (response.error) {
            console.error("Error fetching projects:", response.error);
            setFetchedProjects([]);
        } else {
            setFetchedProjects(response);
        }
        setLoading(false);
    };

    useEffect(() => {
        getProjects();
    }, []);


    async function handleAccessUpdate({
                                          project,
                                          adminChecked,
                                          allChecked,
                                          fetchedUsersForAProject,
                                          originalUsersForProject,
                                          setOriginalUsersForProject,
                                          setPopupFormOpen,
                                          setLoading,
                                          getProjects,
                                          listUsers,
                                      }) {
        try {
            setLoading(true);

            let newAccessLevel = 2;
            let usersToGrantAccess = fetchedUsersForAProject;

            if (adminChecked) {
                newAccessLevel = 0;
                usersToGrantAccess = listUsers.filter(u => u.role === 1);
            } else if (allChecked) {
                newAccessLevel = 1;
                usersToGrantAccess = listUsers;
            }

            const updatedProjectData = {
                ...project,
                accessLevel: newAccessLevel,
            };

            const updateResult = await putProject({
                projectId: project.id,
                updatedProjectData: updatedProjectData
            });
            
            if (updateResult.error) {
                throw new Error(updateResult.error);
            }

            await removeAllUserAccess(project.id);
            for (const user of usersToGrantAccess) {
                await giveUserAccess(user.id, project.id);
            }

            setOriginalUsersForProject(usersToGrantAccess);
            await getProjects();
            message.success("Project access updated!");
            await addLog(user.id,null,project.id,'Updated Project User Access')
        } catch (err) {
            console.error("Failed to update access:", err);
            message.error("Failed to update project access.");
        } finally {
            setLoading(false);
        }
    }


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
                    padding: '20px',
                    paddingBottom: 0,
                    margin: '10px auto',
                    marginBottom: '0',
                }}
            >
                <Input
                    placeholder="Search for a project.."
                    prefix={<SearchOutlined/>}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{width: '300px'}}
                    disabled={loading}
                />
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'anchor-center',
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
                        alignItems: 'center',
                        width: '45%',
                        minWidth: '300px',
                        margin: '20px auto',
                        marginTop: '0',
                        borderRadius: '10px',
                        padding: '20px',
                    }}
                >

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            alignItems: 'left',
                            width: '100%',
                            height: '60vh',
                            marginTop:'0',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '10px',
                            padding: '20px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                    >


                        {loading ? (
                            <Spin size="large" style={{display: 'flex', justifyContent: 'center', marginTop: '20px'}}/>
                        ) : (
                            <div style={{overflowY: 'auto', width: '100%', height: '100%'}}>
                                <table style={{width: '100%', borderCollapse: 'collapse', borderSpacing: '10px'}}>
                                    <tr style={{height: '50px'}}>
                                        <th style={{
                                            width: '25%',
                                            textAlign: 'left',
                                            borderBottom: '1px solid black'
                                        }}>Project
                                        </th>
                                        <th colSpan="2" style={{
                                            width: '15%',
                                            textAlign: 'left',
                                            borderBottom: '1px solid black'
                                        }}>Access Level
                                        </th>
                                    </tr>
                                    {fetchedProjects.filter(p =>
                                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        p.id.toString().includes(searchQuery)
                                    ).map((p) => (
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
                                                    const projectUsers = await fetchUsersForProject(p.id);

                                                    if (Array.isArray(projectUsers)) {
                                                        existingUsers = projectUsers;
                                                        setOriginalUsersForProject(projectUsers);
                                                        setFetchedUsersForProject(projectUsers);
                                                    } else {
                                                        console.error("Could not load users for project:", projectUsers);
                                                        existingUsers = [];
                                                        setOriginalUsersForProject([]);
                                                        setFetchedUsersForProject([]);
                                                    }

                                                }
                                                setOriginalUsersForProject(existingUsers);
                                                setFetchedUsersForProject(existingUsers);
                                            }}

                                            style={{height: '50px', cursor: 'pointer'}}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#fcfcfc';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '';
                                            }}>
                                            <td style={{
                                                fontSize: '12px',
                                                width: '40%',
                                                textAlign: 'left',
                                                borderBottom: '1px solid black'
                                            }}><span>{p.id} - </span>
                                                <span style={{ fontStyle: 'italic', color: 'gray' }}>{p.name}</span>
                                            </td>
                                            <td style={{
                                                fontSize: '12px',
                                                width: '30%',
                                                textAlign: 'left',
                                                borderBottom: '1px solid black'
                                            }}>
                                                {p.accessLevel === 0 ? 'Admins Only' : p.accessLevel === 1 ? 'Everyone' : 'Selected Users'}
                                            </td>
                                            <td style={{
                                                fontSize: '12px',
                                                width: '5%',
                                                textAlign: 'left',
                                                borderBottom: '1px solid black'
                                            }}></td>
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
                        minWidth: '300px',
                        padding: '20px',
                        marginTop: '0',
                        paddingBottom: '10',
                    }}
                >
                    {isPopupFormOpen && popupForm(project, setPopupFormOpen, adminChecked, setAdminChecked, allChecked, setAllChecked, selectedChecked, setSelectedChecked, listUsers, setListUsers, fetchedUsersForAProject, setFetchedUsersForProject, originalUsersForProject, setOriginalUsersForProject, handleAccessUpdate, setLoading, getProjects)}

                </Box>
            </Box>

        </Box>
    );
}