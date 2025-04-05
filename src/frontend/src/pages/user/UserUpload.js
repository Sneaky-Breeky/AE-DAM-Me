import React, { useState, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import { Input, Typography, DatePicker, Button, Form, Select, Tag, Flex, Image, Modal, Slider, message, Result, Spin, Alert } from "antd";
import { PlusOutlined, RotateLeftOutlined, RotateRightOutlined, ExclamationCircleOutlined, CalendarOutlined, DownOutlined, CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import dayjs from 'dayjs';
import { addLog, addLogProject } from "../../api/logApi";
import { API_BASE_URL } from '../../api/apiURL.js';
import { Palette } from '@mui/icons-material';
import { fetchProjectsForUser } from '../../api/projectApi';
import { addMetaAdvanceTag, addMetaBasicTag } from '../../api/fileApi';
import { getProjectMetaDataKeysUpload, getProjectBasicTags } from '../../api/queryFile';
import { useEffect } from "react";
import { useAuth } from '../../contexts/AuthContext';


const { Title } = Typography;
const { confirm } = Modal;
const projectId = 6;

const tagStyle = {
    backgroundColor: '#dbdbdb',
    padding: '5px 10px',
    margin: '3px'
};

export default function UserUpload() {
    const [files, setFiles] = useState([]);
    const [croppedImages, setCroppedImages] = useState([]);
    const [currentFile, setCurrentFile] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [editing, setEditing] = useState(false);
    const MAX_FILES = 100;
    const [taggingMode, setTaggingMode] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [userFiles, setUserFiles] = useState([]);
    const [spinning, setSpinning] = React.useState(false);
    const [percent, setPercent] = React.useState(0);

    const [selectMode, setSelectMode] = useState(false);
    const [selectProject, setSelectProject] = useState(null);
    const [selectProjectMD, setSelectProjectMD] = useState({});
    const [selectProjectTags, setSelectProjectTags] = useState([]);
    const [selectFile, setSelectFile] = useState(null);
    const [selectFileMode, setSelectFileMode] = useState(false);
    const [existingSelectProjectMD, setExistingSelectProjectMD] = useState([]);
    const [existingSelectProjectTags, setExistingSelectProjectTags] = useState([]);
    const [alertSaveFilePalette, setAlertSaveFilePalette] = useState(null);

    const [userProjects, setUserProjects] = useState([]);
    const [project, setProject] = useState(null);
    const [metadataTagsInput, setMetadataTagsInput] = useState();
    const [metadataTags, setMetadataTags] = useState([]);
    const [tagApplications, setTagApplications] = useState([]);
    const [location, setLocation] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const fileInputRef = useRef(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const metadataBoxStyle = {
        textAlign: 'left',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        padding: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '12px',
        width: '100%'
    };

    const { user } = useAuth();


    useEffect(() => {
        const fetchPaletteAndProjects = async () => {
            await getUserPalette();
            if (user?.id) {
                const result = await fetchProjectsForUser(user.id);
                if (!result.error) {
                    setUserProjects(result);
                } else {
                    console.error("Failed to load projects:", result.error);
                }
            }
        };

        fetchPaletteAndProjects();
    }, [user]);



    useEffect(() => {
        const fetchPalette = async () => {
            await getUserPalette();
        };

        fetchPalette();
    }, []);

    async function getUserPalette() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/Files/${user.id}/palette`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            if (data.length) {
                handleProjectChange(data[0].projectId);
                handleDateChange(data[0].dateTimeOriginal);
                setLocation(data[0].location || "");
                setSelectedDate(data[0].dateTimeOriginal.split("T")[0])
            }
            const paletteFiles = data.map((file, index) => (
                {
                    id: file.id,
                    preview: file.thumbnailPath || file.viewPath,
                    original: file.originalPath,
                    metadata: file.bTags.length > 0 ? file.bTags.map(item => item.value) : [],
                    date: file.dateTimeOriginal.split("T")[0],
                    location: file.location || "",
                    projectId: file.projectId,
                    userId: file.userId,
                    file: { name: file.name },
                }));
            paletteFiles.forEach(file => {
                if (file.metadata.length) {
                    setTagApplications(prev => [
                        { tags: [...file.metadata], files: [file] }
                    ]);
                }
            });
            console.log("User Palette Details : ", paletteFiles);
            setFiles((prevFiles) => [...paletteFiles]);
            setUserFiles((prevUserFiles) => [...paletteFiles]);

        } catch (error) {
            console.error('Error:', error);
        }
    }
    async function deleteFile(fileId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/Files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'text/plain'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            console.log("File Deleted : ");

        } catch (error) {
            console.error('Error:', error);
        }
    }

    const handleMetadataTagClose = (removedTag) => {
        const newTags = metadataTags.filter((tag) => tag !== removedTag);
        setMetadataTags(newTags);
    }

    const handleMetadataTagAdd = () => {
        if (metadataTagsInput && !metadataTags.includes(metadataTagsInput)) {
            setMetadataTags([...metadataTags, metadataTagsInput]);
        }
        setMetadataTagsInput("");
    }


    const showDuplicateAlert = (duplicates) => {
        message.warning(`Duplicate files ignored: ${duplicates.join(", ")}`);
    };

    const handleFileChange = async (event) => {
        const selectedFiles = Array.from(event.target.files);
        // Check if any files are selected
        const totalFiles = files.length + selectedFiles.length;

        if (totalFiles > MAX_FILES) {
            message.error(`You can only upload up to ${MAX_FILES} images. You tried adding ${totalFiles}.`);
            return;
        }

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            setSpinning(true);
            // Upload the files to the server
            const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
                method: 'POST',
                body: formData,
            });

            setSpinning(false);

            if (!response.ok) {
                throw new Error('Failed to upload files.');
            }

            const uploadedFileUrls = await response.json();

            console.log("dump", uploadedFileUrls);

            const newFiles = selectedFiles.map((file, index) => ({
                file: { name: getFileName(uploadedFileUrls[index].originalPath) },
                preview: uploadedFileUrls[index].thumbnailPath || URL.createObjectURL(file),
                original: uploadedFileUrls[index].originalPath,
                metadata: [],
                date: selectedDate || null,
                location: location || "",
                projectId: project ? project.id : null,
                userId: user.id
            }));

            setFiles((prevFiles) => [...prevFiles, ...newFiles]);
            setUserFiles((prevUserFiles) => [...prevUserFiles, ...newFiles]);
        } catch (error) {
            console.error(error);
            message.error('An error occurred while uploading files.');
        }
    };
    const getFileName = (url) => {
        return url.split('/').pop().split('?')[0].split('#')[0];
    };
    const handleEditImage = (file) => {
        setCurrentFile(file);
        setEditing(true);
    };

    const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
        const createImage = (url) =>
            new Promise((resolve, reject) => {
                const image = new window.Image();
                image.setAttribute('crossOrigin', 'anonymous');
                image.onload = () => resolve(image);
                image.onerror = (err) => reject(err);
                image.src = url;
            });

        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const safeArea = Math.max(image.width, image.height) * 2;
        canvas.width = safeArea;
        canvas.height = safeArea;

        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-safeArea / 2, -safeArea / 2);
        ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2);

        const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.putImageData(data, 0, 0);

        return canvas.toDataURL('image/jpeg');
    };


    

    const onCropComplete = useCallback((croppedArea, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const saveEditedImage = async () => {
        try {
            const croppedImgUrl = await getCroppedImg(currentFile.preview, croppedAreaPixels, rotation);
            const updatedFile = {
                ...currentFile,
                preview: croppedImgUrl,
                original: croppedImgUrl,
                edited: true
            };
            setFiles(prev => prev.map(f => f.file.name === currentFile.file.name ? updatedFile : f));
            setUserFiles(prev => prev.map(f => f.file.name === currentFile.file.name ? updatedFile : f));
            setEditing(false);
            setCurrentFile(null);
        } catch (error) {
            console.error("Error saving cropped image:", error);
            message.error("Failed to save edited image.");
        }
    };


    const confirmRemoveFile = (file) => {
        if (!file || !file.file) {
            console.error("Invalid file object:", file);
            return;
        }
        confirm({
            title: 'Are you sure you want to remove this image?',
            icon: <ExclamationCircleOutlined />,
            content: 'This action cannot be undone.',
            okText: 'Yes, remove',
            okType: 'danger',
            cancelText: 'No',
            onOk() {
                removeFile(file);
            }
        });

    };

    const removeFile = async (file) => {
        if (file.id) {
            setSpinning(true);
            await deleteFile(file.id);
            setSpinning(false);
        }
        setFiles(prevFiles => {
            const updatedFiles = prevFiles.filter(f => f.file.name !== file.file.name);
            return [...updatedFiles];
        });
        setUserFiles(prevFiles => prevFiles.filter(f => f.file.name !== file.file.name));

    };

    const handleProjectChange = (value) => {
        if (!value) return;

        const selectedProject = userProjects.find(proj => proj.id === value);
        if (!selectedProject) {
            console.warn("Selected project not found");
            return;
        }

        setProject(selectedProject);
        setFiles(prevFiles => prevFiles.map(file => ({
            ...file,
            projectId: selectedProject.id
        })));
    };

    const [currentSelectedExistingMDkey, setCurrentSelectedExistingMDkey] = useState(null);
    const [currentSelectedExistingMDvalue, setCurrentSelectedExistingMDvalue] = useState(null);

    const [currentCreatedMDkey, setCurrentCreatedMDkey] = useState(null);
    const [currentCreatedMDvalue, setCurrentCreatedMDvalue] = useState(null);

    const [currentSelectedExistingTag, setCurrentSelectedExistingTag] = useState(null);

    const [currentCreatedTag, setCurrentCreatedTag] = useState(null);

    const handleApplyFileMD = async () => {
        // TODO: using endpoints, apply md and tags to selected file
        console.log(selectFile.id);
        console.log(selectProjectMD);
        console.log(selectProjectTags);
        console.log("on click submit");
        const body = { Key: "department", Value: "eng", Type: 0 };
        //console.log(body);

        //const result = await addMetaAdvanceTag(31,body);
        const result = await addMetaBasicTag(selectFile.id, "test")
        console.log(result);


        //selectProjectMD.map((md) => {})

        // NOTE: md and tags ONLY applied to selected files, SELECTED PROJECT IS NOT EDITED EVER
        // project is selected ONLY for user to access md and tags of existing files, NOT edit them
        setSelectProjectMD({});
        setSelectProjectTags([]);
        setSelectFile(null);
    }

    // WHEN PROJECT IS SELECTED AND SELECTED FILE MD NEEDS TO BE SET
    const handleSelectProjectChange = async (value) => {
        if (!value) return;

        const proj = userProjects.find(proj => proj.id === value);
        setSelectProject(proj);

        const resultMD = await getProjectMetaDataKeysUpload(value);
        const resultTags = await getProjectBasicTags(value);

        resultMD && setExistingSelectProjectMD(resultMD);
        resultTags && setExistingSelectProjectTags(resultTags);
    };

    const handleSelectExistingMD = () => {
        setSelectProjectMD(prevState => ({
            ...prevState,
            [currentSelectedExistingMDkey]: currentSelectedExistingMDvalue,
        }));
        setCurrentSelectedExistingMDkey(null);
        setCurrentSelectedExistingMDvalue(null);
    };

    const handleCreateMD = () => {
        setSelectProjectMD(prevState => ({
            ...prevState,
            [currentCreatedMDkey]: currentCreatedMDvalue,
        }));
        setCurrentCreatedMDkey(null);
        setCurrentCreatedMDvalue(null);
    };

    const handleRemoveSelectMD = (md) => {
        const updateProjectMD = { ...selectProjectMD };
        delete updateProjectMD[md];
        setSelectProjectMD(updateProjectMD);
    };

    const handleSelectExistingTag = () => {
        setSelectProjectTags([...selectProjectTags, currentSelectedExistingTag]);
        setCurrentSelectedExistingTag(null);
    };

    const handleCreateTag = () => {
        setSelectProjectTags([...selectProjectTags, currentCreatedTag]);
        setCurrentCreatedTag(null);
    };

    const handleRemoveSelectTag = (tag) => {
        const updateTags = selectProjectTags.filter((t) => t !== tag);
        setSelectProjectTags(updateTags);
    };

    const handleToggleTagging = () => {
        setTaggingMode((prev) => !prev);
        setSelectedFiles(new Set());
    };

    const handleToggleSelect = () => {
        setSelectMode((prev) => !prev);
        setTaggingMode(false);
        setSelectFileMode(false);
        setSelectFile(null);
        setSelectedFiles(new Set());
    };

    const handleToggleSelectFile = () => {
        setSelectFileMode((prev) => !prev);
        setSelectMode(false);
        setTaggingMode(false);
        setSelectFile(null);
        setSelectedFiles(new Set());
    };


    const toggleFileSelection = (fileObj) => {

        const fileName = fileObj.file.name;
        const updatedSelection = new Set(selectedFiles);

        if (updatedSelection.has(fileName)) {
            updatedSelection.delete(fileName);
        } else {
            updatedSelection.add(fileName);
        }

        setSelectedFiles(updatedSelection);
    };

    const toggleSelectFile = (fileObj) => {

        const fileName = fileObj;

        if (selectFile === fileName) {
            setSelectFile(null);
        } else if (!fileObj.id) {
            setAlertSaveFilePalette(fileObj);
            setSelectFile(null);
        } else {
            setSelectFile(fileName);
            setAlertSaveFilePalette(null);
        }
        // console.log(fileName);
        // console.log(fileObj.file.id);
        // TODO: set this shit up
        //setSelectProjectMD(fileName.metadata);
        //setSelectProjectTags(fileName.tags);
    };

    const handleTagAllFiles = () => {
        setTaggingMode(true);
        const allFiles = new Set(files.map(({ file }) => file.name));
        setSelectedFiles(allFiles);
    };

    const handleSelectAll = () => {
        setSelectMode(true)
        const allFiles = new Set(files.map(({ file }) => file.name));
        setSelectedFiles(allFiles);
    };

    const handleSubmitTagInfo = () => {
        if (selectedFiles.size === 0 || metadataTags.length === 0) return;

        setFiles(prevFiles =>
            prevFiles.map(fileObj => {
                if (selectedFiles.has(fileObj.file.name)) {
                    return {
                        ...fileObj,
                        metadata: [...new Set([...fileObj.metadata, ...metadataTags])]
                    };
                }
                return fileObj;
            })
        );

        setTagApplications(prev => [
            ...prev,
            { tags: [...metadataTags], files: [...selectedFiles] }
        ]);

        setSelectedFiles(new Set());
        setMetadataTags([]);
        setTaggingMode(false);
    };

    const removeTagApplication = (index) => {
        const { tags, files } = tagApplications[index];

        setFiles(prevFiles =>
            prevFiles.map(fileObj => {
                if (files.includes(fileObj.file.name)) {
                    return {
                        ...fileObj,
                        metadata: fileObj.metadata.filter(tag => !tags.includes(tag))
                    };
                }
                return fileObj;
            })
        );

        setTagApplications(prev => prev.filter((_, i) => i !== index));
    };

    const handleDateChange = (date, dateString) => {
        if (!dateString) return;
        setSelectedDate(dateString);
        setFiles(prevFiles => prevFiles.map(file => ({ ...file, date: dateString })));
    };

    const handleLocationChange = (event) => {
        const newLocation = event.target.value;
        setLocation(newLocation);
        setFiles(prevFiles => prevFiles.map(file => ({ ...file, location: newLocation })));
    };
    const handleUploadFilesToPalette = async () => {
        console.log("Uploading files to palette:", files);
        setSpinning(true);
        const filesToSave = files.map(({ file, ...rest }) => ({
            ...rest,
            filePath: rest.original,
            palette: true
        }));
        await saveFiles(filesToSave);
        await getUserPalette();
        setSpinning(false);
    }
    const saveFiles = async (filesToSave) => {
        try {
            // Upload the files to the server
            const response = await fetch(`${API_BASE_URL}/api/files`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(filesToSave),
            });

            if (!response.ok) {
                throw new Error('Failed to upload files.');
            }

            // Assuming the API returns an array of URLs corresponding to the uploaded files
            const uploadedFileUrls = await response.json();
        } catch (error) {
            console.error('Error:', error);
        }
    }
    const handleUploadFilesToProject = async () => {
        // TODO: add "files" to current "project"'s "files" variable, and other associated info
        // TODO: update user's activity log that they added files to this certain project
        console.log("Uploading files:", files);

        console.log("Uploading files:", files);
        setSpinning(true);
        const filesToSave = files.map(({ file, ...rest }) => ({
            ...rest,
            filePath: rest.original,
            palette: false
        }));

        await saveFiles(filesToSave);
        for (const file of userFiles) {
            await addLog(user.id, file.id, projectId, 'uploading file to project');
        }
        setSpinning(false);



        setFiles([]);
        setUserFiles([]);
        setTagApplications([]);
        setProject(null);
        setMetadataTags([]);
        setSelectedDate(dayjs().format('YYYY-MM-DD'));
        setLocation(null);
        setUploadSuccess(true);
        // addLogProject(user.id, 3, 'upload');

    };

    const resetUploadState = () => {
        setUploadSuccess(false);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', padding: '20px', gap: '20px', paddingBottom: '40px' }}>
            {/* Left section (image uploading)*/}
            <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px' }}>
                <Box sx={{
                    textAlign: 'center',
                    padding: 4,
                    backgroundColor: '#f5f5f5',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}>
                    <h2>Upload & Edit Files</h2>
                    <p style={{ color: files.length >= MAX_FILES ? 'red' : 'black' }}>
                        {files.length}/{MAX_FILES} images uploaded
                    </p>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <Button icon={<PlusOutlined />} type="primary" color="cyan" variant="solid" onClick={() => fileInputRef.current.click()} disabled={files.length >= MAX_FILES}>
                        Add Files
                    </Button>
                    <p style={{ color: 'grey', marginBottom: '0', fontSize: '80%' }}>Accepting PNG, JPG, JPEG, RAW, MP4, ARW</p>
                </Box>

                {/* Image preview & edit options */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: 2, paddingBottom: '0', gap: '10px' }}>
                    <Button disabled={files.length === 0} danger={selectMode} type="primary" variant="solid" onClick={handleToggleSelect}>
                        {selectMode ? "Close" : "Select"}
                    </Button>
                    <Button disabled={files.length === 0} variant="filled" onClick={handleSelectAll}>
                        Select All
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: 4 }}>

                    {files.map(({ file, preview, original }, index) => (
                        <div key={index} style={{ position: 'relative', width: '150px' }}>
                            {selectMode ?
                                <div
                                key={file.Id}
                                style={{ position: 'relative', cursor: 'pointer' }}
                                onClick={() => toggleFileSelection(files[index])}
                                >
                                    <Image
                                        src={preview}
                                        width={150}
                                        preview={false}
                                        style={{
                                            border: selectedFiles.has(files[index].file.name) ? '4px solid blue' : 'none',
                                            borderRadius: '8px',
                                            transition: '0.2s ease-in-out',
                                        }}
                                    />
                                </div>

                                : selectFileMode ?
                                    <div
                                        key={file.Id}
                                        style={{ position: 'relative', cursor: 'pointer' }}
                                        onClick={() => toggleSelectFile(files[index])}
                                    >
                                        {alertSaveFilePalette === files[index] && <Alert showIcon message="Save to Palette First!" type="error" />}
                                        <Image
                                            src={preview}
                                            width={150}
                                            preview={false}
                                            style={{
                                                border: selectFile && selectFile.file.name === (files[index].file.name) ? '4px solid cyan'
                                                    : alertSaveFilePalette === files[index] ? '4px solid red'
                                                        : 'none',
                                                borderRadius: '8px',
                                                transition: '0.2s ease-in-out',
                                            }}
                                        />
                                    </div>
                                    : <Image src={preview} width={150} preview={false} />
                            }

                            {taggingMode && (
                                <div
                                    onClick={() => toggleFileSelection(files[index])}
                                    style={{
                                        position: 'absolute',
                                        top: '5px',
                                        right: '5px',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: 'black',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {selectedFiles.has(files[index].file.name) && '✔️'}
                                </div>
                            )}

                            <Button size="small" onClick={() => handleEditImage({ file, preview: original })}>Edit</Button>
                            <Button danger size="small" onClick={() => {
                                confirmRemoveFile(files[index]);
                            }}>
                                Remove
                            </Button>

                        </div>
                    ))}
                </Box>

                {/* Image editor popup */}
                <Modal
                    open={editing}
                    onCancel={() => setEditing(false)}
                    onOk={saveEditedImage}
                    okText="Save Changes"
                    title="Edit Image"
                    width={600}
                >
                    {currentFile && (
                        <div style={{ width: '100%', height: 400, position: 'relative' }}>
                            <Cropper
                                image={currentFile.preview}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                onCropComplete={onCropComplete}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                                <Button icon={<RotateLeftOutlined />} onClick={() => setRotation(rotation - 90)} />
                                <Button icon={<RotateRightOutlined />} onClick={() => setRotation(rotation + 90)} />
                                <Slider min={1} max={3} step={0.1} value={zoom} onChange={setZoom} />
                            </Box>
                        </div>
                    )}
                </Modal>

                {/* Upload button w success popup*/}
                <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
                    {uploadSuccess ? (
                        <Result
                            status="success"
                            title="Files Successfully Uploaded!"
                            subTitle={"Your files have been added!"}
                            extra={[
                                <Button key="uploadAgain" onClick={resetUploadState}>
                                    Return
                                </Button>,
                            ]}
                        />
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Button style={{ margin: '10px' }} type="primary" color="cyan" variant="solid" onClick={handleUploadFilesToProject} disabled={selectedFiles.size === 0 || project === null}>
                                Upload Files to Project
                            </Button>
                            <Button style={{ margin: '10px' }} type="secondary" color="green" variant="solid" disabled={files.length == 0} onClick={handleUploadFilesToPalette}>
                                Save To Palette
                            </Button>
                        </div>
                    )}
                </Box>

            </Box>

            {/* Right section (metadata) */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', padding: '30px' }}>
                <Box sx={metadataBoxStyle}>
                    <Title level={5}>Project Name:</Title>
                    <Select
                        showSearch
                        placeholder="Enter project number"
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={userProjects.map(proj => ({
                            value: proj.id,
                            label: `${proj.id}: ${proj.name}`
                        }))}
                        onChange={handleProjectChange}
                        style={{ width: '100%' }}
                        value={project ? project.id : undefined}
                    />
                </Box>

                <Box sx={metadataBoxStyle}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Button type="primary" color="cyan" variant={selectFileMode ? "solid" : "filled"} onClick={handleToggleSelectFile} disabled={files.length === 0}>
                            {selectFileMode ? "Selecting" : "Select File"}
                        </Button>
                        <Button type="primary" color="cyan" variant="solid" onClick={handleApplyFileMD} disabled={selectFile === null}>
                            Submit File Metadata
                        </Button>
                    </Box>
                    <Title level={5}>Project File Metadata: </Title>
                    <Select
                        showSearch
                        placeholder={selectFile === null ? "Select File First" : "Select Project"}
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={userProjects.map(proj => ({
                            value: proj.id,
                            label: `${proj.id}: ${proj.name}`
                        }))}
                        onChange={handleSelectProjectChange}
                        style={{ width: '100%', marginBottom: '5%' }}
                        disabled={selectFile === null}
                        value={selectProject !== null ? selectProject.id : undefined}
                    />

                    <table style={{ width: '100%', borderCollapse: 'collapse', borderBottomWidth: 'thin', borderBottomStyle: 'solid', borderColor: 'LightGray', paddingBottom: '5%' }}>
                        <thead>
                            <tr style={{ height: '10%' }}>
                                <th colSpan={2} style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}>
                                    <span style={{ fontSize: '100%' }}>Metadata</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody style={{ borderBottomWidth: 'thin', borderBottomStyle: 'solid', borderColor: 'LightGray', padding: '20%' }}>
                            {Object.entries(selectProjectMD).map((metadata, index) => (
                                <tr key={index}>
                                    <td style={{ width: '15%', textAlign: 'left' }}>
                                        <Button type='text' size='small' icon={<CloseOutlined />}
                                            onClick={() => handleRemoveSelectMD(metadata[0])} />
                                    </td>
                                    <td style={{ width: '85%', textAlign: 'left' }}>
                                        <span style={{ fontSize: '90%' }}>{metadata[0]}</span> : <span style={{ fontSize: '90%', color: 'grey', fontStyle: 'italic' }}>{metadata[1]}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ borderBottomWidth: 'thin', borderBottomStyle: 'solid', borderColor: 'LightGray', paddingBottom: '5%' }}>
                        <p style={{ width: '100%', textAlign: 'left', fontWeight: '550', fontSize: '90%' }}>Add Metadata from Project</p>
                        <div><span style={{ fontSize: '90%' }}>Key: </span>
                            <Select
                                showSearch
                                placeholder="pick existing metadata key"
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={existingSelectProjectMD.map(md => ({
                                    value: md,
                                    disabled: Object.keys(selectProjectMD).includes(md),
                                    label: `${md}`
                                }))}
                                onChange={setCurrentSelectedExistingMDkey}
                                style={{ width: '80%', marginBottom: '5%', overflow: 'atuo' }}
                                disabled={selectProject === null}
                                value={currentSelectedExistingMDkey !== null ? currentSelectedExistingMDkey : undefined}
                            />
                        </div>
                        <div><span style={{ fontSize: '90%' }}>Value: </span>
                            <Input
                                onChange={e => setCurrentSelectedExistingMDvalue(e.target.value)}
                                style={{ width: '80%', marginBottom: '5%', overflow: 'atuo' }}
                                placeholder="apply metadata value"
                                disabled={selectProject === null}
                                value={currentSelectedExistingMDvalue !== null ? currentSelectedExistingMDvalue : undefined} />
                        </div>
                        <Button icon={<PlusOutlined />} color="cyan" variant="solid" onClick={handleSelectExistingMD}
                            disabled={selectProject === null || currentSelectedExistingMDkey === null || currentSelectedExistingMDvalue === null} >
                            Add Metadata
                        </Button>
                    </div>

                    <div style={{ paddingBottom: '5%' }}>
                        <p style={{ width: '100%', textAlign: 'left', fontWeight: '550', fontSize: '90%' }}>Create Metadata</p>
                        <div><span style={{ fontSize: '90%' }}>Key: </span>
                            <Input
                                onChange={e => setCurrentCreatedMDkey(e.target.value)}
                                style={{ width: '80%', marginBottom: '5%', overflow: 'atuo' }}
                                placeholder="set metadata key"
                                disabled={selectProject === null}
                                value={currentCreatedMDkey !== null ? currentCreatedMDkey : undefined} />
                        </div>
                        <div><span style={{ fontSize: '90%' }}>Value: </span>
                            <Input
                                onChange={e => setCurrentCreatedMDvalue(e.target.value)}
                                style={{ width: '80%', marginBottom: '5%', overflow: 'atuo' }}
                                placeholder="set metadata value"
                                disabled={selectProject === null}
                                value={currentCreatedMDvalue !== null ? currentCreatedMDvalue : undefined} />
                        </div>
                        <Button icon={<PlusOutlined />} color="cyan" variant="solid" onClick={handleCreateMD}
                            disabled={selectProject === null || currentCreatedMDkey === null || currentCreatedMDvalue === null ||
                                Object.keys(selectProjectMD).includes(currentCreatedMDkey) || existingSelectProjectMD.includes(currentCreatedMDkey)} >
                            Create Metadata
                        </Button>
                    </div>

                    <table style={{
                        width: '100%', borderCollapse: 'collapse',
                        borderTopWidth: 'thin', borderTopStyle: 'solid', borderTopColor: 'black',
                        borderBottomWidth: 'thin', borderBottomStyle: 'solid', borderBottomColor: 'LightGray', paddingBottom: '5%'
                    }}>
                        <thead>
                            <tr style={{ height: '10%' }}>
                                <th style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}>
                                    <span style={{ fontSize: '100%' }}>Tags</span>
                                </th>
                            </tr>
                        </thead>

                        <tbody style={{ borderBottomWidth: 'thin', borderBottomStyle: 'solid', borderColor: 'LightGray', padding: '20%' }}>
                            <tr>
                                <td>
                                    <Flex wrap="wrap" style={{ marginTop: '10px' }}>
                                        {selectProjectTags.map((tag) => (
                                            <Tag
                                                style={tagStyle}
                                                key={tag}
                                                closable={true}
                                                onClose={() => handleRemoveSelectTag(tag)}
                                            >
                                                {tag}
                                            </Tag>
                                        ))}
                                    </Flex>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div style={{ borderBottomWidth: 'thin', borderBottomStyle: 'solid', borderColor: 'LightGray', paddingBottom: '5%' }}>
                        <p style={{ width: '100%', textAlign: 'left', fontWeight: '550', fontSize: '90%' }}>Add Tags from Project</p>
                        <div><span style={{ fontSize: '90%' }}>Tag: </span>
                            <Select
                                showSearch
                                placeholder="pick existing tag"
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={existingSelectProjectTags.map(tag => ({
                                    value: tag,
                                    disabled: selectProjectTags.includes(tag),
                                    label: `${tag}`
                                }))}
                                onChange={setCurrentSelectedExistingTag}
                                style={{ width: '80%', marginBottom: '5%', overflow: 'atuo' }}
                                disabled={selectProject === null}
                                value={currentSelectedExistingTag !== null ? currentSelectedExistingTag : undefined}
                            />
                        </div>
                        <Button icon={<PlusOutlined />} color="cyan" variant="solid" onClick={handleSelectExistingTag}
                            disabled={selectProject === null || currentSelectedExistingTag === null} >
                            Add Tag
                        </Button>
                    </div>

                    <div style={{ paddingBottom: '5%' }}>
                        <p style={{ width: '100%', textAlign: 'left', fontWeight: '550', fontSize: '90%' }}>Create Tags</p>
                        <div><span style={{ fontSize: '90%' }}>Tag: </span>
                            <Input
                                onChange={e => setCurrentCreatedTag(e.target.value)}
                                style={{ width: '80%', marginBottom: '5%', overflow: 'atuo' }}
                                placeholder="input tag"
                                disabled={selectProject === null}
                                value={currentCreatedTag !== null ? currentCreatedTag : undefined} />
                        </div>
                        <Button icon={<PlusOutlined />} color="cyan" variant="solid" onClick={handleCreateTag}
                            disabled={selectProject === null || currentCreatedTag === null ||
                                selectProjectTags.includes(currentCreatedTag) || existingSelectProjectTags.includes(currentCreatedTag)} >
                            Create Tag
                        </Button>
                    </div>
                </Box>

                {/*
                <Box sx={metadataBoxStyle}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Button type="primary" color="cyan" variant="solid" onClick={handleToggleTagging} disabled={files.length === 0}>
                            {taggingMode ? "Cancel Tagging" : "Tag Files"}
                        </Button>
                        <Button type="primary" color="cyan" variant="solid" onClick={handleTagAllFiles} disabled={files.length === 0}>
                            Tag All
                        </Button>
                    </Box>
                    <Title level={5}>Add Metadata:</Title>
                    <Input
                        placeholder="Select files first"
                        value={metadataTagsInput}
                        onChange={(e) => setMetadataTagsInput(e.target.value)}
                        onPressEnter={handleMetadataTagAdd}
                        disabled={selectedFiles.size === 0}
                    />
                    <Flex wrap="wrap" style={{ marginTop: '10px' }}>
                        {metadataTags.map((tag) => (
                            <Tag
                                style={tagStyle}
                                key={tag}
                                closable={true}
                                onClose={() => handleMetadataTagClose(tag)}
                            >
                                {tag}
                            </Tag>
                        ))
                        }
                    </Flex>
                    <Box sx={{ marginTop: '15px' }}>
                        <Button type="primary" color="cyan" variant="solid" onClick={handleSubmitTagInfo} disabled={selectedFiles.size === 0 || metadataTags.length === 0 || files.length === 0}>
                            Submit Tag Info
                        </Button>
                    </Box>
                    <Box sx={{ marginTop: "20px" }}>
                        {tagApplications.map(({ tags, files }, index) => (
                            <Box key={index} sx={{ backgroundColor: "#eef", padding: "10px", marginTop: "10px", borderRadius: "8px" }}>
                                <Flex justify="space-between">
                                    <div>
                                        <strong>Tags:</strong> {tags.join(", ")} <br />
                                        <strong>Files:</strong> {files.length} {files.length === 1 ? "file" : "files"}

                                    </div>
                                    <Button type="text" icon={<CloseOutlined />} danger onClick={() => removeTagApplication(index)}>
                                        Undo
                                    </Button>
                                </Flex>
                            </Box>
                        ))}
                    </Box>
                </Box> 
                */}

                <Box sx={metadataBoxStyle}>
                    <Title level={5}>Adjust Resolution:</Title>
                    <Select
                        placeholder="Select resolution"
                        style={{ width: '100%' }}
                        options={[
                            { value: 'low', label: 'Low' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High' }
                        ]}
                        suffixIcon={<DownOutlined />}
                    />
                </Box>

                <Box sx={metadataBoxStyle}>
                    <Title level={5}>Add Date:</Title>
                    <DatePicker
                        placeholder="Select date"
                        maxDate={dayjs()}
                        onChange={handleDateChange}
                        suffixIcon={<CalendarOutlined />}
                        style={{ width: '100%' }}
                        value={selectedDate ? dayjs(selectedDate) : null}
                    />
                </Box>

                <Box sx={metadataBoxStyle}>
                    <Title level={5}>Location:</Title>
                    <Input
                        value={location}
                        onChange={handleLocationChange}
                        placeholder="Enter location"
                    />
                </Box>
            </Box>
            <Spin spinning={spinning} fullscreen tip="Please Wait..." size="large" />
        </Box>

    );
}