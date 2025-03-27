import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Typography, Spin, Alert } from 'antd';
// import { logs } from '../../utils/dummyData.js';
import dayjs from 'dayjs';
import { fetchLog } from "../../api/logApi";
import { useAuth } from "./../../contexts/AuthContext"

const { Title } = Typography;

export default function ActivityLog() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadLogs() {
            if (user && user.id) {
                setLoading(true);
                const result = await fetchLog(user.id);
                if (result.error) {
                    setError(result.error);
                    setLogs([]);
                } else {
                    setLogs(result.data || []); // assuming your fetchLog returns { data: [...] }
                }
                setLoading(false);
            }
        }

        loadLogs();
    }, [user]);

    if (!user) {
        return <Alert message="Please login to see your activity log." type="warning" />;
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

            {/* Right container with activity log */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'left',
                    height: '60vh',
                    width: '60%',
                    margin: '20px auto',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    overflow: 'auto',
                }}
            >

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ height: '50px', textAlign: 'left', borderBottom: '1px solid black' }}>
                                Timestamp
                            </th>
                            <th style={{ height: '50px', textAlign: 'left', borderBottom: '1px solid black' }}>
                                Activities
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, index) => (
                            <tr key={log.id || index}>
                                <td style={{ width: '40%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                    {dayjs(log.time).format('MMM DD, YYYY h:mma')}
                                </td>
                                <td style={{ width: '60%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                    {log.action}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </Box>

        </Box>
    );
}