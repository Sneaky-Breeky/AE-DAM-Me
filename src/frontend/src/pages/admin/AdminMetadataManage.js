import React, { useState, useEffect  } from 'react';
import Box from '@mui/material/Box';
import { Typography, Button, Input, Form, Space, DatePicker } from 'antd';
import { SearchOutlined, CloseOutlined, MinusCircleOutlined, PlusOutlined, CalendarOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import { projects } from '../../utils/dummyData.js';

const { Title } = Typography;

export default function AdminMetadataManage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPopupFormOpen, setPopupFormOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [project, setProject] = useState(null);

  const [form] = Form.useForm();

  useEffect(() => {
    if (project && project.fields) {  // check if project is null before running?
      const convertedFields = project.fields.map(fieldObj => ({
        field: fieldObj.field,
        fieldMD: fieldObj.fieldMD
      }));
      form.setFieldsValue({name: project.name, 
        location: project.location, 
        date: project.date, 
        status: project.status, 
        phase: project.phase, 
        fields: convertedFields });
    }
  }, [project, isEditOpen]); // runs when project or isEditOpen changes

  const handleMDEdits = (values) => {
    console.log("input values: ", values);
    // filter out empty fields
    console.log("filtered fields values: ", (values.fields).filter((f) => f.field));
    console.log("null name: ", !values.name ); // if name is empty, returns true
    form.resetFields();
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
          onFinish={handleMDEdits}
          style={{margin: '10px auto'}}
          onKeyDown={(e) => {
              if (e.key === "Enter") {
                  e.preventDefault();
              }
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
                  
                  <MinusCircleOutlined style={{ marginBottom: "5px", marginRight: "20px" }}onClick={() => remove(name)} />
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
          (<Button htmlType="submit" type="primary" size={"default"}
            onClick={() => {
              form.validateFields()
              form.submit();
              setPopupFormOpen(false);
            }}>Submit</Button>)
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