import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import {Input, Button, DatePicker, Form, Typography, Card, Row, Col, Select, Tooltip, message} from 'antd';
import {
    SearchOutlined,
    CalendarOutlined,
    StarFilled,
    StarOutlined,
    PlusOutlined,
    UnorderedListOutlined
} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import dayjs from 'dayjs';
import {addFavorite, removeFavorite, fetchProjects, fetchFavoriteProjects} from '../../api/projectApi';
import {fetchProjectsByDateRange} from '../../api/queryFile';
import {useAuth} from '../../contexts/AuthContext';
import {getProjectBasicTags} from "../../api/queryFile";

const {Title} = Typography;
const {Meta} = Card;
const {RangePicker} = DatePicker;


export default function UserDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [favProjects, setFavProjects] = useState(new Set());

    const {user} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        async function loadProjects() {
            if (!user?.id) return;
            const response = await fetchProjects();
            if (!response.error) {
                setProjects(response);
                setFilteredProjects(response);
            } else {
                console.error(response.error);
            }

            const favsResponse = await fetchFavoriteProjects(user.id);
            if (Array.isArray(favsResponse)) {
                const favIds = favsResponse.map(p => p.id);
                setFavProjects(new Set(favIds));
            } else {
                console.error("Failed to fetch favorites:", favsResponse?.error || favsResponse);
            }
        }

        if (user) {
            loadProjects();
        }
    }, [user]);

    useEffect(() => {
        console.log('Current user from AuthContext:', user);
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
            StartDate,
            EndDate,
        };

        let filtered = projects.filter(project => {
            const projectDate = dayjs(project.startDate);
            return (!start || projectDate.isAfter(dayjs(StartDate).startOf('day'))) &&
                (!end || projectDate.isBefore(dayjs(EndDate).endOf('day')));
        });

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

        setFilteredProjects(filtered);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setDateRange(null);
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
                padding: '20px auto', 
                overflow: 'auto'
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


            {/* Search stuff*/}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    backgroundColor: 'gray.50',
                }}
            >
                <Form
                    layout="inline"
                    onFinish={handleSearch}
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap', 
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    <Form.Item>
                        <Input
                            placeholder="Search files..."
                            prefix={<SearchOutlined/>}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{width: '300px'}}
                        />
                    </Form.Item>

                    <Form.Item>
                        <RangePicker
                            placeholder={["Start date", "End date"]}
                            suffixIcon={<CalendarOutlined/>}
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
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'anchor-center',
                    flexGrow: 1,
                }}
            >
                {/* Left container w buttons */}
                <Box
                    sx={{
                        display: 'flex',
                        lexDirection: 'column',
                        flexWrap: 'wrap',
                        justifyContent: 'space-evenly',
                        alignItems: 'center',
                        gap: 2,
                        width: '20%',
                        minWidth: '150px',
                        height: '60vh',
                        margin: '10px auto',
                    }}
                >

                    <Box
                        onClick={() => {
                            sessionStorage.setItem('menu', 2);
                            navigate('/user/uploadFiles');
                        }}
                        sx={{
                            textAlign: 'center',
                            width: 200,
                            height: 160,
                            margin: '10%',
                            backgroundColor: 'grey.300',
                            border: 1,
                            borderColor: 'grey.500',
                            borderRadius: '16px',
                            '&:hover': {boxShadow: 3},
                        }}
                    >
                        <PlusOutlined style={{marginTop: '30px', fontSize: '50px'}}/>
                        <h4>Upload Images/Videos</h4>
                    </Box>

                    <Box
                        onClick={() => {
                            sessionStorage.setItem('menu', 3);
                            navigate('/user/activityLog');
                        }}
                        sx={{
                            textAlign: 'center',
                            width: 200,
                            height: 160,
                            margin: '10%',
                            backgroundColor: 'grey.300',
                            border: 1,
                            borderColor: 'grey.500',
                            borderRadius: '16px',
                            '&:hover': {boxShadow: 3},
                        }}
                    >
                        <UnorderedListOutlined style={{marginTop: '30px', fontSize: '50px'}}/>
                        <h4>Activity Log</h4>
                    </Box>
                </Box>


                {/* Right container with active projects */}
                <Box
                    onClick={() => {
                        sessionStorage.setItem('menu', 1);
                        navigate('/user/projectDirectory');
                    }}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        height: '60vh',
                        width: '65%',
                        margin: '10px auto',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '10px',
                        padding: '20px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        '&:hover': {boxShadow: 3},
                    }}
                >
                    <Title level={3} style={{textAlign: 'center', marginBottom: '30px', marginTop: '0px'}}>
                        Active Projects
                    </Title>
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
                                                    style={{height: '80px', objectFit: 'cover'}}
                                                />
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                sessionStorage.setItem('menu', 1);
                                                navigate(`/projectDirectory/projectOverview/${project.id}`, { state: { project } });
                                                //window.location.reload();
                                            }}
                                            style={{borderRadius: '10px', overflow: 'hidden'}}
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
                                                    <div style={{textAlign: 'center'}}>
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