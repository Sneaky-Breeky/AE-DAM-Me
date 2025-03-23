import React, {useState} from 'react';
import Box from '@mui/material/Box';
import {Input, Button, DatePicker, Form, Typography, Card, Row, Col, Select, Tooltip} from 'antd';
import {
    SearchOutlined,
    CalendarOutlined,
    StarFilled,
    StarOutlined,
    PlusOutlined,
    UnorderedListOutlined
} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {projects, users} from '../../utils/dummyData.js';
import dayjs from 'dayjs';

const {Title} = Typography;
const {Meta} = Card;


export default function UserDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const navigate = useNavigate();
    const currentUser = users.find((user) => user.name === "John Doe"); // assume John Doe is logged in
    const [filteredProjects, setFilteredProjects] = useState(projects);
    //TODO: check each project to see if the current user has access to it, then modify it accordingly
    const [favProjects, setFavProjects] = useState(new Set(currentUser.favProjs));

    const handleSearch = () => {
        let filtered = [...projects];

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();

            filtered = filtered.filter(project =>
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
                dayjs(project.date).isSame(selectedDate, 'day')
            );
        }


        setFilteredProjects([...filtered]);
        console.log("Filtered projects:", filtered);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedDate(null);
        setFilteredProjects(projects);
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
                <Title level={1}>Dashboard</Title>
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
                            placeholder="Search files..."
                            prefix={<SearchOutlined/>}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{width: '300px'}}
                        />
                    </Form.Item>

                    <Form.Item>
                        <DatePicker
                            placeholder="Select date"
                            maxDate={dayjs()}
                            onChange={(date, dateString) => setSelectedDate(dateString)}
                            suffixIcon={<CalendarOutlined/>}
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
                {/* Left container w buttons */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-evenly',
                        alignItems: 'center',
                        gap: 2,
                        width: '20%',
                        minWidth: '150px',
                        padding: 2,
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
                        width: '70%',
                        margin: '20px auto',
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
                                .filter(project => project.status.toLowerCase() === "active") // ✅ Only show active projects
                                .sort((a, b) => (favProjects.has(a.id) ? -1 : 1) - (favProjects.has(b.id) ? -1 : 1))
                                .map((project, index) => (
                                    <Col key={index} xs={24} sm={12} md={8} lg={6}>
                                        <Card
                                            hoverable
                                            cover={
                                                <img
                                                    alt={project.name}
                                                    src={project.thumbnail}
                                                    style={{height: '80px', objectFit: 'cover'}}
                                                />
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                sessionStorage.setItem('menu', 1);
                                                navigate(`/projectDirectory/projectOverview/${project.id}`, {state: {project}});
                                                window.location.reload();
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
                                            <Meta title={project.name} description={project.location}
                                                  style={{textAlign: 'center'}}/>
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