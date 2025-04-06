import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Typography, Spin, Alert } from 'antd';
// import { logs } from '../../utils/dummyData.js';
import dayjs from 'dayjs';
import { fetchLog } from "../../api/logApi";
import { useAuth } from "./../../contexts/AuthContext"

const { Title } = Typography;

export default function ActivityLog() {
    const { user, isAdmin } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadLogs() {
            const logs = await fetchLog(user.id);
            console.log("here");
            console.log(logs);
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
                        {isAdmin ? 
                        (
                            <tr style={{ height: '10%' }}>
                                <th style={{ width: '20%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                    User
                                </th>
                                <th style={{ width: '50%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                    Activities
                                </th>
                                <th style={{ width: '30%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                    Timestamp
                                </th>
                            </tr>
                        )
                        : (
                            <tr style={{ height: '10%' }}>
                                <th style={{ width: '70%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                    Activities
                                </th>
                                <th style={{ width: '30%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                    Timestamp
                                </th>
                            </tr>
                        )}
                        
                    </thead>

                    <tbody>
                        {isAdmin ?
                        (
                            logs.map((log, index) => (
                                <tr key={log.id || index}>
                                    <td style={{ width: '20%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                        <p style={{margin: '0'}}>{log.UserID}</p>
                                    </td>
                                    <td style={{ width: '50%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                        <p style={{margin: '0'}}>{log.action}</p>
                                        {log.FileID && 
                                        (<p style={{margin: '0' }}><span>File ID: </span> <span style={{ color: 'grey', fontStyle: 'italic' }}>{log.FileID} </span></p>)}
                                        {log.ProjectID && 
                                        (<p style={{margin: '0' }}><span>Project ID: </span> <span style={{ color: 'grey', fontStyle: 'italic' }}>{log.ProjectID} </span></p>)}
                                    </td>
                                    <td style={{ width: '30%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                        <p style={{margin: '0'}}>{dayjs(log.time).format('MMM DD, YYYY h:mma')}</p>
                                    </td>
                                </tr>
                            ))
                        )
                        :(
                            logs.map((log, index) => (
                                <tr key={log.id || index}>
                                    <td style={{ width: '70%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                        <p style={{margin: '0'}}>{log.action}</p>
                                        <p style={{margin: '0'}}>{log.action}</p>
                                        {log.FileID && 
                                        (<p style={{margin: '0' }}><span>File ID: </span> <span style={{ color: 'grey', fontStyle: 'italic' }}>{log.FileID} </span></p>)}
                                        {log.ProjectID && 
                                        (<p style={{margin: '0' }}><span>Project ID: </span> <span style={{ color: 'grey', fontStyle: 'italic' }}>{log.ProjectID} </span></p>)}
                                    </td>
                                    <td style={{ width: '30%', textAlign: 'left', borderBottom: '1px solid black' }}>
                                        <p style={{margin: '0'}}>{dayjs(log.time).format('MMM DD, YYYY h:mma')}</p>
                                    </td>
                                </tr>
                            ))
                        )}
                        
                    </tbody>
                </table>
                </div>

            </Box>

        </Box>
    );
}
