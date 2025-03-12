import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Typography, Button, Popover, Radio, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, CloseOutlined} from '@ant-design/icons';
import { users } from '../../utils/dummyData.js';

const { Title } = Typography;



function popupForm() {  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'left',
        width: '80%',
        height: '70%',
        margin: '20px auto',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        padding: '20px',
        paddingTop: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'auto'
      }}
    >
      <Form
        name="basic"
        layout="vertical"
        initialValues={{
          remember: true,
        }}
        size='small'
        autoComplete="off"
      >

      <Form.Item
        label={<p style={{fontSize:'12px', margin: '0px'}}>User Name</p>}
        name="name"
        rules={[
          {
            required: true,
            message:<p style={{fontSize:'12px', margin: '0px'}}>Please select the new user's name!</p>,
          },
        ]}
        style={{ padding: "0px", marginBottom: "5px", marginTop: "0px"  }}
      >
        <Input/>
      </Form.Item>

      <Form.Item
        label={<p style={{fontSize:'12px', margin: '0px'}}>User Email</p>}
        name="email"
        rules={[
          {
            required: true,
            message:<p style={{fontSize:'12px', margin: '0px'}}>Please select the new user's email!</p>,
          },
        ]}
        style={{ marginBottom: "5px" }}
      >
        <Input/>
      </Form.Item>

        <Form.Item 
          label={<p style={{fontSize:'12px', margin: '0px'}}>User Role</p>}
          name="role"
          rules={[
            {
              required: true,
              message:<p style={{fontSize:'12px', margin: '0px'}}>Please select the new user's role!</p>,
            },
          ]}
          style={{ marginBottom: "5px" }}
        >
          <Radio.Group style={{ marginTop: "0px" }}>
            <Radio value="user"> <p style={{fontSize:'12px', margin: '0px'}}>User</p> </Radio>
            <Radio value="admin"> <p style={{fontSize:'12px', margin: '0px'}}>Admin</p> </Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item 
          label={<p style={{fontSize:'12px', margin: '0px'}}>User Status</p>}
          name="status"
          rules={[
            {
              required: true,
              message:<p style={{fontSize:'12px', margin: '0px'}}>Please select the new user's status!</p>,
            },
          ]}
          style={{ marginBottom: "10px" }}
        >
          <Radio.Group style={{ marginTop: "0px" }}>
            <Radio value="active"> <p style={{fontSize:'12px', margin: '0px'}}>Active</p> </Radio>
            <Radio value="inactive"> <p style={{fontSize:'12px', margin: '0px'}}>Inactive</p> </Radio>
          </Radio.Group>
        </Form.Item>

      <Form.Item 
        label={null}
        style={{ marginBottom: "5px" }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item >
    </Form>
  </Box>
  );
}

export default function AdminUserManage() {
  const [isPopupFormOpen, setPopupFormOpen] = useState(false);

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
        <Title level={1}>User Management</Title>
      </Box>
        

<Box
  sx={{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'left',
    height: '100vh',
    width: '80%',
    margin: '20px auto',
    borderRadius: '10px',

    overflow: 'auto',
  }}
>

  {/* left container with users */}
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'left',
      width: '60%',
      margin: '20px auto',
      backgroundColor: '#f5f5f5',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      overflow: 'auto',
    }}
  >
    <div style={{overflowY: 'auto', width: '100%', height: '100%'}}>
    <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: '10px'}}>
      <tr style={{height: '50px'}}>
          <th style={{ width: '25%', textAlign: 'left', borderBottom:'1px solid black'}} >Name</th>
          <th style={{ width: '30%', textAlign: 'left', borderBottom:'1px solid black'}} >Email</th>
          <th style={{ width: '10%', textAlign: 'left', borderBottom:'1px solid black'}} >Role</th>
          <th colSpan="2" style={{ width: '15%', textAlign: 'left', borderBottom:'1px solid black'}} >Status</th>
      </tr>
          {users.map((user) => (
              <tr style={{height: '50px'}}>
                  <td style={{ fontSize: '12px', width: '25%', textAlign: 'left', borderBottom:'1px solid black'}} >{user.name}</td>
                  <td style={{ fontSize: '12px', width: '30%', textAlign: 'left', borderBottom:'1px solid black'}} >{user.email}</td>
                  <td style={{ fontSize: '12px', width: '10%', textAlign: 'left', borderBottom:'1px solid black'}} >{user.role}</td>
                  <td style={{ fontSize: '12px', width: '10%', textAlign: 'left', borderBottom:'1px solid black'}} >{user.status}</td>
                  <td style={{ fontSize: '12px', width: '5%', textAlign: 'left', borderBottom:'1px solid black'}} >{
                    // reload if status input differs from original user.status
                    <Popover
                      content={(user.status==='Active') ? 
                        <Radio.Group defaultValue="1">
                        <Radio value="1">Activate</Radio>
                        <Radio value="2">Deactivate</Radio>
                        </Radio.Group>
                      : <Radio.Group defaultValue="2">
                        <Radio value="1">Activate</Radio>
                        <Radio value="2">Deactivate</Radio>
                        </Radio.Group> }
                      title={(user.status==='Active') ? "User Activated" : "User Deactivated"}
                      trigger="click"
                    >
                    <Button color="default" variant="text" size={"default"} icon={<EditOutlined />}/>   
                    </Popover>          
                    }</td>
              </tr>
          ))}
  </table>
  
  </div>
  <div style={{display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'right',
      width: '100%',
      margin: '20px auto',}}>
  <Button type="primary" htmlType="submit">
          Save
        </Button>
  </div>
  </Box>

  {/* right container with new users */}
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '30%',
      padding: '20px',

    }}
  >
    <Box
      onClick={() => 
        {setPopupFormOpen(isPopupFormOpen ? false : true)}
      }
      sx={{
        textAlign: 'center',
        width: 150,
        height: 80,
        border: 1,
        borderRadius: '16px',
        '&:hover': { boxShadow: 3},
        }}
      >
        {isPopupFormOpen ? 
        <CloseOutlined style={{ marginTop: '10px', fontSize: '30px'}}/>
        : <PlusOutlined style={{ marginTop: '10px', fontSize: '30px'}}/>}
        {isPopupFormOpen ? 
        <h5 style={{margin: '15px'}}>Close</h5>
        : <h5 style={{margin: '15px'}}>Add User</h5>}
    </Box>

    {isPopupFormOpen && popupForm()}

  </Box>
</Box>

    </Box>
  );
}