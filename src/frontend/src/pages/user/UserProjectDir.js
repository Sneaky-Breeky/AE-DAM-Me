import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Input, Button, DatePicker, Form, Typography, Card, Row, Col, Select, Tooltip } from 'antd';
import { SearchOutlined, CalendarOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'
import {addFavorite, removeFavorite, fetchProjectsForUser, fetchFavoriteProjects} from '../../api/projectApi';
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
  const navigate = useNavigate();

  const [favProjects, setFavProjects] = useState(new Set(user?.favProjects || []));

    useEffect(() => {
        const loadProjects = async () => {
            if (!user?.id) return;

            const data = await fetchProjectsForUser(user.id);
            if (data.error) {
                console.error(data.error);
            } else {
                const activeProjects = data.filter(p => p.status.toLowerCase() === "active");
                setProjects(activeProjects);
                setFilteredProjects(activeProjects);
            }

            const favs = await fetchFavoriteProjects(user.id);
            if (!favs.error) {
                const favIds = favs.map(p => p.id);
                setFavProjects(new Set(favIds));
            } else {
                console.error(favs.error);
            }
        };
        loadProjects();
    }, [user]);


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
  };


  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDate(null);
    setSelectedStatus('');
    setFilteredProjects([...projects]);
  };


    const toggleFavorite = async (projectId) => {
        const updatedFavs = new Set(favProjects);
        let response;

        if (updatedFavs.has(projectId)) {
            updatedFavs.delete(projectId);
            response = await removeFavorite(user.id, projectId);
        } else {
            updatedFavs.add(projectId);
            response = await addFavorite(user.id, projectId);
        }

        if (!response.error) {
            setFavProjects(new Set(updatedFavs));
        } else {
            console.error("Error updating favorite:", response.error);
        }
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
                {filteredProjects
                    .filter(project => project.status.toLowerCase() === "active")
                    .sort((a, b) => (favProjects.has(a.id) ? -1 : 1) - (favProjects.has(b.id) ? -1 : 1))
                    .map((project, index) => (
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