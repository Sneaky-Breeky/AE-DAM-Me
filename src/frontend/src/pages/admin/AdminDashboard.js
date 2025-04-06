import Box from '@mui/material/Box';
import { Typography, Row, Col } from 'antd';
import { FolderOutlined, UserOutlined, SettingOutlined, LockOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const pages = [
  { title: 'Manage Project Directories', icon: FolderOutlined, url: '/admin/projectManagement', menu: 1 },
  { title: 'User Management', icon: UserOutlined, url: '/admin/userManagement', menu: 2 },
  { title: 'Metadata Management', icon: SettingOutlined, url: '/admin/metadataManagement', menu: 3 },
  { title: 'File Metadata Management', icon: UnorderedListOutlined, url: '/admin/fileManagement', menu: 4 },
  { title: 'Assign Project Security', icon: LockOutlined, url: '/admin/projectSecurity', menu: 5 }
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
          margin: 4,
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
          height: '100vh',
          width: '70%',
          margin: '20px auto',
          padding: '20px',
          overflow: 'hidden',
        }}
      >

        <Row gutter={[16, 16]} justify="center">
          {pages.map((page) => (
            <Col key={page.url} span={8} align="center">
              <Box
                onClick={() => {
                  sessionStorage.setItem('menu', page.menu);
                  navigate(page.url);
                }}
                sx={{
                  textAlign: 'center',
                  width: '80%',
                  height: '100%',
                  margin: '5%',
                  backgroundColor: 'grey.300',
                  border: 1,
                  borderColor: 'grey.500',
                  borderRadius: '16px',
                  '&:hover': { boxShadow: 3 },
                  overflow: 'auto'
                }}
              >
                <page.icon style={{ marginTop: '10%', marginBottom: '0', fontSize: '500%'}} />
                <h4 style={{ margin: '0', marginBottom: '10%' }}>{page.title}</h4>
              </Box>
            </Col>
          ))}
        </Row>
      </Box>
    </Box>
  );
}
