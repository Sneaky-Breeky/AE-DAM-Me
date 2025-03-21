import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Input, Button, DatePicker, Form, Typography, Card, Row, Col, Select, Space, Image, Popconfirm } from 'antd';
import {
    SearchOutlined,
    CalendarOutlined,
    DownloadOutlined,
    LeftOutlined,
    RightOutlined,
    RotateLeftOutlined,
    RotateRightOutlined,
    SwapOutlined,
    UndoOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    DeleteOutlined,
    EditOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { projects, users } from '../../utils/dummyData.js';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Meta } = Card;

// instead of passing project via state, try access the url id and using params
export default function UserProjectOverview() {
    const { projectId } = useParams();
    const project = projects.find(proj => proj.id === projectId);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const navigate = useNavigate();
    const [current, setCurrent] = React.useState(0);
    const { state } = useLocation();
    const [imageList, setImageList] = useState(state.project.files);

    const [selectedImages, setSelectedImages] = useState(new Set());
    const [selectedStatus, setSelectedStatus] = useState("");



    if (!state?.project) {
        return <p>Project not found.</p>;
    }

    // if (!project) {
    //     return <p>Project not found.</p>;
    // }


    // when backend is done connect this part with backend
    const handleSearch = () => {
        let filteredImages = state.project.files;

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filteredImages = filteredImages.filter(file =>
                file.Metadata.some(tag => tag.toLowerCase().includes(query))
            );
        }

        if (selectedDate) {
            filteredImages = filteredImages.filter(file =>
                dayjs(file.Date).isSame(selectedDate, 'day')
            );
        }

        if (selectedStatus) {
            filteredImages = filteredImages.filter(file =>
                file.Status.toLowerCase() === selectedStatus.toLowerCase()
            );
        }

        setImageList(filteredImages);
        console.log("Filtered images:", filteredImages);
    };


    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedDate(null);
        setSelectedStatus('');
        setImageList(state.project.files);
    };


    const onDownload = () => {
        const url = imageList[current];
        const suffix = url.slice(url.lastIndexOf('.'));
        const filename = Date.now() + suffix;

        fetch(url)
            .then((response) => response.blob())
            .then((blob) => {
                const blobUrl = URL.createObjectURL(new Blob([blob]));
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                URL.revokeObjectURL(blobUrl);
                link.remove();
            });
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    padding: 6,
                    textAlign: 'center',
                }}
            >
                {/* Project info card at the top left */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        marginLeft: '40px',
                        marginTop: '20px'
                    }}
                >
                    <Card
                        style={{
                            backgroundColor: '#37474F',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            width: '250px',
                            color: 'white',
                            boxShadow: '2px 4px 10px rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        <Meta
                            title={<span style={{ color: 'white', fontWeight: 'bold' }}>{state.project.name}</span>}
                            description={<span style={{ color: 'white' }}>{state.project.location}</span>}
                            style={{ textAlign: 'center' }}
                        />
                    </Card>
                </Box>

                {/* Title */}
                <Title level={1} style={{ margin: '0 auto', textAlign: 'center' }}>Project Overview</Title>
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
                            placeholder="Search images by key word..."
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
                                { value: 'archived', label: 'Archived' }]}
                            onChange={(value) => setSelectedStatus(value)}
                            placeholder="Select status"
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

                    <Form.Item>
                        <Button type="default" onClick={handleClearFilters} danger>
                            Clear Filters
                        </Button>
                    </Form.Item>
                </Form>
            </Box>



            {/* Main content */}
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                {/* Image gallery*/}
                <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
                    <Image.PreviewGroup
                        preview={{
                            toolbarRender: (_, { transform: { scale }, actions }) => (
                                <Space size={12} className="toolbar-wrapper">
                                    <LeftOutlined onClick={() => actions.onActive?.(-1)} />
                                    <RightOutlined onClick={() => actions.onActive?.(1)} />
                                    <DownloadOutlined onClick={onDownload} />
                                    <SwapOutlined rotate={90} onClick={actions.onFlipY} />
                                    <SwapOutlined onClick={actions.onFlipX} />
                                    <RotateLeftOutlined onClick={actions.onRotateLeft} />
                                    <RotateRightOutlined onClick={actions.onRotateRight} />
                                    <ZoomOutOutlined disabled={scale === 1} onClick={actions.onZoomOut} />
                                    <ZoomInOutlined disabled={scale === 50} onClick={actions.onZoomIn} />
                                    <UndoOutlined onClick={actions.onReset} />
                                </Space>
                            ),
                            onChange: (index) => setCurrent(index),
                        }}
                    >
                        <Space wrap size={16} style={{ justifyContent: 'center' }}>

                            {imageList.map((file) => (
                                <Image
                                    key={file.Id}
                                    src={file.FilePath}
                                    width={200}
                                />
                            ))}
                        </Space>
                    </Image.PreviewGroup>
                </Box>
            </Box>
        </Box>
    );
}