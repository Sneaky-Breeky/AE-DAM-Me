import React, { useState, useEffect  } from 'react';
import Box from '@mui/material/Box';
import { Typography, Button, Input, Form, Space, DatePicker, Spin, message, Popconfirm } from 'antd';
import { SearchOutlined, CloseOutlined, MinusCircleOutlined, PlusOutlined, CalendarOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchProjects, putProject, addProjectTag, deleteProjectTag, fetchTagsForProject } from '../../api/projectApi';


const { Title } = Typography;

export default function AdminMetadataManage() {
const [searchQuery, setSearchQuery] = useState('');
const [isPopupFormOpen, setPopupFormOpen] = useState(false);
const [isEditOpen, setEditOpen] = useState(false);
const [fetchedProjects, setFetchedProjects] = useState([]);
const [project, setProject] = useState(null);
const [loading, setLoading] = useState(true);

const [form] = Form.useForm();


// Fetch projects
    const getProjects = async () => {
        setLoading(true);
        const response = await fetchProjects();

        if (response.error) {
            console.error("Error fetching projects:", response.error);
            setFetchedProjects([]);
            setLoading(false);
            return [];
        }

        setFetchedProjects(response);
        setLoading(false);
        return response; 
    };


useEffect(() => {
getProjects();
}, []);


    useEffect(() => {
        if (project && project.tags) {
            const convertedTags = project.tags.map(tag => ({
                field: tag.key,
                fieldMD: tag.type === 0 ? tag.sValue : tag.iValue
            }));
            form.setFieldsValue({ fields: convertedTags });
        }
    }, [project, isEditOpen]);

    
    
//TODO: only allow Status to be "Active" or "Inactive"
const handleMDEdits = async (values) => {
if (!project) return;

try {
const updatedFields = {};

// compare original project info with current form info
if (values.name && values.name !== project.name) updatedFields.name = values.name;
if (values.location && values.location !== project.location) updatedFields.location = values.location;
if (values.date && (!project.date || !dayjs(project.date).isSame(dayjs(values.date), 'day'))) {
updatedFields.date = values.date.format('YYYY-MM-DD');
}
if (values.status && values.status !== project.status) updatedFields.status = values.status;
if (values.phase && values.phase !== project.phase) updatedFields.phase = values.phase;

// if any fields change then update project
if (Object.keys(updatedFields).length > 0) {
const updatedProject = { ...project, ...updatedFields };
const putRes = await putProject(project.id, updatedProject);
if (putRes.error) throw new Error(putRes.error);
}

// handle metadata tag changes
const oldTags = project.tags || [];
const oldTagKeys = oldTags.map(tag => tag.key);
const newTags = values.fields?.filter(f => f.field && f.fieldMD) || [];
const newTagKeys = newTags.map(tag => tag.field);

// add new tags
for (const tag of newTags) {
if (!oldTagKeys.includes(tag.field)) {
const type = typeof tag.fieldMD === 'number' ? 1 : 0; // 1 = Integer, 0 = String
await addProjectTag(project.id, tag.field, tag.fieldMD, type);
}}

// remove deleted tags
    for (const oldTag of oldTags) {
        if (!newTags.find(tag => tag.field === oldTag.key)) {
            const res = await deleteProjectTag(oldTag.key, project.id);
            if (!res.error) {
                message.success(`Deleted tag: ${oldTag.key}`);
            } else {
                message.error(`Failed to delete tag: ${oldTag.key}`);
                console.error(res.error);
            }
        }
    }

// update local tags state
    const updatedTags = oldTags.filter(oldTag =>
        newTags.find(tag => tag.field === oldTag.key)
    );
    setProject(prev => ({
        ...prev,
        tags: updatedTags
    }));


message.success("Project updated successfully");
setEditOpen(false);
form.resetFields();
await getProjects();
} catch (err) {
console.error("Error updating project:", err);
message.error("Failed to update project");
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
<Title level={1}>Metadata Management</Title>
</Box>

<Box
sx={{
display: 'flex',
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'left',
height: '100vh',
width: '80%',
margin: '20px auto',
marginTop: '0',
borderRadius: '10px',
padding: '20px',
overflow: 'auto',
}}
>

{/* left container with current metadata */}
<Box
sx={{
display: 'flex',
flexDirection: 'column',
justifyContent: 'flex-start',
alignItems: 'left',
width: '50%',
margin: '20px auto',
marginRight: '0',
borderRadius: '10px',
}}
>
<Input
placeholder="Search for a project.."
prefix={<SearchOutlined />}
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
style={{ width: '300px' }}
disabled={loading}
/>

<Box
sx={{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'left',
    width: '80%',
    height: '100%',
    margin: '20px auto',
    marginLeft: '0',
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'auto',
}}
>

<div style={{overflowY: 'auto', width: '100%', height: '100%'}}>
    {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p>Loading projects...</p>
        </div>
    ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tr>
                <th colSpan="2" style={{ height: '40px', textAlign: 'center', borderBottom: '1px solid black', padding: '0px' }}>
                    <h3>Projects</h3>
                </th>
            </tr>
            {(fetchedProjects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))).map((p) => (
                <tr
                    key={p.id}
                    onClick={async () => {
                        setEditOpen(false);
                        const tags = await fetchTagsForProject(p.id);
                        const fullProject = { ...p, tags };
                        setProject(fullProject);
                        setPopupFormOpen(true);
                    }} style={{ height: '50px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fcfcfc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}>
                    <td style={{ fontSize: '12px', textAlign: 'left', borderBottom: '1px solid black' }}>{p.name}</td>
                </tr>
            ))}
        </table>
    )}
</div>

</Box>
</Box>

{/* right container to add metadata*/}
<Box
sx={{
display: 'flex',
flexDirection: 'column',
justifyContent: 'flex-Center',
alignItems: 'center',
width: '50%',
height: '95%',
margin: '20px auto',
marginTop: '0',
borderRadius: '10px',
padding: '0',
overflow: 'auto',
}}
>

{/*isPopupFormOpen && popupForm(form, onFinish, project, searchEditQuery, setSearchEditQuery, setPopupFormOpen,
editNameOpen, setEditNameOpen, editLocOpen, setEditLocOpen, editDateOpen, setEditDateOpen, editStateOpen, setEditStateOpen, editPhaseOpen, setEditPhaseOpen
)*/}

{isPopupFormOpen &&
<Box
    sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'left',
        width: '80%',
        height: '100%',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        margin: '20px auto',
        marginLeft: '0',
        marginTop: '0',
        padding: '20px',
        paddingTop: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'auto'
    }}
>

    <div style={{overflowY: 'auto', width: '100%', height: '100%'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <tr style={{paddingTop: '0'}}>
                <th colspan="3" style={{height: '40px', textAlign: 'center', padding: '0px'}} ><h3 style={{ margin:'0'}}>Current Metadata</h3></th>
            </tr>
            <tr style={{paddingTop: '0'}}>
                <th colspan="3" style={{height: '40px', textAlign: 'center', borderBottom:'1px solid black', padding: '0px'}} ><h4 style={{ margin:'0'}}>
                    {project.name + " Project"}

                </h4></th>
            </tr>

        </table>

        <Form
            form={form}
            name="md_edits"
            layout="horizontal"
            autoComplete="off"
            onFinish={(values) => handleMDEdits(values)}
            style={{margin: '10px auto'}}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                }
            }}
            initialValues={{
                name: project?.name || '',
                location: project?.location || '',
                date: project?.date ? dayjs(project.date) : null,
                status: project?.status || '',
                phase: project?.phase || '',
                fields: project?.tags?.map(tag => ({
                    field: tag.key,
                    fieldMD: tag.type === 0 ? tag.sValue : tag.iValue
                })) || [],

            }}>

            <Form.Item style={{ marginBottom: "5px", marginRight: "10px" }}
                       name="name"
                       label={<p style={{fontWeight:"bold"}}>Project Name</p>}
            >
                {isEditOpen ? <Input defaultValue={project.name}/> : project.name}
            </Form.Item>

            <Form.Item style={{ marginBottom: "5px", marginRight: "10px" }}
                       name="location"
                       label={<p style={{fontWeight:"bold"}}>Location</p>}
            >
                {isEditOpen ? <Input defaultValue={project.location}/> : project.location}
            </Form.Item>

            <Form.Item style={{ marginBottom: "5px", marginRight: "10px" }}
                       name="date"
                       label={<p style={{fontWeight:"bold"}}>Date</p>}
            >
                {isEditOpen ? <DatePicker
                        maxDate={dayjs()}
                        placeholder= {dayjs(project.date).format('MMM DD, YYYY')}
                        suffixIcon={<CalendarOutlined />}
                        style={{ width: '100%' }}
                    />
                    : dayjs(project.date).format('MMM DD, YYYY')}
            </Form.Item>

            <Form.Item style={{ marginBottom: "5px", marginRight: "10px" }}
                       name="status"
                       label={<p style={{fontWeight:"bold"}}>Status</p>}
            >
                {isEditOpen ? <Input defaultValue={project.status}/> : project.status}
            </Form.Item>

            <Form.Item style={{ marginBottom: "5px", marginRight: "10px" }}
                       name="phase"
                       label={<p style={{fontWeight:"bold"}}>Phase</p>}
            >
                {isEditOpen ? <Input defaultValue={project.phase}/> : project.phase}
            </Form.Item>


            <Form.List name="fields">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (

                            <Space
                                key={key}
                                align="baseline"
                                style={{ display: 'block' }}
                            >
                                {isEditOpen ?
                                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                                        <Form.Item style={{ marginBottom: "5px", marginRight: "10px" }}
                                                   {...restField}
                                                   name={[name, 'field']}
                                                   rules={[
                                                       {
                                                           required: true,
                                                           message: 'Missing field name',
                                                       },
                                                   ]}
                                        >
                                            <Input placeholder="Field name" />
                                        </Form.Item>

                                        <Form.Item style={{ marginBottom: "5px", marginRight: "10px" }}
                                                   {...restField}
                                                   name={[name, 'fieldMD']}
                                        >
                                            <Input placeholder="Metadata" />
                                        </Form.Item>

                                        <Popconfirm
                                            title="Are you sure you want to delete this tag?"
                                            onConfirm={() => remove(name)}
                                            okText="Yes"
                                            cancelText="No"
                                        >
                                            <MinusCircleOutlined
                                                style={{ marginBottom: "5px", marginRight: "20px", color: 'red' }}
                                            />
                                        </Popconfirm>

                                    </div>

                                    : <Form.Item
                                        style={{ marginBottom: '5px', marginRight: '10px' }}
                                        {...restField}
                                        name={[name, 'field']}
                                        label={<p style={{fontWeight:"bold"}}>{form.getFieldValue(['fields', name, 'field'])}</p>}
                                    >
                                        <span> {form.getFieldValue(['fields', name, 'fieldMD'])} </span>
                                    </Form.Item>
                                }

                            </Space>
                        ))}


                        <Form.Item style={{ marginBottom: "5px", marginRight: "10px" }}>
                            {isEditOpen ?
                                (<Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add field
                                </Button>)
                                : (<div style={{height:"0"}}></div>)
                            }
                        </Form.Item>
                    </>
                )}
            </Form.List>

            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', margin: '20px auto', marginBottom: '0'}}>
                <Button color="default" variant="text" size={"default"} icon={<CloseOutlined/>}
                        onClick={(e) => {
                            //e.stopPropagation();
                            form.resetFields();
                            setEditOpen(false);
                            setPopupFormOpen(false);
                        }}/>

                <Button type="default" htmlType="button" size={"default"}
                        onClick={() => {
                            //e.stopPropagation();
                            form.resetFields();
                            setEditOpen(isEditOpen ? false:true);
                        }}>{isEditOpen ? 'Close':'Edit'}</Button>


                {isEditOpen ?
                    (<Button type="primary" size={"default"} onClick={() => {
                        form
                            .validateFields()
                            .then(handleMDEdits)
                            .catch((error) => console.log("Validation failed:", error));
                    }}>
                        Submit
                    </Button>)
                    : (<Button type="primary" disabled size={"default"}>Submit</Button>)
                }

            </div>

        </Form>

    </div>
</Box>
}
</Box>
</Box>
</Box>
);
}