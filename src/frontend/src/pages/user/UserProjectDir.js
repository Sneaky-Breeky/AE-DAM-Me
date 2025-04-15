import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Input, Button, DatePicker, Form, Typography, Card, Row, Col, Select, Tooltip, message } from 'antd';
import { SearchOutlined, CalendarOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'
import {addFavorite, removeFavorite, fetchProjects, fetchFavoriteProjects, fetchProjectsForUser} from '../../api/projectApi';
import {fetchProjectsByDateRange, getProjectBasicTags} from '../../api/queryFile';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Meta } = Card;


export default function UserProjectDir() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [favProjects, setFavProjects] = useState(new Set(user?.favProjects || []));

    useEffect(() => {
        const loadProjects = async () => {
            if (!user?.id) return;

            const data = await fetchProjects();
            if (data.error) {
                console.error(data.error);
            } else {
                setProjects(data);
                setFilteredProjects(data);
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



    const handleSearch = async () => {
        const [start, end] = dateRange || [];
        const StartDate = start
            ? dayjs(start).toISOString()
            : '0001-01-01T00:00:00Z';

        const EndDate = end
            ? dayjs(end).toISOString()
            : '9999-12-31T23:59:59Z';

        const query = {
            StartDate: StartDate,
            EndDate: EndDate,
        };

        console.log("Search Query:", query);

        let baseProjects;

        if (selectedStatus === "myProjects") {
            baseProjects = await fetchProjectsForUser(user.id);
            if (baseProjects.error) {
                message.error("Failed to load your projects.");
                return;
            }
        } else {
            baseProjects = projects;
        }

        let filteredbydate = baseProjects.filter(project => {
            const projectDate = dayjs(project.startDate);
            return  (!start || projectDate.isAfter(dayjs(StartDate).startOf('day'))) &&
                (!end || projectDate.isBefore(dayjs(EndDate).endOf('day')));
        });

        let filtered = filteredbydate;
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();

            filtered = await Promise.all(
                filtered.map(async (project) => {
                    const match =
                        project.name.toLowerCase().includes(lowerQuery) ||
                        project.id.toString().includes(lowerQuery) ||
                        project.location.toLowerCase().includes(lowerQuery);

                    const tags = await getProjectBasicTags(project.id);
                    const tagMatch = tags?.some(tag =>
                        tag.toLowerCase().includes(lowerQuery)
                    );

                    return match || tagMatch ? project : null;
                })
            );

            filtered = filtered.filter(Boolean);
        }

        if (selectedStatus && selectedStatus !== "myProjects") {
            filtered = filtered.filter(project =>
                project.status.toLowerCase() === selectedStatus.toLowerCase()
            );
        }
        setFilteredProjects(filtered);
        console.log("Filtered projects being set:", filtered);
    };




    const handleClearFilters = () => {
        setSearchQuery('');
        setDateRange(null);
        setSelectedStatus("");
        setFilteredProjects(projects);
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

        if (response.error) {
            if (response.error.includes("User does not have access")) {
                message.warning("You don't have access to this project and cannot favorite it.");
            } else {
                console.error("Error updating favorite:", response.error);
                message.error("Something went wrong while updating favorites.");
            }
            setFavProjects(new Set(favProjects)); 
        } else {
            setFavProjects(new Set(updatedFavs));
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
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'myProjects', label: 'My Projects' }
                    ]}
                    value={selectedStatus || null}
                    onChange={(value) => {
                        setSelectedStatus(value);
                        handleSearch();
                    }}
                    placeholder="Category"
                />
            </Form.Item>

            <Form.Item>
                <DatePicker.RangePicker
                    placeholder={["Start date", "End date"]}
                    suffixIcon={<CalendarOutlined />}
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates)}
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
                          title={
                              <div style={{ textAlign: 'center' }}>
                                  {project.id} - {project.name}
                              </div>
                          }
                          description={project.location}
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