import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import { Typography, } from 'antd';
// import { logs } from '../../utils/dummyData.js';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function ActivityLog() {
    const [logs] = useState([]);

    const userid = 'take the user id';

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch("api/log/fetch"+userid);
                if (!response.ok) {

                    throw new Error('Failed to fetch logs');
                }
                const data = await response.json();

            } catch (err) {
                throw new Error('Failed to fetch logs');
            }
        };
        // fetchLogs();
    }, []);

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

    <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <tr>
            <th style={{height: '50px', textAlign: 'left', borderBottom:'1px solid black'}} >Timestamp</th>
            <th style={{height: '50px', textAlign: 'left', borderBottom:'1px solid black'}} >Activities</th>
        </tr>
            {logs.map((log) => (
                <tr>
                    <td style={{width: '40%', textAlign: 'left', borderBottom:'1px solid black'}} >{dayjs(log.time).format('MMM DD, YYYY h:mma')}</td>
                    <td style={{width: '60%', textAlign: 'left', borderBottom:'1px solid black'}} >{log.action}</td>
                </tr>
            ))}
    </table>

</Box>

    </Box>
  );
}