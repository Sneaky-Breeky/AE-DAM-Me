import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Typography, Input, Space, Image, Button, Popconfirm, Form} from 'antd';
import { SearchOutlined, DeleteOutlined, CloseOutlined, EditOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import { projects } from '../../utils/dummyData.js';

const { Title } = Typography;

export default function AdminFileManage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPopupFormOpen, setPopupFormOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [imageList, setImageList] = useState(new Set());
  const [imageEdit, setImageEdit] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formValues, setFormValues] = useState({});

  const [form] = Form.useForm();


  const deleteSelectedImages = () => {
    setImageList(imageList.filter((_, index) => !selectedImages.has(index)));
    setSelectedImages(new Set());
    setIsEditMode(false);
  };

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
    setSelectedImages(new Set());
  };
  
  const toggleSelectImage = (index) => {
    if (!isEditMode) {
      setDialogOpen(true);
      setImageEdit(imageList[index]);
    } else {
      const updatedSelection = new Set(selectedImages);
      if (updatedSelection.has(index)) {
          updatedSelection.delete(index);
      } else {
          updatedSelection.add(index);
      }
      setSelectedImages(updatedSelection);
    }
  };

  useEffect(() => {
    // When the `md` array changes, update the form fields
    if (imageEdit && dialogOpen) {
      const newFormValues = {};
      imageEdit.Metadata.forEach((md, index) => {
        newFormValues[index] = md;
      });
      form.setFieldsValue(newFormValues);
    }
  }, [imageEdit, dialogOpen]);

  const handleDialogClose = () => setDialogOpen(false);

  const handleSubmitForm = () => {

    console.log(Object.values(form.getFieldsValue())); // gives array, use to replace tags
    form.resetFields();
    setDialogOpen(false);
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
    justifyContent: 'space-between',
    alignItems: 'left',
    height: '100vh',
    width: '90%',
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
      width: '35%',
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
      style={{ width: '90%' }}
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
    <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <tr>
            <th colspan="2" style={{height: '40px', textAlign: 'center', borderBottom:'1px solid black', padding: '0px'}} ><h3>Projects</h3></th>
        </tr>
        {(projects.filter(p => {return p.name.toLowerCase().includes(searchQuery.toLowerCase())})).map((p) => (
          <tr onClick={() => {
            setPopupFormOpen(true);
            setEditOpen(false);
            setImageList(p.files);
            setProject(p);
          }} style={{height: '50px'}}
            onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#fcfcfc';}}
            onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = '';}}>
            <td style={{ fontSize: '12px', textAlign: 'left', borderBottom:'1px solid black'}} >{p.name}</td>
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
      height: '95%',
      margin: '20px auto',
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
          height: '100%',
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

        <Space wrap size={16} style={{ justifyContent: 'center' }}>
            {imageList.map((file) => (
                <div
                    key={file.Id}
                    style={{ position: 'relative', cursor: 'pointer' }}
                    onClick={() => toggleSelectImage(file.Id)}
                    onMouseEnter={(e) => {e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.5)';}}
                    onMouseLeave={(e) => {e.currentTarget.style.boxShadow = '';}}
                >
                  
                    <Image
                        src={file.FilePath}
                        width={150}
                        preview={false}
                        style={{
                            border: selectedImages.has(file.Id) ? '4px solid red' : 'none',
                            transition: '0.2s ease-in-out',
                        }}
                    />
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

        

        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-start'}}>
        <Button color="default" variant="text" size={"default"} icon={<CloseOutlined/>}
          onClick={(e) => {
            setEditOpen(false);
            setPopupFormOpen(false);
          }}/>
          
        </div>
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

        {imageEdit ? (
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '10%', margin:'auto'}}>

          <Image
            src={imageEdit.FilePath}
            width={200}
            preview={false}
            style={{ marginRight: "20px" }}
          />

          <Form
          form={form}
          name="file_md_edits"
          autoComplete="off"
          onFinish={handleSubmitForm}
          >
          <div class='column'>
            <h5 style={{ marginTop: "5%", marginBottom: "5%" }}>Tags:</h5>
            {(imageEdit.Metadata).map((md, index) => (

              <Form.Item
              key={index}  // Unique key for each item
              style={{ marginBottom: "5px", marginRight: "10px" }}
              name={index}
            >
              <Input/>
            </Form.Item>))}
            
          </div>

          <Button type="primary" onClick={handleSubmitForm} style={{marginTop:'10%', float: 'right'}}>Submit</Button>
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