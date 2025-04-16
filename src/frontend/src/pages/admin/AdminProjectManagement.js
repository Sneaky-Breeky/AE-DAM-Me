import React, { useState, useEffect } from 'react';
import { Typography, Input, Form, Button, Tag, Flex, message, Spin, Popconfirm, DatePicker, CalendarOutlined, Upload } from "antd"
import Box from '@mui/material/Box';
import { CloseOutlined, SearchOutlined, DeleteOutlined, QuestionCircleOutlined, ToTopOutlined,ExportOutlined } from '@ant-design/icons';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import FolderDeleteOutlinedIcon from '@mui/icons-material/FolderDeleteOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { fetchProjects, postProject, deleteProject, archiveProject,exportProject } from '../../api/projectApi';
import { fetchUsers } from '../../api/authApi';
import { giveUserAccess } from '../../api/userApi';
import { API_BASE_URL } from "../../api/apiURL.js";
import { UploadOutlined } from '@ant-design/icons';
import {addLog} from "../../api/logApi";
import { useAuth } from '../../contexts/AuthContext';
const { Title } = Typography;


const tagStyle = {
    backgroundColor: '#dbdbdb'
};

export default function ProjectManagement() {
    const [project, setProject] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [fetchedProjects, setFetchedProjects] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [form] = Form.useForm();
    const fileUpload = {
        name: 'file',
        action: `${API_BASE_URL}/api/damprojects/postproj/bulk`,
        headers: {},
        onChange(info) {
            if (info.file.status !== 'uploading') {
                console.log(info.file, info.fileList);
                message.success(`${info.file.name} uploading`);
            }
            if (info.file.status === 'done') {
                message.success(`${info.file.name} file uploaded successfully`);
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
            }
        }
    }
    const { user } = useAuth();



    // Fetch projects
    const getProjects = async () => {
        setLoading(true);
        const response = await fetchProjects();

        if (response.error) {
            console.error("Error fetching projects:", response.error);
            setFetchedProjects([]);
        } else {
            console.log("Fetched Projects:", response);
            setFetchedProjects(response);
        }

        setLoading(false);
    };

    useEffect(() => {
        getProjects();
    }, []);


    const handleAddProjectButton = async (values) => {
        console.log("Submitting data:", values);

        const projectData = {
            name: values.projectName,
            description: values.description,
            status: "Active",
            location: values.location || "",
            imagePath: null,
            phase: "",
            accessLevel: 0,
            lastUpdated: new Date().toISOString(),
            startDate: values.startDate.toISOString(),
            files: [],
            users: []
        };
        try {
            const result = await postProject(projectData);
            await addLog(user.id, null, result.id, 'Created a new project');
            setProject(result);

            if (result.error) {
                throw new Error(result.error);
            }

            // give admin access to this project
            const users = await fetchUsers();
            const admins = users.filter((user) => user.role === 1);

            for (const admin of admins) {
                await giveUserAccess(admin.id, result.id);
            }

            console.log("Project successfully added:", result);
            message.success("Project added successfully");
            form.resetFields();

            await getProjects();
        } catch (error) {
            console.error("Error adding project:", error);
            message.error("Failed to add project");
        }
    };

    const handleDeleteProject = async (p) => {
        try {
            await addLog(user.id, null, p.id, `Deleted Project`);
            const result = await deleteProject(p.id);

            if (result.error) {
                throw new Error(result.error);
            }

            message.success("Project deleted successfully");
            await getProjects();
        } catch (error) {
            console.error("Error deleting project:", error);
            message.error("Failed to delete project.");
        }
    };

    const handleArchiveProject = async (p) => {
        try {
            await addLog(user.id, null, p.id, 'Archived a project');
            const response = await archiveProject(p.id);


            if (response.error) {
                throw new Error("Archive error", response.error);
            }

            message.success("Project archived successfully!");
            await getProjects();
        } catch (error) {
            console.error("Error archiving project:", error);
            message.error("Failed to archive project.");
        }
    };
    const handleProjectExport = async (p) => {
        await addLog(user.id, null, p.id, 'Exported a project');
        const archiveFileUrl = await exportProject(p.id);
        const a = document.createElement("a");
        a.href = archiveFileUrl;
        a.download =  `${p.name}.zip`; // Name of the downloaded file
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(archiveFileUrl); 
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
                <Title level={1}>Manage Project Directories</Title>
            </Box>

            {/* Main content */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-evenly',
                    alignItems: 'anchor-center',
                    height: '100vh',
                    flexDirection: 'row',
                    flexGrow: 1,
                }}
            >

                {/* Container with create delete archive and export projects */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-center',
                        alignItems: 'center',
                        width: '20%',
                        minWidth: '200px',
                        height: "fit-content",
                        marginTop: '0',
                        overflow: 'hidden',
                    }}
                >

                    {/*Create a project*/}
                    <Box
                        onClick={() => {
                            setDeleteOpen(false);
                            setArchiveOpen(false);
                            setExportOpen(false);
                            setCreateOpen(!createOpen);
                        }}
                        sx={{
                            textAlign: 'center',
                            width: '80%',
                            height: '50%',
                            margin: '5%',
                            backgroundColor: 'grey.300',
                            border: 1,
                            borderColor: 'grey.500',
                            borderRadius: '16px',
                            '&:hover': { boxShadow: 3 },
                            overflow: 'auto'
                        }}
                    >
                        {!createOpen ?
                            <CreateNewFolderOutlinedIcon style={{ marginTop: '5%', marginBottom: '0', fontSize: '400%' }} />
                            : <CloseOutlined style={{ marginTop: '5%', marginBottom: '0', fontSize: '400%' }} />
                        }
                        <h4 style={{ margin: '0', marginBottom: '5%' }}>{!createOpen ? "Create Project" : "Close"}</h4>
                    </Box>

                    {/*Delete a project*/}
                    <Box
                        onClick={() => {
                            setCreateOpen(false);
                            setArchiveOpen(false);
                            setExportOpen(false);
                            setDeleteOpen(!deleteOpen);
                        }}
                        sx={{
                            textAlign: 'center',
                            width: '80%',
                            height: '100%',
                            margin: '5%',
                            backgroundColor: 'grey.300',
                            border: 1,
                            borderColor: 'grey.500',
                            borderRadius: '16px',
                            '&:hover': { boxShadow: 3 },
                            overflow: 'auto'
                        }}
                    >
                        {!deleteOpen ?
                            <FolderDeleteOutlinedIcon style={{  marginTop: '5%', marginBottom: '0', fontSize: '400%'  }} />
                            : <CloseOutlined style={{  marginTop: '5%', marginBottom: '0', fontSize: '400%' }} />
                        }
                        <h4 style={{ margin: '0', marginBottom: '5%' }}>{!deleteOpen ? "Delete Project" : "Close"}</h4>
                    </Box>

                    {/*Archive a project*/}
                    <Box
                        onClick={() => {
                            setCreateOpen(false);
                            setDeleteOpen(false);
                            setExportOpen(false);
                            setArchiveOpen(!archiveOpen);
                        }}
                        sx={{
                            textAlign: 'center',
                            width: '80%',
                            height: '100%',
                            margin: '5%',
                            backgroundColor: 'grey.300',
                            border: 1,
                            borderColor: 'grey.500',
                            borderRadius: '16px',
                            '&:hover': { boxShadow: 3 },
                            overflow: 'auto'
                        }}
                    >
                        {!archiveOpen ?
                            <Inventory2OutlinedIcon style={{  marginTop: '5%', marginBottom: '0', fontSize: '400%'  }} />
                            : <CloseOutlined style={{  marginTop: '5%', marginBottom: '0', fontSize: '400%'  }} />
                        }
                        <h4 style={{ margin: '0', marginBottom: '5%' }}>{!archiveOpen ? "Archive Project" : "Close"}</h4>
                    </Box>
                    {/* Export a project */}
                    <Box
                        onClick={() => {
                            setCreateOpen(false);
                            setArchiveOpen(false);
                            setDeleteOpen(false);
                            setExportOpen(!exportOpen)
                        }}
                        sx={{
                            textAlign: 'center',
                            width: '80%',
                            height: '100%',
                            margin: '5%',
                            backgroundColor: 'grey.300',
                            border: 1,
                            borderColor: 'grey.500',
                            borderRadius: '16px',
                            '&:hover': { boxShadow: 3 },
                            overflow: 'auto'
                        }}
                    >
                        {!exportOpen ?
                            <ExportOutlined style={{  marginTop: '5%', marginBottom: '0', fontSize: '400%' }} />
                            : <CloseOutlined style={{  marginTop: '5%', marginBottom: '0', fontSize: '400%'  }} />
                        }
                        <h4 style={{ margin: '0', marginBottom: '5%' }}>{!exportOpen ? "Export Project" : "Close"}</h4>
                    </Box>

                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minWidth: '300px',
                        width: '60%',
                        height: "fit-content",
                        margin: '0',
                        overflow: 'auto',
                    }}
                >

                    {/* Container with inputs */}
                    {createOpen &&
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'left',
                                width: '100%',
                                height: "fit-content",
                                margin: '5%',
                                marginTop: '0',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '10px',
                                padding: '20px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                overflow: 'auto',
                            }}
                        >
                            <Title level={4} style={{ textAlign: 'center', marginTop: '0' }}>Create Directory</Title>
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

                                <Title level={5} style={{ marginTop: '10px' }}>
                                    Start Date <span style={{ color: 'red' }}>*</span>
                                </Title>
                                <Form.Item
                                    name="startDate"
                                    rules={[{ required: true, message: "Please select a start date" }]}
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        format="YYYY-MM-DD"
                                    />
                                </Form.Item>


                                <Title level={5} style={{ marginTop: '10px' }}>Location</Title>
                                <Form.Item name="location">
                                    <Input placeholder="Enter location" />
                                </Form.Item>
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

                            <div style={{
                                display: "flex",
                                flexDirection: 'column',
                                alignItems:'start',
                                overflow:'auto'
                            }}>

                                <Upload {...fileUpload}>
                                    <Button style={{
                                        marginTop: "10px",
                                        padding: "10px 20px",
                                        backgroundColor: "#4096ff",
                                        borderColor: "#4096ff",
                                        color: "white",
                                        fontWeight: "bold",
                                    }} icon={<UploadOutlined />}>Import Projects</Button>
                                </Upload>

                                <Button onClick={() => window.open("https://dambeblob.blob.core.windows.net/assets/sample-project-bulk-upload.csv", "_self")} type="link"
                                    style={{
                                        marginTop: "10px",
                                        padding: "10px",
                                        paddingLeft: '0px',
                                        color: "#4096ff",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Sample File- Import Projects
                                </Button>
                            </div>
                        </Box>}

                    {deleteOpen &&
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'left',
                                width: '80%',
                                minWidth: '300px',
                                height: "75vh",
                                margin: '5%',
                                marginTop: '0',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '10px',
                                padding: '20px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                overflow: 'auto',
                            }}
                        >
                            <Title level={4} style={{ textAlign: 'center', marginTop: '0' }}>Delete Directory</Title>

                            <Input
                                placeholder="Search for a project.."
                                prefix={<SearchOutlined />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '50%', marginBottom: '2%' }}
                                disabled={loading}
                            />

                            <div style={{ overflowY: 'auto', width: '100%', height: '100%' }}>
                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        <Spin size="large" />
                                        <p>Loading projects...</p>
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid black' }}>
                                        <tbody>
                                            {(fetchedProjects.filter((p) =>
                                                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                p.id.toString().includes(searchQuery)
                                            )).map((p) => (
                                                <tr
                                                    key={p.id}

                                                    style={{ height: '50px' }}
                                                >
                                                    <td style={{ fontSize: '12px', textAlign: 'left', borderBottom: '1px solid black' }}>
                                                        {p.id} <span style={{ color: 'gray', fontStyle: 'italic' }}> - {p.name}</span>
                                                    </td>


                                                    <td style={{ fontSize: '12px', textAlign: 'center', borderBottom: '1px solid black' }}>
                                                        <Popconfirm
                                                            title="Delete Project Directory"
                                                            description="Are you sure you want to delete the selected project directory?"
                                                            onConfirm={() => handleDeleteProject(p)}
                                                            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                                                            okText="Yes"
                                                            cancelText="No"
                                                        >
                                                            <Button type="primary" danger icon={<DeleteOutlined />}>
                                                                Delete
                                                            </Button>
                                                        </Popconfirm>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                        </Box>}


                    {archiveOpen &&
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'left',
                                width: '80%',
                                minWidth: '300px',
                                height: "75vh",
                                margin: '5%',
                                marginTop: '0',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '10px',
                                padding: '20px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                overflow: 'auto',
                            }}
                        >
                            <Title level={4} style={{ textAlign: 'center', marginTop: '0' }}>Archive Directory</Title>

                            <Input
                                placeholder="Search for a project.."
                                prefix={<SearchOutlined />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '50%', marginBottom: '2%' }}
                                disabled={loading}
                            />

                            <div style={{ overflowY: 'auto', width: '100%', height: '100%' }}>
                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        <Spin size="large" />
                                        <p>Loading projects...</p>
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid black' }}>
                                        <tbody>
                                            {(fetchedProjects.filter((p) =>
                                                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                p.id.toString().includes(searchQuery)
                                            )).map((p) => (
                                                <tr
                                                    key={p.id}

                                                    style={{ height: '50px' }}
                                                >
                                                    <td style={{ fontSize: '12px', textAlign: 'left', borderBottom: '1px solid black' }}>
                                                        {p.id} <span style={{ color: 'gray', fontStyle: 'italic' }}> - {p.name}</span>
                                                    </td>


                                                    <td style={{ fontSize: '12px', textAlign: 'center', borderBottom: '1px solid black' }}>
                                                        <Popconfirm
                                                            title="Archive Project Directory"
                                                            description="Are you sure you want to archive the selected project directory?"
                                                            onConfirm={() => handleArchiveProject(p)}
                                                            icon={<QuestionCircleOutlined style={{ color: 'blue' }} />}
                                                            okText="Yes"
                                                            cancelText="No"
                                                        >
                                                            <Button color="primary" variant="filled" icon={<ToTopOutlined />}>
                                                                Archive
                                                            </Button>
                                                        </Popconfirm>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                        </Box>}

                    {exportOpen &&
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'left',
                                width: '80%',
                                minWidth: '300px',
                                height: "75vh",
                                margin: '5%',
                                marginTop: '0',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '10px',
                                padding: '20px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                overflow: 'auto',
                            }}
                        >
                            <Title level={4} style={{ textAlign: 'center', marginTop: '0' }}>Export Project</Title>

                            <Input
                                placeholder="Search for a project.."
                                prefix={<SearchOutlined />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '50%', marginBottom: '2%' }}
                                disabled={loading}
                            />

                            <div style={{ overflowY: 'auto', width: '100%', height: '100%' }}>
                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        <Spin size="large" />
                                        <p>Loading projects...</p>
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid black' }}>
                                        <tbody>
                                            {(fetchedProjects.filter((p) =>
                                                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                p.id.toString().includes(searchQuery)
                                            )).map((p) => (
                                                <tr
                                                    key={p.id}

                                                    style={{ height: '50px' }}
                                                >
                                                    <td style={{ fontSize: '12px', textAlign: 'left', borderBottom: '1px solid black' }}>
                                                        {p.id} <span style={{ color: 'gray', fontStyle: 'italic' }}> - {p.name}</span>
                                                    </td>


                                                    <td style={{ fontSize: '12px', textAlign: 'center', borderBottom: '1px solid black' }}>
                                                        <Popconfirm
                                                            title="Export Project"
                                                            description="Are you sure you want to export the selected project?"
                                                            onConfirm={() => handleProjectExport(p)}
                                                            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                                                            okText="Yes"
                                                            cancelText="No"
                                                        >
                                                            <Button type="primary" info icon={<ExportOutlined />}>
                                                                Export
                                                            </Button>
                                                        </Popconfirm>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                        </Box>}

                </Box>
            </Box>
        </Box>
    )
}