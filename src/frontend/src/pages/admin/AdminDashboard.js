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
        alignItems:'center',
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
          flexWrap: 'wrap',
          justifyContent: 'space-evenly',
          alignItems: 'center',
          height: '70vh',
          width: '80%',
          overflow: 'auto',
        }}
      >

        {/* <Row gutter={[16, 16]} justify="center"> */}
          {pages.map((page) => (
            // <Col key={page.url} span={8} align="center">
              <Box
                onClick={() => {
                  sessionStorage.setItem('menu', page.menu);
                  navigate(page.url);
                }}
                sx={{
                  textAlign: 'center',
                  width: 250,
                  minWidth: '200px',
                  height: 150,
                  minHeight: '80px',
                  margin: '1%',
                  backgroundColor: 'grey.300',
                  border: 1,
                  borderColor: 'grey.500',
                  borderRadius: '16px',
                  '&:hover': { boxShadow: 3 },
                  overflow: 'auto'
                }}
              >
                <page.icon style={{ marginTop: '8%', fontSize: '80px'}} />
                <h4 style={{ margin: '0', marginBottom: '10%' }}>{page.title}</h4>
              </Box>
            // </Col>
          ))}
        {/* </Row> */}
      </Box>
    </Box>
  );
}
