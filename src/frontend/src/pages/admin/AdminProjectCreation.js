import React, { useState } from 'react';
import { Typography, Input, Form, Button, Tag, Flex, message } from "antd"
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import { projects, files, logs } from '../../utils/dummyData.js';

const { Title } = Typography;

const tagStyle = {
    backgroundColor: '#dbdbdb'
};

export default function ProjectCreation() {
    const [defaultMetadataFieldsField, setDefaultMetadataFieldsField] = useState();
    const [defaultMetadataFields, setDefaultMetadataFields] = useState([]);
    const [defaultMetadataTagInput, setDefaultMetadataTagInput] = useState();
    const [defaultMetadataTags, setDefaultMetadataTags] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [form] = Form.useForm();

    const handleMetadataTagClose = (removedTag) => {
        const newTags = defaultMetadataTags.filter((tag) => tag !== removedTag);
        setDefaultMetadataTags(newTags);
    }

    const handleMetadataTagAdd = () => {
        if (defaultMetadataTagInput && !defaultMetadataTags.includes(defaultMetadataTagInput)) {
            setDefaultMetadataTags([...defaultMetadataTags, defaultMetadataTagInput]);
        }
        setDefaultMetadataTagInput("");
    }

    const handleMetadataFieldClose = (removedField) => {
        const newFields = defaultMetadataFields.filter((tag) => tag !== removedField);
        setDefaultMetadataFields(newFields);
    }

    const handleMetadataFieldAdd = () => {
        if (defaultMetadataFieldsField && !defaultMetadataFields.includes(defaultMetadataFieldsField)) {
            setDefaultMetadataFields([...defaultMetadataFields, defaultMetadataFieldsField]);
        }
        setDefaultMetadataFieldsField("");
    }

    const success = () => {
        messageApi.open({
            type: 'success',
            content: 'Project Added',
        });
    };




    const handleAddProjectButton = async (values) => {
        console.log("Submitting data:", values);
    
        const projectData = {
            name: values.projectName,
            description: values.description,
            status: "Active",
            location: values.location || "Unknown",
            imagePath: null,
            phase: "Planning",
            accessLevel: 0,
            lastUpdated: new Date().toISOString(),  // current time
            files: [],
            users: []
        };
    
        try {
            const response = await fetch('/api/Projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const result = await response.json();
            console.log("Project successfully added:", result);
            message.success("Project added successfully");
    
            // Reset form
            form.resetFields();
            setDefaultMetadataFields([]);
            setDefaultMetadataTags([]);
    
        } catch (error) {
            console.error("Error adding project:", error);
            message.error("Failed to add project");
        }
    };
    



    // const handleAddProjectButton = (values) => {
    //     // send project info to backend here
    //     console.log("Submitting data:", values);

    //     const projectData = {
    //         ...values, // projectName, description, location
    //         metadataFields: defaultMetadataFields,
    //         metadataTags: defaultMetadataTags,
    //     };

    //     const project = {
    //         id: projects.length,
    //         name: values.projectName, 
    //         location: values.location, 
    //         date: dayjs(),
    //         thumbnail: null, 
    //         accessLevel: 'Admins Only', 
    //         listUsers: [], 
    //         status: null,
    //         phase: null,
    //         lastUpdated: dayjs(),
    //         files: files
    //     };

    //     const projectFile = {
    //         Id: files.length, 
    //         FileName: project.name, 
    //         FilePath: null, 
    //         Metadata: defaultMetadataTags, 
    //         ProjectId: project.id, 
    //         Status: "Active", 
    //         Date: dayjs() 
    //    };

    //    const projectLog = {
    //         time: dayjs(), 
    //         action: 'Project created' 
    //    };

    //    projects.push(project);
    //    files.push(projectFile);
    //    logs.push(projectLog);
    //     //

    //     console.log("Final Project Data:", projects.at(-1));
    //     success();

    //     form.resetFields();
    //     setDefaultMetadataFields([]);
    //     setDefaultMetadataTags([]);
    // };

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
                <Title level={1}>Create Project Directories</Title>
            </Box>

            {/* Main content */}
            <Box
                sx={{
                    display: 'flex',
                    flexGrow: 1,
                }}
            >
                {/* Container with inputs */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'left',
                        width: '50%',
                        height: "fit-content",
                        margin: '20px auto',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '10px',
                        padding: '20px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                    }}
                >
                    <Form
                        form={form}
                        name="project_creation"
                        layout="vertical"
                        autoComplete="off"
                        onFinish={handleAddProjectButton}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                            }
                        }}
                    >
                        <Title level={5} style={{ marginTop: '10px' }}>
                            Project Name <span style={{ color: 'red' }}>*</span>
                        </Title>
                        <Form.Item
                            name="projectName"
                            rules={[{ required: true, message: "Please enter a project name" }]}
                        >
                            <Input placeholder="Enter project name" />
                        </Form.Item>

                        <Title level={5} style={{ marginTop: '10px' }}>
                            Description <span style={{ color: 'red' }}>*</span>
                        </Title>
                        <Form.Item
                            name="description"
                            rules={[{ required: true, message: "Please enter a description" }]}
                        >
                            <Input placeholder="Enter description" />
                        </Form.Item>

                        <Title level={5} style={{ marginTop: '10px' }}>Location</Title>
                        <Form.Item name="location">
                            <Input placeholder="Enter location" />
                        </Form.Item>

                        <Title level={5} style={{ marginTop: '10px' }}>Default Metadata Fields:</Title>
                        <Form.Item>
                            <Input
                                placeholder="ex. Date"
                                value={defaultMetadataFieldsField}
                                onChange={(e) => setDefaultMetadataFieldsField(e.target.value)}
                                onPressEnter={(e) => handleMetadataFieldAdd(e.target.value)}
                            />
                        </Form.Item>
                        <Flex gap="4px 0" wrap>
                            {defaultMetadataFields.map((tag) => (
                                <Tag
                                    style={tagStyle}
                                    key={tag}
                                    closable={true}
                                    onClose={() => handleMetadataFieldClose(tag)}
                                >
                                    {tag}
                                </Tag>
                            ))
                            }
                        </Flex>

                        <Title level={5} style={{ marginTop: '10px' }}>Default Metadata Tags:</Title>
                        <Form.Item>
                            <Input
                                placeholder="ex. bridge"
                                value={defaultMetadataTagInput}
                                onChange={(e) => setDefaultMetadataTagInput(e.target.value)}
                                onPressEnter={(e) => handleMetadataTagAdd(e.target.value)}
                            />
                        </Form.Item>
                        <Flex gap="4px 0" wrap>
                            {defaultMetadataTags.map((tag) => (
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
                        {contextHolder}

                        <div style={{ textAlign: "center", marginTop: "10px" }}>
                            <Button
                                htmlType="submit"
                                style={{
                                    marginTop: "10px",
                                    padding: "10px 20px",
                                    backgroundColor: "#00bcd4",
                                    borderColor: "#00bcd4",
                                    color: "white",
                                    fontWeight: "bold",
                                }}
                                type="primary"
                            >
                                Add Project
                            </Button>
                        </div>
                    </Form>
                </Box>
            </Box>
        </Box>
    )
}