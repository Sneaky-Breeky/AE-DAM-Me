import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Typography} from 'antd';

const { Title } = Typography;

export default function AdminProjectManage() {
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
            <Title level={1}>Project Management</Title>
          </Box>
          </Box>
        );
}