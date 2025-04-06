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
    QuestionCircleOutlined,
    CheckCircleOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import {fetchProject, getFilesForProject, fetchTagsForProject} from '../../api/projectApi';
import {deleteFiles, deleteFilesDB, downloadFilesZip} from '../../api/fileApi';
import dayjs from 'dayjs';
import {getProjectBasicTags, getProjectMetaDataTags, searchProjectFiles} from "../../api/queryFile";
import {
    getProjectImageBasicTags,
    getProjectImageMetaDataTags,
    getProjectImageMetaDataValuesTags
} from "../../api/imageApi";
import { useAuth } from '../../contexts/AuthContext';

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Meta } = Card;

export default function UserProjectOverview() {
    // Get user info and define admin flag
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Project variables
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [projectMetaTags, setProjectMetaTags] = useState([]);

    // Project's files' metadata variables
    const [allFileMetaTags, setAllFileMetaTags] = useState([]);
    const [selectedFileMDKey, setSelectedFileMDKey] = useState([]);
    const [fileMDValue, setFileMDValue] = useState([]);
    const [selectedOperator, setSelectedOperator] = useState(null);
    const [operatorDisabled, setOperatorDisabled] = useState(false);

    // Project's files' tags
    const [allFileTags, setAllFileTags] = useState([]);
    const [selectedFileTag, setSelectedFileTag] = useState([]);

    // Image variables
    const [imageList, setImageList] = useState([]);
    const [selectedImages, setSelectedImages] = useState(new Set());

    // Other variables
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [current, setCurrent] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProjectAndFiles() {
            try {
                const projectData = await fetchProject(id);
                const projectFilesMetadataData = await getProjectMetaDataTags(id);
                const projectFilesTagsData = await getProjectBasicTags(id);
                const projectMetadata = await fetchTagsForProject(id);
                setProjectMetaTags(projectMetadata || []);

                setAllFileMetaTags(Array.isArray(projectFilesMetadataData) ? projectFilesMetadataData : []);
                setAllFileTags(Array.isArray(projectFilesTagsData) ? projectFilesTagsData : []);

                if (!projectData) {
                    console.warn("No project found");
                    setProject({});
                    return;
                }

                const files = await getFilesForProject({ projectId: id });

                const filesWithTags = await Promise.all(
                    files.map(async (file) => {
                        const basicTags = await getProjectImageBasicTags({ pid: id, fid: file.id });
                        const metadataValues = await getProjectImageMetaDataValuesTags({ pid: id, fid: file.id });

                        return {
                            ...file,
                            basicTags: basicTags || [],
                            metadataValues: metadataValues || [],
                        };
                    })
                );

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
            if (Array.isArray(val)) return val.length > 0;
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
            const filesWithTags = await Promise.all(
                files.map(async (file) => {
                    const basicTags = await getProjectImageBasicTags({ pid: id, fid: file.id });
                    const metadataTags = await getProjectImageMetaDataTags({ pid: id, fid: file.id });

                    return {
                        ...file,
                        basicTags: basicTags || [],
                        metadataTags: metadataTags || [],
                    };
                })
            );

            setImageList(filesWithTags);
        } catch (err) {
            console.error("Failed to reload project files:", err);
            setImageList([]);
        }
    };

    const onDownload = () => {
        const url = imageList[current].originalPath;
        const suffix = url.slice(url.lastIndexOf('.'));
        const filename = Date.now() + suffix;
        downloadFile(url, filename);
    };

    const downloadFile = (url, filename) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const toggleEditMode = () => {
        setIsEditMode((prev) => !prev);
        setSelectedImages(new Set());
    };

    const toggleSelectImage = (file) => {
        if (!isEditMode) return;
        addFile(file.id);
    };

    const addFile = (fileId) => {
        setSelectedImages((prevSelected) => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(fileId)) {
                newSelected.delete(fileId);
            } else {
                newSelected.add(fileId);
            }
            return newSelected;
        });
    };

    const downloadSelectedImages = async () => {
        const filesToBeDownloaded = imageList.filter((file) => selectedImages.has(file.id));
        console.log(filesToBeDownloaded);
        const filesNameList = filesToBeDownloaded.map(file => file.name);
        setLoading(true);
        await downloadFilesZip(filesNameList);
        setLoading(false);
        setSelectedImages(new Set());
        setIsEditMode(false);
    };

    // New: Delete selected images (only for admin)
    const handleDeleteSelectedImages = async () => {
        // Get the selected images from the imageList
        const filesToBeDeleted = imageList.filter(file => selectedImages.has(file.id));
        // Extract the file names for deletion from blob storage
        const filesNameList = filesToBeDeleted.map(file => file.name);
        // Extract the file IDs for deletion from your database
        const filesIdList = filesToBeDeleted.map(file => file.id);
        setLoading(true);
        // Communicate  backend to delete the files from blob storage
        // Assume deleteFiles is your backend method that accepts an array of filenames
        await deleteFiles(filesNameList);
        // Then communicate backend to delete the file entries from your database
        // Assume deleteFilesDB is your backend method that accepts an array of file IDs
        await deleteFilesDB(filesIdList);
        // Update the local state: remove deleted images from imageList
        const remainingImages = imageList.filter(file => !selectedImages.has(file.id));
        setImageList(remainingImages);

        setLoading(false);
        setSelectedImages(new Set());
        setIsEditMode(false);
        message.success("Selected images deleted successfully!");
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

            {/* Search section */}
            <Box
                sx={{
                    flexGrow: 1,
                    padding: 1,
                    width: '70%',
                    minWidth: '300px',
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
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '10px',
                    }}
                >
                    <Box
                        display="flex"
                        flexWrap="wrap"
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
                        flexDirection="row"
                        flexWrap="wrap"
                        alignItems="center"
                        gap={2}
                        mb={2}
                        justifyContent="center"
                        width="100%"
                    >
                        <span style={{ fontWeight: 'bold', fontSize: '20px' }}>Filter Metadata:</span>
                        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-evenly'}}>
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
                                style={{ width: '100%', marginBottom: '5%' }}
                                value={selectedFileMDKey !== null ? selectedFileMDKey : undefined}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Select
                                placeholder="?"
                                style={{ width: '100%', marginBottom: '5%', overflow: 'auto' }}
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
                                style={{ width: '100%', marginBottom: '5%', overflow: 'auto' }}
                                placeholder="Metadata value"
                                value={fileMDValue}
                            />
                        </Form.Item>
                        </div>
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
                                style={{ width: '100%', marginBottom: '5%', overflow: 'auto' }}
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
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        width: '70%',
                        minWidth: '300px',
                        margin: '20px auto',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '10px',
                        padding: '20px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: '10px' }}>
                        <div><strong>Location: </strong><span>{project.location}</span></div>
                        <div><strong>Start Date: </strong><span>{dayjs(project.startDate).format('MMM DD, YYYY')}</span></div>
                        <div><strong>State: </strong><span>{project.status}</span></div>
                        <div><strong>Phase: </strong><span>{project.phase}</span></div>
                    </div>
                    <div style={{ margin: '20px auto', marginBottom: '0', width: '100%', display: 'flex', alignItems: 'center' }}>
                        <strong style={{ marginRight: '10px' }}>Metadata:</strong>
                        {projectMetaTags.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                                {projectMetaTags.map((tag, idx) => (
                                    <span key={idx} style={{ fontSize: '16px' }}>
                    <span style={{ fontWeight: '500' }}>{tag.key}</span>: <span style={{ color: 'grey', fontStyle: 'italic' }}>{tag.sValue || tag.iValue}</span>
                  </span>
                                ))}
                            </div>
                        ) : (
                            <span style={{ color: 'grey', fontStyle: 'italic' }}>No metadata</span>
                        )}
                    </div>
                </Box>

                {/* Download and Admin-only Delete Images */}
                <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'left', margin: '20px auto', gap: '10px', width: '70%' }}>
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
                    {/* Admin-only Delete button */}
                    {isEditMode && selectedImages.size > 0 && isAdmin && (
                        <Popconfirm
                            title="Delete Images"
                            description="Are you sure you want to delete the selected images?"
                            onConfirm={handleDeleteSelectedImages}
                            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button danger icon={<DeleteOutlined />}>
                                Delete
                            </Button>
                        </Popconfirm>
                    )}
                </Box>

                {/* Image gallery */}
                <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
                    {isEditMode ? (
                        <Space wrap size={16} style={{ justifyContent: 'center' }}>
                            {imageList.map((file) => (
                                <div
                                    key={file.Id}
                                    style={{ position: 'relative', cursor: 'pointer' }}
                                >
                                    <Image
                                        key={file.id}
                                        src={file.thumbnailPath || file.viewPath || file.originalPath}
                                        width={200}
                                        preview={false}
                                        style={{
                                            borderRadius: '8px',
                                            transition: '0.2s ease-in-out',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    {!selectedImages.has(file.id) ? (
                                        <DownloadOutlined
                                            onClick={() => toggleSelectImage(file)}
                                            style={{
                                                position: 'absolute',
                                                top: 5,
                                                right: 5,
                                                color: 'white',
                                                background: 'red',
                                                borderRadius: '50%',
                                                padding: '5px',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                            }}
                                        />
                                    ) : (
                                        <CheckCircleOutlined
                                            onClick={() => toggleSelectImage(file)}
                                            style={{
                                                position: 'absolute',
                                                top: 5,
                                                right: 5,
                                                color: 'white',
                                                background: 'green',
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
                                            key={file.id}
                                            title={
                                                <>
                                                    <div><strong>Basic Tags:</strong> {file.basicTags?.join(', ') || 'None'}</div>
                                                    <div><strong>Metadata Tags:</strong>
                                                        {file.metadataValues?.length > 0
                                                            ? file.metadataValues.map((tag, i) => (
                                                                <div key={i} style={{ marginLeft: '8px' }}>
                                                                    <span style={{ color: '#888' }}>{tag.key}: </span>
                                                                    <span>{tag.sValue || tag.iValue}</span>
                                                                </div>
                                                            ))
                                                            : <span style={{ marginLeft: '8px' }}>None</span>
                                                        }
                                                    </div>
                                                </>
                                            }
                                        >
                                            <Image
                                                src={file.thumbnailPath || file.originalPath || file.viewPath}
                                                width={200}
                                                preview={true}
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
