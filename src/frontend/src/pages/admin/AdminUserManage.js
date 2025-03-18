import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Typography, Button, Popover, Radio, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import { users } from '../../utils/dummyData.js';
import { fetchUsers, addUser, deleteUser } from '../../api/authApi.js';

const { Title } = Typography;



function PopupForm({ visible, onClose, refreshUsers }) {
  const [form] = Form.useForm();
  const handleSubmit = async (values) => {
    try {
      await addUser(values);
      message.success("User added successfully!");
      form.resetFields();
      refreshUsers();
      onClose();
    } catch (error) {
      console.error("Error adding user:", error);
      message.error("Error adding user:", error);
    }
  };

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
        form={form}
        name="addUserForm"
        layout="vertical"
        initialValues={{
          remember: true,
        }}
        size='small'
        autoComplete="off"
        onFinish={handleSubmit}
      >
        {/* first name */}
        <Form.Item
          label={<p style={{ fontSize: '12px', margin: '0px' }}>First Name</p>}
          name="firstname"
          rules={[
            {
              required: true,
              message: <p style={{ fontSize: '12px', margin: '0px' }}>Please input the new user's first name!</p>,
            },
          ]}
          style={{ padding: "0px", marginBottom: "5px", marginTop: "0px" }}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={<p style={{ fontSize: '12px', margin: '0px' }}>Last Name</p>}
          name="lastname"
          rules={[
            {
              required: true,
              message: <p style={{ fontSize: '12px', margin: '0px' }}>Please input the new user's last name!</p>,
            },
          ]}
          style={{ padding: "0px", marginBottom: "5px", marginTop: "0px" }}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={<p style={{ fontSize: '12px', margin: '0px' }}>User Email</p>}
          name="email"
          rules={[
            {
              required: true,
              message: <p style={{ fontSize: '12px', margin: '0px' }}>Please select the new user's email!</p>,
            },
          ]}
          style={{ marginBottom: "5px" }}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={<p style={{ fontSize: '12px', margin: '0px' }}>User Password</p>}
          name="password"
          rules={[
            {
              required: true,
              message: <p style={{ fontSize: '12px', margin: '0px' }}>Please input the new user's password!</p>,
            },
          ]}
          style={{ marginBottom: "5px" }}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={<p style={{ fontSize: '12px', margin: '0px' }}>User Role</p>}
          name="role"
          rules={[
            {
              required: true,
              message: <p style={{ fontSize: '12px', margin: '0px' }}>Please select the new user's role!</p>,
            },
          ]}
          style={{ marginBottom: "5px" }}
        >
          <Radio.Group style={{ marginTop: "0px" }}>
            <Radio value="user"> <p style={{ fontSize: '12px', margin: '0px' }}>User</p> </Radio>
            <Radio value="admin"> <p style={{ fontSize: '12px', margin: '0px' }}>Admin</p> </Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label={<p style={{ fontSize: '12px', margin: '0px' }}>User Status</p>}
          name="status"
          rules={[
            {
              required: true,
              message: <p style={{ fontSize: '12px', margin: '0px' }}>Please select the new user's status!</p>,
            },
          ]}
          style={{ marginBottom: "10px" }}
        >
          <Radio.Group style={{ marginTop: "0px" }}>
            <Radio value="active"> <p style={{ fontSize: '12px', margin: '0px' }}>Active</p> </Radio>
            <Radio value="inactive"> <p style={{ fontSize: '12px', margin: '0px' }}>Inactive</p> </Radio>
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
  const [userList, setUserList] = useState([]);

  const fetchUsersList = async () => {
    try {
      const users = await fetchUsers();
      if (Array.isArray(users)) {
        setUserList(users);
      } else {
        console.error("Expected an array but got:", users);
        setUserList([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUserList([]);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  const save = () => {
    message.success("Changes saved successfully!");
  };

  const handleDeleteUser = async (email) => {
    try {
      await deleteUser(email);
      message.success("User deleted successfully!");
      fetchUsersList();  // Refresh user list after deletion
    } catch (error) {
      message.error("Failed to delete user");
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
          <div style={{ overflowY: 'auto', width: '100%', height: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ height: '50px' }}>
                  <th style={{ width: '25%', textAlign: 'left', borderBottom: '1px solid black' }}>Name</th>
                  <th style={{ width: '30%', textAlign: 'left', borderBottom: '1px solid black' }}>Email</th>
                  <th style={{ width: '10%', textAlign: 'left', borderBottom: '1px solid black' }}>Role</th>
                  <th colSpan="2" style={{ width: '15%', textAlign: 'left', borderBottom: '1px solid black' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user, idx) => (
                  <tr key={user.email || idx} style={{ height: '50px' }}>
                    <td style={{ fontSize: '12px', borderBottom: '1px solid black' }}>{user.name}</td>
                    <td style={{ fontSize: '12px', borderBottom: '1px solid black' }}>{user.email}</td>
                    <td style={{ fontSize: '12px', borderBottom: '1px solid black' }}>{user.role}</td>
                    <td style={{ fontSize: '12px', borderBottom: '1px solid black' }}>{user.status}</td>
                    <td style={{ fontSize: '12px', borderBottom: '1px solid black' }}>
                      <Popover
                        content={
                          <div>
                            {/* Activate/Deactivate */}
                            <Radio.Group
                              defaultValue={user.status === 'Active' ? '1' : '2'}
                              onChange={(e) => console.log('Status changed:', e.target.value)}
                            >
                              <Radio value="1">Activate</Radio>
                              <Radio value="2">Deactivate</Radio>
                            </Radio.Group>

                            {/* Delete Button inside Popover */}
                            <Button
                              type="primary"
                              danger
                              style={{ marginTop: '10px', width: '100%' }}
                              onClick={() => handleDeleteUser(user.email)}
                            >
                              Delete User
                            </Button>
                          </div>
                        }
                        title={user.status === 'Active' ? "User Activated" : "User Deactivated"}
                        trigger="click"
                      >
                        <Button color="default" variant="text" icon={<EditOutlined />} />
                      </Popover>
                    </td>
                    {/* <td style={{ fontSize: '12px', borderBottom: '1px solid black' }}>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'right',
            width: '100%',
            margin: '20px auto',
          }}>
            <Button type="primary" htmlType="submit" onClick={save}>
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
            onClick={() => { setPopupFormOpen(isPopupFormOpen ? false : true) }
            }
            sx={{
              textAlign: 'center',
              width: 150,
              height: 80,
              border: 1,
              borderRadius: '16px',
              '&:hover': { boxShadow: 3 },
            }}
          >
            {isPopupFormOpen ?
              <CloseOutlined style={{ marginTop: '10px', fontSize: '30px' }} />
              : <PlusOutlined style={{ marginTop: '10px', fontSize: '30px' }} />}
            {isPopupFormOpen ?
              <h5 style={{ margin: '15px' }}>Close</h5>
              : <h5 style={{ margin: '15px' }}>Add User</h5>}
          </Box>

          {/* {isPopupFormOpen && <PopupForm />} */}
          {isPopupFormOpen && <PopupForm visible={isPopupFormOpen} onClose={() => setPopupFormOpen(false)} refreshUsers={fetchUsersList} />}

        </Box>
      </Box>

    </Box >
  );
}