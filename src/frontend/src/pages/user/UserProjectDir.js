import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Input, Button, DatePicker, Form, Typography, Card, Row, Col, Select, Tooltip } from 'antd';
import { SearchOutlined, CalendarOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projects, users } from '../../utils/dummyData.js';

const { Title } = Typography;
const { Meta } = Card;


export default function UserProjectDir() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();
  const currentUser = users.find((user) => user.name === "John Doe"); // assume John Doe is logged in
  const [favProjects, setFavProjects] = useState(new Set(currentUser.favProjs));

  const handleSearch = () => {
    // when backend is done connect this part with backend
    console.log("Search Query:", searchQuery, "Date:", selectedDate);
  };

  const toggleFavorite = (projectId) => {
    const updatedFavs = new Set(favProjects);
    if (updatedFavs.has(projectId)) {
      updatedFavs.delete(projectId);
    } else {
      updatedFavs.add(projectId);
    }
    setFavProjects(updatedFavs);

    currentUser.favProjs = Array.from(updatedFavs);
    console.log("Updated Favorites:", currentUser.favProjs);
  };

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
        <Title level={1}>Project Directory</Title>
      </Box>


      {/* Search stuff*/}
      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: 'gray.50',
          padding: 1,
        }}
      >
        <Form
          layout="inline"
          onFinish={handleSearch}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Form.Item>
            <Input
              placeholder="Search projects..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '300px' }}
            />
          </Form.Item>

          <Form.Item>
            <Select
              defaultValue="Active"
              style={{ width: 120 }}
              allowClear
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }]}
              placeholder="Select Status"
            />
          </Form.Item>

          <Form.Item>
            <DatePicker
              placeholder="Select date"
              onChange={(date, dateString) => setSelectedDate(dateString)}
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" color="cyan" variant="solid">
              Search
            </Button>
          </Form.Item>
        </Form>
      </Box>





      {/* Main content */}
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
        }}
      >



        {/* Container with active projects */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            height: '60vh',
            width: '80%',
            margin: '20px auto',
            backgroundColor: '#f5f5f5',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              overflowY: 'auto',
              height: '100%',
              width: '100%',
              paddingRight: '10px',
            }}
          >
            <Row gutter={[16, 16]} justify="center">
              {projects.sort((a, b) => {
                const aFav = favProjects.has(a.id) ? -1 : 1;
                const bFav = favProjects.has(b.id) ? -1 : 1;
                return aFav - bFav;
              }).map((project, index) => (
                <Col key={index} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    cover={
                      <img
                        alt={project.name}
                        src={project.thumbnail}
                        style={{ height: '80px', objectFit: 'cover' }}
                      />
                    }
                    onClick={() => navigate(`/projectDirectory/projectOverview/${project.id}`, { state: { project } })}
                    style={{
                      borderRadius: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <Tooltip title="Favorite Project">
                      {favProjects.has(project.id) ? (
                        <StarFilled
                          style={{
                            fontSize: '22px',
                            color: '#FFD700',
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease-in-out',
                            textShadow: '0px 0px 4px rgba(0, 0, 0, 0.5)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(project.id);
                          }}
                        />
                      ) : (
                        <StarOutlined
                          style={{
                            fontSize: '22px',
                            color: '#FFD700',
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease-in-out',
                            WebkitTextStroke: '1.5px black',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(project.id);
                          }}
                        />
                      )}
                    </Tooltip>
                    <Meta
                      title={project.name}
                      description={project.location}
                      style={{ textAlign: 'center' }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}