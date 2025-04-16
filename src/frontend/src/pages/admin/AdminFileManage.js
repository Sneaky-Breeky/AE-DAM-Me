import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Typography, Input, Space, Image, Button, Popconfirm, Form, Tooltip, message} from 'antd';
import { SearchOutlined, DeleteOutlined, CloseOutlined, EditOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import { fetchProjects, putProject, getFilesForProject,deleteFileFromProject} from '../../api/projectApi';
import { getProjectImageMetaDataValuesTags } from "../../api/imageApi";
import {editFileMetadataTag} from "../../api/fileApi";
import { useAuth } from '../../contexts/AuthContext';
import {addLog} from "../../api/logApi";

const { Title } = Typography;

export default function AdminFileManage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPopupFormOpen, setPopupFormOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [imageEdit, setImageEdit] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [fetchedProjects, setFetchedProjects] = useState([]);
  const [formValues, setFormValues] = useState({});

  const [form] = Form.useForm();
  const { user } = useAuth();


    useEffect(() => {
        const loadProjects = async () => {
            const projectData = await fetchProjects();
            if (projectData && !projectData.error) {
                setFetchedProjects(projectData);
            } else {
                console.error("Error fetching projects:", projectData?.error || "Unknown error");
            }
        };

        loadProjects();
    }, []);

    
    

    const deleteSelectedImages = async () => {
      console.log(selectedImages);
      const selectedImagesArray = [...selectedImages];
        await Promise.all(selectedImagesArray.map(fileId => addLog(user.id, fileId,project.id, `Deleted Image From Project`)));
      await Promise.all(selectedImagesArray.map(fileId => deleteFileFromProject(project.id, fileId)));

      const files = await getFilesForProject({ projectId: project.id });
      setImageList(files || []);
      setSelectedImages(new Set());
      setIsEditMode(false);
  };

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
    setSelectedImages(new Set());
  };

    const toggleSelectImage = async (fileId) => {
        if (!isEditMode) {
            const selectedFile = imageList.find(file => file.id === fileId);
            if (selectedFile) {
                try {
                    const metadataTags = await getProjectImageMetaDataValuesTags({ pid: project.id, fid: fileId });
                    setImageEdit({
                        ...selectedFile,
                        Metadata: metadataTags || [],
                    });
                    setDialogOpen(true);
                } catch (err) {
                    console.error("Failed to fetch basic tags:", err);
                    setImageEdit({
                        ...selectedFile,
                        bTags: [],
                    });
                    setDialogOpen(true);
                }
            }
        } else {
            const updatedSelection = new Set(selectedImages);
            if (updatedSelection.has(fileId)) {
                updatedSelection.delete(fileId);
            } else {
                updatedSelection.add(fileId);
            }
            setSelectedImages(updatedSelection);
        }
    };

    useEffect(() => {
        if (imageEdit && dialogOpen && Array.isArray(imageEdit.Metadata)) {
            const newFormValues = {};
            imageEdit.Metadata.forEach((md, index) => {
                newFormValues[`value-${index}`] = md.sValue || md.iValue;
            });
            form.setFieldsValue(newFormValues);
        }
    }, [imageEdit, dialogOpen]);

  const handleDialogClose = () => setDialogOpen(false);

    const handleSubmitForm = async () => {
        try {
            const updatedValues = form.getFieldsValue();

            const updates = imageEdit.Metadata.map(async (md, index) => {
                const originalValue = md.sValue || md.iValue;
                const newValue = updatedValues[`value-${index}`];

                if (newValue !== originalValue) {
                    try {
                        await editFileMetadataTag(imageEdit.id, md.key, newValue);
                        console.log(`Updated ${md.key} to ${newValue}`);
                    } catch (err) {
                        console.error(`Failed to update ${md.key}:`, err);
                    }
                }
            });

            await Promise.all(updates);

            message.success("Metadata updated successfully");

            const refreshedFiles = await getFilesForProject({ projectId: project.id });
            setImageList(refreshedFiles || []);
            setImageEdit(null);
            form.resetFields();
            setDialogOpen(false);
        } catch (error) {
            console.error("Error during metadata update:", error);
            message.error("Failed to update metadata");
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
        <Title level={1}>File Metadata Management</Title>
      </Box>

      <Box
        sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'left',
            padding: '20px',
            paddingBottom: 0,
            margin: '10px auto',
            marginBottom: '0',
        }}>
        <Input
          placeholder="Search for a project.."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '90%' }}
        />
      </Box>
       
<Box
  sx={{
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'anchor-center',
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
      alignItems: 'center',
      width: '35%',
      minWidth: '300px',
      margin: '20px auto',
      marginLeft: '0',
      marginRight: '0',
      marginTop: '0',
      borderRadius: '10px',
    }}
  >

    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'left',
        width: '80%',
        height: '60vh',
        marginTop: '0',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'auto',
      }}
    >

    <div style={{overflowY: 'auto', width: '100%', height: '100%'}}>
    <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <tr>
            <th colspan="2" style={{height: '40px', textAlign: 'center', borderBottom:'1px solid black', padding: '0px'}} ><h3>Projects</h3></th>
        </tr>
        {fetchedProjects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toString().includes(searchQuery)
        ).map((p) => (
            <tr onClick={async () => {
                setPopupFormOpen(true);
                setEditOpen(false);
                setProject(p);
                try {
                    const files = await getFilesForProject({ projectId: p.id });
                    setImageList(files || []);
                } catch (err) {
                    console.error("Error fetching files for project:", err);
                    setImageList([]);
                }
            }} style={{height: '50px'}}
            onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#fcfcfc';}}
            onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = '';}}>
              <td style={{ fontSize: '12px', textAlign: 'left', borderBottom:'1px solid black' }}>
                  <span>{p.id} - </span>
                  <span style={{ fontStyle: 'italic', color: 'gray' }}>{p.name}</span>
              </td>
          </tr>
        ))}
    </table>
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
      width: '65%',
      minWidth: '300px',
      marginTop: '0',
      borderRadius: '10px',
      padding: '0',
      overflow: 'auto',
    }}
  > 

    {isPopupFormOpen && 
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'left',
          width: '80%',
          height: '60vh',
          backgroundColor: '#f5f5f5',
          borderRadius: '10px',
          margin: '20px auto',
          marginLeft: '0',
          marginRight: '0',
          marginTop: '0',
          padding: '20px',
          paddingTop: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'auto'
        }}
      >

      <div style={{overflowY: 'auto', width: '100%', height: '100%'}}>
      <Button color="default" variant="text" size={"default"} icon={<CloseOutlined/>}
          onClick={(e) => {
            setEditOpen(false);
            setPopupFormOpen(false);
          }}/>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <tr style={{paddingTop: '0'}}>
                <th colspan="3" style={{height: '40px', textAlign: 'center', padding: '0px'}} ><h3 style={{ margin:'0'}}>Current Files</h3></th>
            </tr>
            <tr style={{paddingTop: '0'}}>
                <th colspan="3" style={{height: '40px', textAlign: 'center', borderBottom:'1px solid black', padding: '0px'}} ><h4 style={{ margin:'0'}}>
                  {project.name + " Project"}
                  </h4></th>
            </tr>
            
        </table>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', padding: 2, paddingLeft: '0', gap: '10px' }}>
          <Button
              onClick={toggleEditMode}
              danger={isEditMode}
              icon={<EditOutlined />}
          >
              {isEditMode ? "Cancel Edit Mode" : "Edit Gallery"}
          </Button>
          {/* Delete button */}
          {isEditMode && selectedImages.size > 0 && (
              <Popconfirm
                  title="Delete Images"
                  description="Are you sure you want to delete the selected images?"
                  onConfirm={deleteSelectedImages}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText="Yes"
                  cancelText="No"
              >
                  <Button type="primary" danger icon={<DeleteOutlined />}>
                      Delete
                  </Button>
              </Popconfirm>
          )}
        </Box>

          {imageList.length === 0 ? (
              <Typography.Text type="secondary" style={{ margin: '20px auto' }}>
                  No files available for this project.
              </Typography.Text>
          ) : (
        <Space wrap size={16} style={{ justifyContent: 'center' }}>
            {imageList.map((file) => (
                <div
                    key={file.id}
                    style={{ position: 'relative', cursor: 'pointer' }}
                    onClick={() => toggleSelectImage(file.id)}
                    onMouseEnter={(e) => {e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.5)';}}
                    onMouseLeave={(e) => {e.currentTarget.style.boxShadow = '';}}
                >
                  <Tooltip title="Edit Tags">
                      <Image
                          key={file.id}
                          src={file.thumbnailPath || file.viewPath || file.originalPath}t
                          width={150}
                          preview={false}
                          style={{
                              border: selectedImages.has(file.id) ? '4px solid red' : 'none',
                              transition: '0.2s ease-in-out',
                          }}
                      />
                  </Tooltip>
                    
                    {selectedImages.has(file.Id) && (
                        <DeleteOutlined
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
                    )}

                    
                </div>
            ))}
        </Space>
          )}
      </div>
    </Box>
    }

    
  </Box>
  

  </Box>

      <Dialog open={dialogOpen} onClose={handleDialogClose} scroll={'paper'} >

      <div style={{display: 'flex', flexDirection: 'row', alignItems:'center', justifyContent: 'space-between', marginRight: '2%'}}>
        <DialogTitle>Edit File Metadata</DialogTitle>
        <Button color="default" variant="text" size={"default"} icon={<CloseOutlined/>} onClick={handleDialogClose}/>   
      </div>

      <DialogContent>

        {imageEdit !== null ? (
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '10%', margin:'auto'}}>

          <Image
            key={imageEdit.id}
            src={imageEdit.thumbnailPath || imageEdit.viewPath || imageEdit.originalPath}t
            width={200}
            preview={false}
            style={{ marginRight: "20px" }}
          />

              <Form form={form} name="file_md_edits" autoComplete="off" onFinish={handleSubmitForm}>
                  <div className="column">
                      <h5 style={{ marginTop: "5%", marginBottom: "5%" }}>Metadata:</h5>
                      {(imageEdit.Metadata || []).map((md, index) => (
                          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                              <Input value={md.key} disabled style={{ width: '45%' }} />
                              <Form.Item name={`value-${index}`} style={{ width: '45%' }}>
                                  <Input placeholder="Value" />
                              </Form.Item>
                          </div>
                      ))}
                  </div>
                  <Button type="primary" htmlType="submit" style={{ marginTop: '10%', float: 'right' }} disabled={imageEdit?.Metadata?.length === 0}>
                      Submit
                  </Button>
              </Form>

          </div>)
        : (
          <p>Please select an image to edit.</p>  //will crash unless there's an "else" cond
        )}
      </DialogContent>
      </Dialog>
    </Box>
  );
}