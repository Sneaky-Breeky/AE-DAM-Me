import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Input, Button, DatePicker, Form, Typography, Card, Row, Col, Select, Space, Image, Popconfirm, Tooltip, message } from 'antd';
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
    EditOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import {fetchProject, getFilesForProject} from '../../api/projectApi';
import dayjs from 'dayjs';
import {getProjectBasicTags, getProjectMetaDataTags, searchProjectFiles} from "../../api/queryFile";
import {getProjectImageBasicTags, getProjectImageMetaDataTags} from "../../api/imageApi";

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Meta } = Card;

export default function UserProjectOverview() {
    //project variables
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [projectMetaTags, setProjectMetaTags] = useState([]);
    
    //project's files' metadata variables
    const [allFileMetaTags, setAllFileMetaTags] = useState([]);
    const [selectedFileMDKey, setSelectedFileMDKey] = useState([]);
    const [fileMDValue, setFileMDValue] = useState([]);
    const [selectedOperator, setSelectedOperator] = useState(null);
    const [operatorDisabled, setOperatorDisabled] = useState(false);

    //project's files' tags
    const [allFileTags, setAllFileTags] = useState([]);
    const [selectedFileTag, setSelectedFileTag] = useState([]);
    
    
    //image variables
    const [imageList, setImageList] = useState([]);
    const [selectedImages, setSelectedImages] = useState(new Set());

    //other variables
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [current, setCurrent] = React.useState(0);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        async function fetchProjectAndFiles() {
            try {
                const projectData = await fetchProject(id);
                const projectFilesMetadataData = await getProjectMetaDataTags({ pid: id });
                const projectFilesTagsData = await getProjectBasicTags({ pid: id });
                setAllFileMetaTags(Array.isArray(projectFilesMetadataData) ? projectFilesMetadataData : []);
                setAllFileTags(Array.isArray(projectFilesTagsData) ? projectFilesTagsData : []);

                if (!projectData) {
                    console.warn("No project found");
                    setProject({});
                    return;
                }

                const files = await getFilesForProject({ projectId: id });

                const filesWithTags = await Promise.all(files.map(async (file) => {
                    const basicTags = await getProjectImageBasicTags({ pid: id, fid: file.id });
                    const metadataTags = await getProjectImageMetaDataTags({ pid: id, fid: file.id });

                    return {
                        ...file,
                        basicTags: basicTags || [],
                        metadataTags: metadataTags || [],
                    };
                }));

                //setProjectMetaTags(metaTags || []);
                setProject(projectData);
                setImageList(filesWithTags);
            } catch (err) {
                console.error("Failed to load project or files:", err);
                setProject({});
                setImageList([]);
            }
        }

        if (id) {
            fetchProjectAndFiles();
        }
    }, [id]);



    if (project === null) {
        return <p>Loading project...</p>;
    }

    const handleSearch = async () => {
        const metadataFields = [selectedFileMDKey, selectedOperator, fileMDValue];
        const metadataFilledCount = metadataFields.filter(val => {
            if (Array.isArray(val)) return val.length > 0; // treat [] as no input 
            return Boolean(val);
        }).length;

        if (metadataFilledCount > 0 && metadataFilledCount < 3) {
            message.warning('Please fill out all 3 metadata fields: key, operator, and value.');
            return;
        }

        const isNumber = !isNaN(fileMDValue);
        const v_type = isNumber ? 1 : 0;

        if (!isNumber && selectedOperator !== "=") {
            message.warning("Only '=' is allowed for string metadata comparisons.");
            return;
        }

        const metadataFilters = metadataFilledCount === 3 ? [
            {
                Key: selectedFileMDKey,
                Op: selectedOperator,
                Value: fileMDValue,
                v_type: v_type
            }
        ] : [];

        const tagArray = selectedFileTag && selectedFileTag.length > 0
            ? Array.isArray(selectedFileTag)
                ? selectedFileTag
                : [selectedFileTag]
            : [];

        const filterPayload = {
            BasicTags: { bTags: tagArray },
            MetadataTags: metadataFilters
        };


        try {
            const result = await searchProjectFiles(id, filterPayload);
            let filtered = result;

            if (selectedDateRange && selectedDateRange.length === 2) {
                const [start, end] = selectedDateRange;
                filtered = result.filter(file => {
                    const fileDate = dayjs(file.dateTimeOriginal);
                    return fileDate.isValid() && fileDate.isAfter(start) && fileDate.isBefore(end);
                });
            }

            const hydratedFiles = await Promise.all(
                filtered.map(async (file) => {
                    const basicTags = await getProjectImageBasicTags({ pid: id, fid: file.id });
                    const metadataTags = await getProjectImageMetaDataTags({ pid: id, fid: file.id });

                    return {
                        ...file,
                        basicTags: basicTags || [],
                        metadataTags: metadataTags || [],
                    };
                })
            );

            setImageList(hydratedFiles);
        } catch (error) {
            console.error("Search failed:", error);
            setImageList([]);
        }
    };





    const handleClearFilters = async () => {
        setSearchQuery('');
        setSelectedDateRange(null);
        setSelectedStatus('');
        setSelectedFileMDKey(null);
        setSelectedOperator(null);
        setFileMDValue('');
        setSelectedFileTag(null);
        setOperatorDisabled(false);

        try {
            const files = await getFilesForProject({ projectId: id });
            const filesWithTags = await Promise.all(files.map(async (file) => {
                const basicTags = await getProjectImageBasicTags({ pid: id, fid: file.id });
                const metadataTags = await getProjectImageMetaDataTags({ pid: id, fid: file.id });

                return {
                    ...file,
                    basicTags: basicTags || [],
                    metadataTags: metadataTags || [],
                };
            }));

            setImageList(filesWithTags);
        } catch (err) {
            console.error("Failed to reload project files:", err);
            setImageList([]);
        }
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

    const toggleEditMode = () => {
        setIsEditMode((prev) => !prev);
        setSelectedImages(new Set());
    };

    const toggleSelectImage = (index) => {
        if (!isEditMode) return;

        const updatedSelection = new Set(selectedImages);
        if (updatedSelection.has(index)) {
            updatedSelection.delete(index);
        } else {
            updatedSelection.add(index);
        }
        setSelectedImages(updatedSelection);
    };

    const downloadSelectedImages = () => {
        console.log(selectedImages);
        //setImageList(imageList.filter((_, index) => !selectedImages.has(index)));
        setSelectedImages(new Set());
        setIsEditMode(false);
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
                            title={<span style={{ color: 'white', fontWeight: 'bold' }}>{project?.name}</span>}
                            description={<span style={{ color: 'white' }}>{project.location}</span>}
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
                    padding: 1,
                    width:'70%',
                    margin: '20px auto',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
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
                        marginBottom: '10px',
                    }}
                >
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={2}
                        mb={2}
                    >
                    <span style={{ fontWeight: 'bold', fontSize: '20px' }}>Filter Date:</span>

                        <Form.Item>
                            <RangePicker
                                maxDate={dayjs()}
                                onChange={(dates) => setSelectedDateRange(dates)}
                                allowClear
                                style={{ width: 300 }}
                                placeholder={['Start date', 'End date']}
                                suffixIcon={<CalendarOutlined />}
                                value={selectedDateRange}
                            />
                        </Form.Item>
                    </Box>

                    
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={2}
                        mb={2}
                        justifyContent="center"
                    >

                    <span style={{ fontWeight: 'bold', fontSize: '20px' }}>Filter Metadata:</span>
                    <Form.Item>
                        <Select
                            showSearch
                            placeholder="Metadata key"
                            allowClear
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={allFileMetaTags.map((md) => ({
                                value: md,
                                label: md,
                            }))}
                            onChange={setSelectedFileMDKey}
                            style={{ width:'100%', marginBottom:'5%'}}
                            //disabled={selectProject === null}
                            value={selectedFileMDKey !== null ? selectedFileMDKey : undefined}
                        />
                    </Form.Item>
                    

                    <Form.Item>
                        <Select
                            placeholder="?"
                            //style={{ width: 60 }}
                            style={{ width:'100%', marginBottom:'5%', overflow:'auto'}}
                            allowClear
                            disabled={operatorDisabled}
                            options={[
                                { value: '>', label: '>' },
                                { value: '<', label: '<' },
                                { value: '=', label: '=' },
                                { value: '<=', label: '≤' },
                                { value: '>=', label: '≥' },
                            ]}
                            onChange={(value) => setSelectedOperator(value)}
                            value={selectedOperator}
                        />
                    </Form.Item>

                        <Form.Item>
                            <Input
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFileMDValue(value);

                                    // if string is in metadata value input, automatically have '=' in operator field and disable it
                                    if (value === '') {
                                        setOperatorDisabled(false);
                                        setSelectedOperator(null);
                                    } else if (isNaN(value)) {
                                        setSelectedOperator('=');
                                        setOperatorDisabled(true);
                                    } else {
                                        setOperatorDisabled(false);
                                    }
                                }}
                                style={{ width:'100%', marginBottom:'5%', overflow:'auto' }}
                                placeholder="Metadata value"
                                value={fileMDValue}
                            />
                        </Form.Item>

                    </Box>



                    <Box
                            display="flex"
                            alignItems="center"
                            gap={2}
                            mb={2}
                            justifyContent="center"
                        >
                    <span style={{ fontWeight: 'bold', fontSize: '20px' }}>Filter Tags:</span>
                    <Form.Item>
                        <Select
                            showSearch
                            placeholder="Tag"
                            allowClear
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={allFileTags.map((md) => ({
                                value: md,
                                label: md,
                            }))}
                            onChange={setSelectedFileTag}
                            style={{ width:'100%', marginBottom:'5%', overflow:'auto'}}
                            //disabled={selectProject === null}
                            value={selectedFileTag !== null ? selectedFileTag : undefined}
                        />
                    </Form.Item>
                    </Box>


                <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    mb={2}
                    justifyContent="center"
                >
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
                    
                </Box>
            </Form>

        </Box>
        
        

            {/* Main content */}
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                {/* Project Metadata */}
                <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    width:'70%',
                    margin: '20px auto',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width:'100%'}}>
                        <div><strong>Location: </strong><span>{project.location}</span></div>
                        <div><strong>Start Date: </strong><span>{dayjs(project.startDate).format('MMM DD, YYYY')}</span></div>
                        <div><strong>State: </strong><span>{project.status}</span></div>
                        <div><strong>Phase: </strong><span>{project.phase}</span></div>
                        </div>
                    <div style={{ margin: '20px auto', marginBottom: '0', width: '100%' }}>
                        <strong>Metadata: </strong>
                        {projectMetaTags.length > 0 ? (
                            projectMetaTags.map((tag, idx) => (
                                <span key={idx} style={{ marginRight: '8px', color: 'grey', fontStyle: 'italic' }}>
                {tag}
            </span>
                            ))
                        ) : (
                            <span style={{ color: 'grey', fontStyle: 'italic' }}>No metadata</span>
                        )}
                    </div>
                </Box>
                {/* Download Images */}
                <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'left', margin: '20px auto', gap: '10px', width:'70%', }}>
                <Button
                    onClick={toggleEditMode}
                    color="primary" 
                    type="primary"
                    ghost={isEditMode}
                    icon={<EditOutlined />}
                >
                    {isEditMode ? "Cancel Selection Mode" : "Select from Gallery"}
                </Button>
                {/* Download button */}
                {isEditMode && selectedImages.size > 0 && (
                    <Popconfirm
                        title="Download Images"
                        description="Are you sure you want to download the selected images?"
                        onConfirm={downloadSelectedImages}
                        icon={<QuestionCircleOutlined style={{ color: 'gray' }} />}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button color="primary" variant="filled" icon={<DownloadOutlined />}>
                            Download
                        </Button>
                    </Popconfirm>
                )}
                </Box>
                {/* Image gallery*/}
                <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
                {isEditMode ? (
                        <Space wrap size={16} style={{ justifyContent: 'center' }}>
                            {imageList.map((file) => (
                                <div
                                    key={file.Id}
                                    style={{ position: 'relative', cursor: 'pointer' }}
                                    onClick={() => toggleSelectImage(file.Id)}
                                >
                                    <Image
                                        key={file.id}
                                        src={file.thumbnailPath || file.viewPath || file.originalPath}t
                                        width={200}
                                        preview={false}
                                        style={{
                                            borderRadius: '8px',
                                            transition: '0.2s ease-in-out',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    {selectedImages.has(file.Id) && (
                                        <DownloadOutlined
                                            style={{
                                                position: 'absolute',
                                                top: 5,
                                                right: 5,
                                                color: 'white',
                                                background: 'blue',
                                                borderRadius: '50%',
                                                padding: '5px',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                            }}
                                        />
                                    )}
                                </div>
                            ))}

                        </Space>
                    ) : (
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
                            {imageList.length === 0 ? (
                                <Typography.Text type="secondary">No files found for this project.</Typography.Text>
                            ) : (
                                <Space wrap size={16} style={{ justifyContent: 'center' }}>
                                    {imageList.map((file) => (
                                        <Tooltip
                                            key={file.Id}
                                            title={
                                                <>
                                                    <div><strong>Basic Tags:</strong> {file.basicTags?.join(', ') || 'None'}</div>
                                                    <div><strong>Metadata Tags:</strong> {file.mTags?.map(t => t.value).join(', ') || 'None'}</div>
                                                </>
                                            }
                                        >
                                           
                                            <Image
                                                src={file.thumbnailPath || file.originalPath  || file.viewPath}
                                                width={200}
                                                preview={false}
                                                style={{
                                                    borderRadius: '8px',
                                                    transition: '0.2s ease-in-out',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            
                                        </Tooltip>
                                        
                                    ))}
                                </Space>
                            )}

                        </Image.PreviewGroup>
                    )}
                </Box>
            </Box>
        </Box>
    );
}