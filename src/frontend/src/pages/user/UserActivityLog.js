import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Typography, Spin, Alert, Select, MenuItem } from 'antd';
import dayjs from 'dayjs';
import { fetchLog } from "../../api/logApi";  // assuming this function fetches the logs for the user
import { fetchProjectsForUser } from "../../api/projectApi"; // assuming this function fetches the projects for the user
import { useAuth } from "../../contexts/AuthContext";

const { Title } = Typography;
const { Option } = Select;

export default function ActivityLog() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [error, setError] = useState(null);

    // Fetch user logs and user projects
    useEffect(() => {
        async function loadData() {
            if (user && user.id) {
                setLoading(true);
                try {
                    // Fetch user logs
                    const logsResult = await fetchLog(user.id);
                    setLogs(logsResult);

                    // Fetch user projects
                    const projectsResult = await fetchProjectsForUser(user.id);
                    setProjects(projectsResult);
                } catch (error) {
                    setError(error);
                } finally {
                    setLoading(false);
                }
            }
        }

        loadData();
    }, [user]);

    // Handle project selection from the dropdown
    const handleProjectChange = (projectId) => {
        setSelectedProject(projectId);
    };

    // Filter logs based on the selected project
    const filteredLogs = selectedProject
        ? logs.filter((log) => log.projectId === selectedProject)
        : logs;

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
            {/* Title */}
            <Box
                sx={{
                    textAlign: 'center',
                    padding: 4,
                }}
            >
                <Title level={1}>Activity Log</Title>
            </Box>

            {/* Project Dropdown */}
            <Box
                sx={{
                    padding: '10px',
                    textAlign: 'center',
                }}
            >
                <h3>Select a Project to view Logs</h3>
                <Select
                    style={{ width: '200px' }}
                    value={selectedProject || undefined}
                    onChange={handleProjectChange}
                    placeholder="Select a project"
                >
                    {projects.map((project) => (
                        <Option key={project.id} value={project.id}>
                            {project.name}
                        </Option>
                    ))}
                </Select>
            </Box>

            {/* container with activity log */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'left',
                    height: '60vh',
                    width: '80%',
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
                                }}
                            >
                                Activity
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {[...filteredLogs]
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
                                        <p style={{ margin: '0' }}>
                                            {log.fileId == null && log.projectId == null
                                                ? 'Data Changed'
                                                : log.action}
                                        </p>
                                        {log.fileId && (
                                            <p style={{ margin: '0' }}>
                                                <span>File ID: </span>
                                                <span style={{ color: 'grey', fontStyle: 'italic' }}>
                                                        {log.fileId}
                                                    </span>
                                            </p>
                                        )}
                                        {log.projectId && (
                                            <p style={{ margin: '0' }}>
                                                <span>Project ID: </span>
                                                <span style={{ color: 'grey', fontStyle: 'italic' }}>
                                                        {log.projectId}
                                                    </span>
                                            </p>
                                        )}
                                        {log.typeOfLog && log.typeOfLog.startsWith('Deleted') && log.projectId && (
                                            <p style={{ margin: '0' }}>
                                                Project ID: {log.projectId}
                                            </p>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            width: '20%',
                                            textAlign: 'left',
                                            borderBottom: '1px solid black',
                                        }}
                                    >
                                        <p style={{ margin: '0' }}>
                                            {dayjs(log.logDate).format('MMM DD, YYYY h:mm A')}
                                        </p>
                                    </td>
                                    <td
                                        style={{
                                            width: '30%',
                                            textAlign: 'left',
                                            borderBottom: '1px solid black',
                                        }}
                                    >
                                        <p style={{ margin: '0' }}>
                                            {log.typeOfLog || 'N/A'}
                                        </p>
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
