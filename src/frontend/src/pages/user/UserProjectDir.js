import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Input, Button, DatePicker, Form, Typography, Card, Row, Col, Select, Tooltip } from 'antd';
import { SearchOutlined, CalendarOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
// import { projects, users } from '../../utils/dummyData.js';
import { useAuth } from '../../contexts/AuthContext'
import { fetchProjects } from '../../api/projectApi';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Meta } = Card;


export default function UserProjectDir() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const { user, login } = useAuth();
  //TODO: check each project to see if the current user has access to it, then modify it accordingly
  const navigate = useNavigate();

  const [favProjects, setFavProjects] = useState(new Set(user?.favProjects || []));

  useEffect(() => {
    const loadProjects = async () => {
      const data = await fetchProjects();
      if (data.error) {
        console.error(data.error);
      } else {
        setProjects(data);
        setFilteredProjects(data);
      }
    };
    loadProjects();
  }, []);

  const handleSearch = () => {
    let filtered = [...projects];

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter((project) =>
        project.name.toLowerCase() === query ||
        project.id.toString() === query ||
        project.location.toLowerCase() === query ||
        project.files.some(file =>
          file.Metadata.some(tag => tag.toLowerCase() === query)
        )
      );
    }

    if (selectedDate) {
      filtered = filtered.filter(project =>
        dayjs(project.startDate).isSame(selectedDate, 'day')
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(project =>
        project.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    setFilteredProjects(filtered);
    console.log("Filtered projects:", filtered);
  };


  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDate(null);
    setSelectedStatus('');
    setFilteredProjects([...projects]);
  };


  const toggleFavorite = (projectId) => {
    const updatedFavs = new Set(favProjects);

    if (updatedFavs.has(projectId)) {
      updatedFavs.delete(projectId);
    } else {
      updatedFavs.add(projectId);
    }

    setFavProjects(updatedFavs);

    login({ ...user, favProjects: Array.from(updatedFavs) });
    console.log("Updated Favorites:", user.favProjects);
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
              style={{ width: 120 }}
              allowClear
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }]}
              onChange={(value) => setSelectedStatus(value)}
              placeholder="Select status"
            />
          </Form.Item>

          <Form.Item>
            <DatePicker
              placeholder="Select date"
              maxDate={dayjs()}
              onChange={(date, dateString) => setSelectedDate(dateString)}
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" color="cyan" variant="solid">
              Search
            </Button>
          </Form.Item>

          <Form.Item>
            <Button type="default" onClick={handleClearFilters} danger>
              Clear Filters
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
              {filteredProjects.sort((a, b) => {
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
                        src={project.ImagePath}
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