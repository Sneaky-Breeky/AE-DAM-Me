import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Typography, Button, Popover, Radio, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, CloseOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
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
  const [editForm] = Form.useForm();
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

  const handleEditUser = (values) => {
    console.log("pass edited: " + values.editPass);
    console.log("status edited: " + values.editStatus);
  };

  // remove? or edit??
  const save = () => {
    message.success("Changes saved successfully!");
  };
  // REMOVE ABOVE

  const handleDeleteUser = async (email) => {
    try {
      await deleteUser(email);
      message.success("User deleted successfully!");
      fetchUsersList();  // Refresh user list after deletion
    } catch (error) {
      message.error("Failed to delete user");
    }
  };

  const formReset = (user) => {
    console.log(user);
    editForm.resetFields();
    editForm.setFieldsValue({
      editName: user.name,
      editEmail: user.email,
      editRole: user.role === 0 ? 'user' : 'admin',
      editStatus: user.status === 'Active' ? 'active' : 'deactive',
      editPass: user.password
    });
    
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
                    <td style={{ fontSize: '12px', borderBottom: '1px solid black' }}>{user.role == "0"? "User" : "Admin"}</td>
                    <td style={{ fontSize: '12px', borderBottom: '1px solid black' }}>{user.status}</td>
                    <td style={{ fontSize: '12px', borderBottom: '1px solid black' }}>
                      <Popover
                        placement="right"
                        content={
                          <Form
                            form={editForm}
                            name="editUserForm"
                            layout="vertical"
                            initialValues={{
                              remember: true,
                            }}
                            size='small'
                            autoComplete="off"
                            onFinish={handleEditUser}
                          >
                          <div>
                            {/* Edit First Name 
                            <Form.Item
                              label="Edit Name"
                              name="editName"
                              layout="horizontal"
                              >
                                <Input/>
                            </Form.Item>*/}

                             {/*Edit Email 
                            <Form.Item
                              label="Edit Email"
                              name="editEmail"
                              layout="horizontal"
                              >
                                <Input/>
                            </Form.Item> */}

                            {/* Edit Password */}
                            <Form.Item
                              label="Edit Password"
                              name="editPass"
                              layout="horizontal"
                              >
                                <Input/>
                            </Form.Item>

                            {/* User/Admin 
                            <Form.Item
                              label="Edit Role"
                              name="editRole"
                              layout="horizontal"
                              >
                            <Radio.Group
                              onChange={(e) => console.log('Role changed:', e.target.value)}
                            >
                              <Radio value="user">User</Radio>
                              <Radio value="admin">Admin</Radio>
                            </Radio.Group>
                            </Form.Item>*/}

                            {/* Activate/Deactivate */}
                            <Form.Item
                              label="Edit Status"
                              name="editStatus"
                              layout="horizontal"
                              >
                            <Radio.Group
                              onChange={(e) => console.log('Status changed:', e.target.value)}
                            >
                              <Radio value="active">Activate</Radio>
                              <Radio value="deactive">Deactivate</Radio>
                            </Radio.Group>
                            </Form.Item>

                            {/* Save edit user changes */}
                            <Form.Item
                              label={null}
                              style={{ marginBottom: "5px" }}>
                              <Button type="primary" htmlType="submit" style={{ marginTop: '10px', width: '100%' }}>
                                Save Changes
                              </Button>
                            </Form.Item >

                            {/* Delete popconfirm Button inside Popover */}

                            <Popconfirm
                              title="Delete User"
                              description="Are you sure you want to delete the selected user?"
                              onConfirm={() => handleDeleteUser(user.email)}
                              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                              okText="Yes"
                              cancelText="No"
                          >
                              <Button type="primary" danger style={{ marginTop: '10px', width: '100%' }} icon={<DeleteOutlined />}>
                                  Delete User
                              </Button>
                          </Popconfirm>
                          </div>
                          </Form>
                        }
                        //title={user.status === 'Active' ? "User Activated" : "User Deactivated"}
                        title={<h3 style={{marginTop:'0'}}>Edit User</h3>}
                        trigger="click"
                      >
                        <Button color="default" variant="text" icon={<EditOutlined />} onClick={() => formReset(user)}/>
                      </Popover>
                    </td>
                    {/* <td style={{ fontSize: '12px', borderBottom: '1px solid black' }}>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>

          </div>

          {/* REMOVE LATER 
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
           REMOVE ABOVE LATER */}


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