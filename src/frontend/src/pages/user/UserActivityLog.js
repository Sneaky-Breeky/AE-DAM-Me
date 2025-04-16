import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Typography, Spin, Alert, Select } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import {fetchLog, fetchProjectLog} from "../../api/logApi";
import {fetchProjects, fetchProjectsForUser} from "../../api/projectApi"; // This API would need to be created to fetch the user's projects
import { useAuth } from "./../../contexts/AuthContext";
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;
const { Option } = Select;

export default function ActivityLog() {
    const { user, isAdmin } = useAuth();
    const [logs, setLogs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadLogsAndProjects() {
            if (user && user.id) {
                setLoading(true);
                try {
                    var userProjects = [];
                    if(isAdmin){
                        userProjects = await fetchProjects();
                    }
                    else{
                        userProjects = await fetchProjectsForUser(user.id);
                    }

                    setProjects(userProjects);

                    const result = await fetchLog(user.id);
                    setLogs(result);
                } catch (error) {
                    setError(error);
                } finally {
                    setLoading(false);
                }
            }
        }

        loadLogsAndProjects();
    }, [user]);

    async function handleProjectChange (projectId) {
        setSelectedProject(projectId);

        if (projectId) {
            const projectLogs = await fetchProjectLog(projectId);
            setLogs(projectLogs);
        } else {
            const result = await fetchLog(user.id);
            setLogs(result);
        }
    };

    if (!user) {
        return <Alert message="Please login to see your activity log." type="warning" />;
    }

    if (loading) {
        return <Spin tip="Loading..." />;
    }

    if (error) {
        return <Alert message="Error loading logs" type="error" />;
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
            }}
        >
            <Box
                sx={{
                    textAlign: 'center',
                    padding: 4,
                }}
            >
                <Title level={1}>Activity Log</Title>
            </Box>

            <Box
                sx={{
                    textAlign: 'center',
                    marginBottom: 2,
                }}
            >
                <Select
                    defaultValue={selectedProject || 'All Projects'}
                    style={{ width: '200px' }}
                    onChange={handleProjectChange}
                >
                    <Option value={null}>All Projects</Option>
                    {projects.map(project => (
                        <Option key={project.id} value={project.id}>
                            {project.name}
                        </Option>
                    ))}
                </Select>
            </Box>

            {/* Container with activity log */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'left',
                    height: '60vh',
                    width: '60%',
                    minWidth: '300px',
                    margin: '20px auto',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    overflow: 'auto',
                }}
            >
                <div style={{ overflowY: 'auto', width: '100%', height: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ height: '10%' }}>
                            <th
                                style={{
                                    width: '15%',
                                    textAlign: 'left',
                                    borderBottom: '1px solid black',
                                }}
                            >
                                User
                            </th>
                            <th
                                style={{
                                    width: '35%',
                                    textAlign: 'left',
                                    borderBottom: '1px solid black',
                                }}
                            >
                                Data Changed
                            </th>
                            <th
                                style={{
                                    width: '20%',
                                    textAlign: 'left',
                                    borderBottom: '1px solid black',
                                }}
                            >
                                Timestamp
                            </th>
                            <th
                                style={{
                                    width: '30%',
                                    textAlign: 'left',
                                    borderBottom: '1px solid black',
                                    paddingLeft: '20px',
                                }}
                            >
                                Activity
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            [...logs]
                            .sort((a, b) => new Date(b.logDate) - new Date(a.logDate))
                            .map((log, index) => (
                            <tr key={log.id || index}>
                                <td
                                    style={{
                                        width: '15%',
                                        textAlign: 'left',
                                        borderBottom: '1px solid black',
                                    }}
                                >
                                    <p style={{ margin: '0' }}>{log.userId}</p>
                                </td>
                                <td
                                    style={{
                                        width: '35%',
                                        textAlign: 'left',
                                        borderBottom: '1px solid black',
                                    }}
                                >
                                    <p style={{ margin: '0' }}>{log.action}</p>
                                    {log.projectId && (
                                        <p style={{ margin: '0' }}>
                                            <span>Project ID: </span>
                                            <span style={{ color: 'grey', fontStyle: 'italic' }}>
                                                    {log.projectId}
                                                </span>
                                        </p>
                                    )}
                                    {log.fileId && (
                                        <p style={{ margin: '0' }}>
                                            <span>File ID: </span>
                                            <span style={{ color: 'grey', fontStyle: 'italic' }}>
                                                    {log.fileId}
                                                </span>
                                        </p>
                                    )}

                                </td>
                                <td
                                    style={{
                                        width: '22%',
                                        textAlign: 'left',
                                        borderBottom: '1px solid black',
                                    }}
                                >
                                    <p style={{ margin: '0' }}>
                                        {dayjs(log.logDate).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('MMM DD, YYYY')}
                                    </p>
                                    <p style={{ margin: '0', fontSize: '0.9em', color: 'grey' }}>
                                        {dayjs(log.logDate).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('hh:mm:ss A')}
                                    </p>
                                </td>
                                <td
                                    style={{
                                        width: '30%',
                                        textAlign: 'left',
                                        borderBottom: '1px solid black',
                                        paddingLeft: '20px',
                                    }}
                                >
                                    <p style={{ margin: '0' }}>{log.typeOfLog || 'N/A'}</p>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Box>
        </Box>
    );
}
