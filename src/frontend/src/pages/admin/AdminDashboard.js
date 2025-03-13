import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Input, Button, Typography, Row, Col } from 'antd';
import { PlusOutlined, UserOutlined, SettingOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const pages = [
  {title: 'Create Project Directories', icon: PlusOutlined, url: '/admin/projectCreation', menu: 1 },
  {title: 'User Management', icon: UserOutlined, url: '/admin/userManagement', menu: 2 },
  {title: 'Metadata Management', icon: SettingOutlined, url: '/admin/metadataManagement', menu: 3 },
  {title: 'Assign Project Security', icon: LockOutlined, url: '/admin/projectSecurity', menu: 4 }
]

export default function AdminDashboard() {
  const navigate = useNavigate();

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
      <Title level={1}>Dashboard</Title>
    </Box>

    <Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: '60vh',
    width: '70%',
    margin: '20px auto',
    padding: '20px',
    overflow: 'hidden',
  }}
>

      <Row gutter={[16, 16]} justify="center">
        {pages.map((page) => (
          <Col span={12} align="center">
          <Box
          onClick={() => {
            sessionStorage.setItem('menu', page.menu);
            navigate(page.url);
          }}
          sx={{
            textAlign: 'center',
            width: 250,
            height: 200,
            backgroundColor: 'grey.300',
            border: 1,
            borderColor: 'grey.500',
            borderRadius: '16px',
            '&:hover': { boxShadow: 3},
            }}
          >
            <page.icon style={{ marginTop: '30px', fontSize: '80px'}}/>
            <h4>{page.title}</h4>
          </Box>
        </Col>
        ))}
      </Row>
    </Box>
  </Box>
  );
}
