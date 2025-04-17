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
import { addMetaAdvanceTag, addMetaBasicTag, assignSuggestedProjectToFile, uploadFilesToProject, removeBasicTag, removeAdvancedTag } from '../../api/fileApi';
import {
    getProjectMetaDataKeysUpload,
    getProjectBasicTags,
    getProjectMetaDataKeysFilesUpload
} from '../../api/queryFile';
import {
    getProjectImageBasicTags,
    getProjectImageMetaDataValuesTags
} from "../../api/imageApi";
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
    const [currentIndex, setCurrentIndex] = useState(-1);
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
    const [existingFileMetadata, setExistingFileMetadata] = useState([]);
    const [existingFileTags, setExistingFileTags] = useState([]);
    const [tagApplications, setTagApplications] = useState([]);
    const [location, setLocation] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const fileInputRef = useRef(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [selectedResolution, setSelectedResolution] = useState(null);
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
                setSelectedDate(data[0].dateTimeOriginal.split("T")[0]);
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
                    aperture : file.aperture,
                    copyright : file.copyright,
                    focalLength : file.focalLength,
                    gpsAlt : file.gpsAlt,
                    gpsLat : file.gpsLat,
                    gpsLon : file.gpsLon,
                    make : file.make,
                    model : file.model,
                    pixelHeight : file.pixelHeight,
                    pixelWidth: file.pixelWidth,
                    thumbnailPath : file.thumbnailPath
                }));

            paletteFiles.forEach(file => {
                if (file.metadata.length) {
                    setTagApplications(prev => [
                        { tags: [...file.metadata], files: [file] }
                    ]);
                }
            });

            console.log("User Palette Details : ", paletteFiles);

            // Update userFiles but don't clear the current view
            setFiles((prevFiles) => [...paletteFiles]);

            setUserFiles((prevUserFiles) => [...paletteFiles]);

        } catch (error) {
            console.error('Error:', error);
        }
    }

    useEffect(() => {
        const fetchFileMetaAndTags = async () => {
            if (!selectFile) return;

            if (selectFile.projectId && !selectProject) {
                const matchedProject = userProjects.find(p => p.id === selectFile.projectId);
                if (matchedProject) {
                    setSelectProject(matchedProject);

                    const projectMD = await getProjectMetaDataKeysUpload(matchedProject.id);
                    const fileMD = await getProjectMetaDataKeysFilesUpload(matchedProject.id);
                    var resultMD = projectMD;
                    if(fileMD !== null){
                        resultMD = projectMD.concat(fileMD);
                    }
                    console.log(resultMD);

                    const resultTags = await getProjectBasicTags(matchedProject.id);

                    setExistingSelectProjectMD(resultMD || []);
                    setExistingSelectProjectTags(resultTags || []);
                }
            }
            // console.log(selectProjectMD);
            const metaRes = await getProjectImageMetaDataValuesTags({ pid: selectFile.projectId, fid: selectFile.id });
            const tagRes = await getProjectImageBasicTags({ pid: selectFile.projectId, fid: selectFile.id });

            console.log("file metadata: ", metaRes);
            console.log("file tags: ", tagRes);
            setExistingFileMetadata(metaRes || []);
            setExistingFileTags(tagRes || []);
        };

        fetchFileMetaAndTags();
    }, [selectFile]);

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

            if (response.status === 204) {
                console.log("File deleted with no content returned.");
            } else {
                const data = await response.json();
                console.log("File Deleted:", data);
            }

            console.log("File Deleted : ");

        } catch (error) {
            console.error('Error:', error);
        }
    }

    const handleRemoveExistingTag = async (tag) => {
        console.log("tag value: ", tag);
        if (!selectFile || !tag) return;

        console.log("tag value: ", tag);
        try {
            await removeBasicTag(selectFile.id, tag);
            message.success("Tag removed");

            const tags = await getProjectImageBasicTags({ pid: selectFile.projectId, fid: selectFile.id });
            setExistingFileTags(tags || []);
        } catch (err) {
            console.error("Failed to remove basic tag:", err);
            message.error("Failed to remove tag");
        }
    };


    const handleRemoveExistingMetadata = async (key) => {
        console.log("key: ", key);
        if (!selectFile?.id) return;

        const res = await removeAdvancedTag(selectFile.id, key);
        if (res?.error) {
            message.error(`Failed to delete metadata key: ${key}`);
        } else {
            message.success(`Metadata "${key}" removed`);
            setExistingFileMetadata(prev => prev.filter(item => item.key !== key));
        }
    };

    
    
    
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

        // console.log("dump formData", formData);

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

            const uploadedFiles = await response.json();

            console.log("dump", uploadedFiles);

            const newFiles = selectedFiles.map((file, index) => {
                return {
                    file: { name: getFileName(uploadedFiles[index].originalPath) },
                    preview: uploadedFiles[index].thumbnailPath || URL.createObjectURL(file),
                    original: uploadedFiles[index].originalPath,
                    metadata: [],
                    date: selectedDate || null,
                    location: location || "",
                    projectId: project ? project.id : null,
                    userId: user.id,
                    aperture : uploadedFiles[index].aperture,
                    copyright : uploadedFiles[index].copyright,
                    focalLength : uploadedFiles[index].focalLength,
                    gpsAlt : uploadedFiles[index].gpsAlt,
                    gpsLat : uploadedFiles[index].gpsLat,
                    gpsLon : uploadedFiles[index].gpsLon,
                    make : uploadedFiles[index].make,
                    model : uploadedFiles[index].model,
                    pixelHeight : uploadedFiles[index].pixelHeight,
                    pixelWidth: uploadedFiles[index].pixelWidth,
                    thumbnailPath : uploadedFiles[index].thumbnailPath,
                    viewPath : uploadedFiles[index].viewPath
                }
            });
            console.log(newFiles);

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
    const handleEditImage = (file, index) => {
        setCurrentFile(file);
        setCurrentIndex(index);
        setRotation(0);
        setEditing(true);
    };

    const getCroppedImg = async (imageSrc, crop, rotation = 0) => {
        console.log("dump imageSrc", imageSrc);
        const createImage = (url) =>
            new Promise((resolve, reject) => {
                const image = new window.Image();
                image.setAttribute('crossOrigin', 'anonymous'); // Prevent CORS issues
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.originalurl = imageSrc;
                image.src = url;
            });

        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const radians = (rotation * Math.PI) / 180;

        // Calculate bounding box of rotated image
        const rotatedWidth = Math.abs(Math.cos(radians) * image.width) + Math.abs(Math.sin(radians) * image.height);
        const rotatedHeight = Math.abs(Math.sin(radians) * image.width) + Math.abs(Math.cos(radians) * image.height);

        // Create a temp canvas for the rotated image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = rotatedWidth;
        tempCanvas.height = rotatedHeight;

        // Rotate image and draw to temp canvas
        tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
        tempCtx.rotate(radians);
        tempCtx.drawImage(image, -image.width / 2, -image.height / 2);

        // Crop the image from rotated canvas
        canvas.width = crop.width;
        canvas.height = crop.height;

        // Crop from correct position on rotated canvas
        ctx.drawImage(
            tempCanvas,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    const onCropComplete = useCallback((croppedArea, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const saveEditedImage = async () => {
        try {
            const blob = await getCroppedImg(currentFile.original, croppedAreaPixels, rotation);

            // Convert blob to File (important for formData naming)
            const fileName = currentFile.file.name || 'cropped_image.jpg';
            const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

            // Upload with FormData
            const formData = new FormData();
            formData.append('files', croppedFile);
            formData.append('originalurl', currentFile.original);

            setSpinning(true);
            const response = await fetch(`${API_BASE_URL}/api/Files/upload/edited`, {
                method: 'POST',
                body: formData,
            });
            setSpinning(false);

            if (!response.ok) {
                throw new Error('Failed to upload cropped image.');
            }

            const uploaded = await response.json();
            const uploadedPreview = uploaded[0].thumbnailPath || uploaded[0].originalPath;

            // Replace file in state
            const updatedFiles = files.map(f =>
                f.file.name === currentFile.file.name
                    ? {
                        ...f,
                        preview: uploadedPreview,
                        original: uploaded[0].originalPath,
                        edited: true
                    }
                    : f
            );

            setFiles(updatedFiles);
            setUserFiles(updatedFiles);
            setEditing(false);
            setCurrentFile(null);
            setRotation(0);

            message.success("Edited image saved and uploaded!");
            message.info("Reminder: Save to Palette to save your changes!");
        } catch (error) {
            console.error("Error saving cropped image:", error);
            message.error("Failed to upload edited image.");
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
        // setFiles(prevFiles => prevFiles.map(file => ({
        //     ...file,
        //     projectId: selectedProject.id
        // })));
    };

    const [currentSelectedExistingMDkey, setCurrentSelectedExistingMDkey] = useState(null);
    const [currentSelectedExistingMDvalue, setCurrentSelectedExistingMDvalue] = useState(null);

    const [currentCreatedMDkey, setCurrentCreatedMDkey] = useState(null);
    const [currentCreatedMDvalue, setCurrentCreatedMDvalue] = useState(null);

    const [currentSelectedExistingTag, setCurrentSelectedExistingTag] = useState(null);

    const [currentCreatedTag, setCurrentCreatedTag] = useState(null);

    const handleApplyFileMD = async () => {
        if (!selectFile) {
            message.error("Please select a file before submitting.");
            return;
        }

        const projectId = selectProject?.id ?? selectFile.projectId;

        if (!projectId) {
            message.error("No project associated with the selected file.");
            return;
        }

        console.log(selectFile.id);
        console.log(selectProjectMD);
        console.log(selectProjectTags);
        console.log("on click submit");

        const res = await assignSuggestedProjectToFile(projectId, selectFile.id);
        console.log("file's project id: ", selectFile.projectId);

        if (res.error) {
            message.error(res.error);
        } else {
            message.success(res);
        }

        for (const [key, value] of Object.entries(selectProjectMD)) {
            const resultMD = await addMetaAdvanceTag(selectFile.id, {
                key,
                value,
                type: !isNaN(value) ? 1 : 0
            });
            console.log(resultMD);
        }

        for (const tag of selectProjectTags) {
            const resultTag = await addMetaBasicTag(selectFile.id, tag);
            console.log(resultTag);
        }

        setSelectProjectMD({});
        setSelectProjectTags([]);
        setSelectFile(null);

        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    // WHEN PROJECT IS SELECTED AND SELECTED FILE MD NEEDS TO BE SET
    const handleSelectProjectChange = async (projectId) => {
        const proj = userProjects.find(proj => proj.id === projectId);
        if (!proj) return;

        setSelectProject(proj);

        setSelectFile(prev => ({
            ...prev,
            projectId: projectId
        }));

        const projectMD = await getProjectMetaDataKeysUpload(projectId);
        const fileMD = await getProjectMetaDataKeysFilesUpload(projectId);
        let resultMD = projectMD;
        if(fileMD !== null){
            resultMD = projectMD.concat(fileMD);
        }
        const resultTags = await getProjectBasicTags(projectId);

        resultMD && setExistingSelectProjectMD(resultMD);
        // setExistingSelectProjectMD(resultMD||[]);
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

        const isSelecting = !updatedSelection.has(fileName);
        if (isSelecting && updatedSelection.size === 0) {
            // First selected file — set default resolution
            if (fileObj.resolution !== undefined) {
                const resolutionMap = { 0: 'Low', 1: 'Medium', 2: 'High' };
                setSelectedResolution(resolutionMap[fileObj.resolution]);
            }
        }

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

        try {
            // Create a copy of the current files to maintain after the palette update
            const currentFiles = [...files];
            console.log("this is temp", currentFiles);

            const filesToSave = files.map(({ file, ...rest }) => ({
                ...rest,
                filePath: rest.original,
                thumbnailPath: rest.preview,
                palette: true
            }));
            console.log("filesToSave", filesToSave);

            await saveFiles(filesToSave);

            // After saving to palette, get the updated palette but keep current files visible
            const paletteData = await getUserPaletteData();

            // Instead of replacing files completely, merge palette data with current files
            // This ensures we don't lose the current view
            if (paletteData && paletteData.length > 0) {
                const paletteFiles = paletteData.map((file, index) => ({
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

                // Update userFiles with the palette data
                setUserFiles(paletteFiles);

                // Keep the current files displayed in the UI
                setFiles(paletteFiles);
            }

            message.success("Files saved to palette successfully!");
        } catch (error) {
            console.error("Error saving to palette:", error);
            message.error("Failed to save files to palette");
        } finally {
            setSpinning(false);
        }
    };

    // Helper function to get palette data without modifying state
    async function getUserPaletteData() {
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

            return await response.json();
        } catch (error) {
            console.error('Error fetching palette data:', error);
            return [];
        }
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
        if (!project) {
            message.error("Please select a project.");
            return;
        }

        if (!selectedResolution) {
            message.error("Please select a resolution before uploading.");
            return;
        }

        const selectedFileObjs = files.filter(f => selectedFiles.has(f.file.name));

        if (selectedFileObjs.length === 0) {
            message.warning("No files selected to upload.");
            return;
        }

        const unsaved = selectedFileObjs.filter(f => !f.id);
        if (unsaved.length > 0) {
            message.warning("Some files must be saved to palette first.");
            return;
        }

        const mismatched = selectedFileObjs.find(f =>
            f.projectId !== undefined &&
            f.projectId !== null &&
            f.projectId !== project.id
        );

        if (mismatched) {
            Modal.confirm({
                title: "Some files are assigned to a different project",
                content: "Do you want to continue uploading them to this project?",
                okText: "Yes, continue",
                cancelText: "Cancel",
                onOk: () => proceedUpload(selectedFileObjs),
            });
        } else {
            await proceedUpload(selectedFileObjs, selectedResolution);
        }
    };

    const proceedUpload = async (selectedFileObjs, selectedResolution) => {
        const fileIds = selectedFileObjs.map(f => f.id);
        setSpinning(true);

        const res = await uploadFilesToProject(project.id, fileIds, selectedResolution, user.id);

        setSpinning(false);
        if (res.error) {
            message.error("Upload failed: " + res.error);
            return;
        }

        for (const fid of fileIds) {
            await addLog(user.id, fid, project.id, 'Uploaded images to project');
        }

        message.success("Files uploaded to project!");

        setFiles([]);
        setUserFiles([]);
        setTagApplications([]);
        setProject(null);
        setMetadataTags([]);
        setSelectedDate(dayjs().format('YYYY-MM-DD'));
        setLocation(null);
        setUploadSuccess(true);

        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
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

                            <Button size="small" onClick={() => handleEditImage(files[index], index)}>Edit</Button>
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
                                image={currentFile.original}
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
                            <Button type="primary" color={selectFileMode ? "red" : "cyan"} variant={selectFileMode ? "filled" : "solid"} onClick={handleToggleSelectFile} disabled={files.length === 0}>
                                {selectFileMode ? "Close File" : "Select File"}
                            </Button>
                            <Button type="primary" color="cyan" variant="solid" onClick={handleApplyFileMD} disabled={selectFile === null}>
                                Submit File Metadata
                            </Button>
                        </div>
                        {selectFile && (
                            <div style={{ marginBottom: '10px' }}>
                                <Title level={5}>Existing File Metadata:</Title>
                                {existingFileMetadata.length === 0 ? (
                                    <p style={{ fontSize: '90%', color: 'gray' }}>No metadata found</p>
                                ) : (
                                    <Flex wrap="wrap" style={{ marginTop: '10px' }}>
                                        {existingFileMetadata.map((item, idx) => (
                                            <Tag
                                                key={idx}
                                                closable
                                                onClose={() => handleRemoveExistingMetadata(item.key)}
                                                style={tagStyle}
                                            >
                                                <b>{item.key}</b>: <i style={{ color: 'gray' }}>{String(item.type ? item.iValue : item.sValue)}</i>
                                            </Tag>
                                        ))}
                                    </Flex>
                                )}



                                <Title level={5}>Existing File Tags:</Title>
                                {existingFileTags.length === 0 ? (
                                    <p style={{ fontSize: '90%', color: 'gray' }}>No tags found</p>
                                ) : (
                                    <Flex wrap="wrap" style={{ marginTop: '10px' }}>
                                        {existingFileTags.map((tag, idx) => (
                                            <Tag
                                                key={idx}
                                                closable
                                                onClose={() => handleRemoveExistingTag(tag)}
                                                style={tagStyle}
                                            >
                                                {tag}
                                            </Tag>
                                        ))}
                                    </Flex>
                                )}
                            </div>
                        )}
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
                    value={selectFile?.projectId ?? undefined}
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
                        value={selectedResolution}
                        onChange={(value) => setSelectedResolution(value)}
                        style={{ width: '100%' }}
                        options={[
                            { value: 'Low', label: 'Low' },
                            { value: 'Medium', label: 'Medium' },
                            { value: 'High', label: 'High' }
                        ]}
                        disabled={!(selectMode && selectedFiles.size > 0)}
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
                        disabled={!(selectMode && selectedFiles.size > 0)}
                    />
                </Box>

                <Box sx={metadataBoxStyle}>
                    <Title level={5}>Location:</Title>
                    <Input
                        value={location}
                        onChange={handleLocationChange}
                        placeholder="Enter location"
                        disabled={!(selectMode && selectedFiles.size > 0)}
                    />
                </Box>
            </Box>
            <Spin spinning={spinning} fullscreen tip="Please Wait..." size="large" />
        </Box>

    );
}
