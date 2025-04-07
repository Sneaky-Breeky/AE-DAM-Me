import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Typography, Spin, Alert } from 'antd';
import dayjs from 'dayjs';
import { fetchLog } from "../../api/logApi";
import { useAuth } from "./../../contexts/AuthContext";

const { Title } = Typography;

export default function ActivityLog() {
    const { user, isAdmin } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadLogs() {
            if (user && user.id) {
                setLoading(true);
                try {
                    const result = await fetchLog(user.id);
                    setLogs(result);
                } catch (error) {
                    setError(error);
                } finally {
                    setLoading(false);
                }
            }
        }

        loadLogs();
    }, [user]);

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

            {/* container with activity log */}
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
                        {isAdmin ? (
                            <tr style={{ height: '10%' }}>
                                <th
                                    style={{
                                        width: '15%', // Reduced width for User column
                                        textAlign: 'left',
                                        borderBottom: '1px solid black',
                                    }}
                                >
                                    User
                                </th>
                                <th
                                    style={{
                                        width: '35%', // Reduced width for Activities column
                                        textAlign: 'left',
                                        borderBottom: '1px solid black',
                                    }}
                                >
                                    Activities
                                </th>
                                <th
                                    style={{
                                        width: '20%', // Increased width for Timestamp column
                                        textAlign: 'left',
                                        borderBottom: '1px solid black',
                                    }}
                                >
                                    Timestamp
                                </th>
                                <th
                                    style={{
                                        width: '30%', // Expanded width for Type of Log column
                                        textAlign: 'left',
                                        borderBottom: '1px solid black',
                                        paddingLeft: '20px', // Added padding to the left of Type of Log column for more gap
                                    }}
                                >
                                    Type of Log
                                </th>
                            </tr>
                        ) : (
                            <tr style={{ height: '10%' }}>
                                <th
                                    style={{
                                        width: '55%', // Reduced width for Activities column
                                        textAlign: 'left',
                                        borderBottom: '1px solid black',
                                    }}
                                >
                                    Activities
                                </th>
                                <th
                                    style={{
                                        width: '45%', // Increased width for Timestamp column
                                        textAlign: 'left',
                                        borderBottom: '1px solid black',
                                    }}
                                >
                                    Timestamp
                                </th>
                            </tr>
                        )}
                        </thead>

                        <tbody>
                        {logs.map((log, index) => (
                            <tr key={log.id || index}>
                                {isAdmin ? (
                                    <>
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
                                        </td>
                                        <td
                                            style={{
                                                width: '20%',
                                                textAlign: 'left',
                                                borderBottom: '1px solid black',
                                            }}
                                        >
                                            <p style={{ margin: '0' }}>
                                                {dayjs(log.time).format('MMM DD, YYYY h:mma')}
                                            </p>
                                        </td>
                                        <td
                                            style={{
                                                width: '30%',
                                                textAlign: 'left',
                                                borderBottom: '1px solid black',
                                                paddingLeft: '20px', // Added padding for gap
                                            }}
                                        >
                                            <p style={{ margin: '0' }}>
                                                {log.typeOfLog || 'N/A'}
                                            </p>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td
                                            style={{
                                                width: '55%',
                                                textAlign: 'left',
                                                borderBottom: '1px solid black',
                                            }}
                                        >
                                            <p style={{ margin: '0' }}>{log.action}</p>
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
                                        </td>
                                        <td
                                            style={{
                                                width: '45%',
                                                textAlign: 'left',
                                                borderBottom: '1px solid black',
                                            }}
                                        >
                                            <p style={{ margin: '0' }}>
                                                {dayjs(log.time).format('MMM DD, YYYY h:mma')}
                                            </p>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Box>
        </Box>
    );
}
