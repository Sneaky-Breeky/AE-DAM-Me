import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Typography, Button, Popover, Radio, Form, Input, Checkbox, Spin } from 'antd';
import { SearchOutlined, EditOutlined, CloseOutlined} from '@ant-design/icons';
import { projects, files, users } from '../../utils/dummyData.js';
import { fetchProjects, fetchUsersForProject } from '../../api/projectApi';

const { Title } = Typography;

/*const projects = [
  {name: 'Bridge Construction', accessLevel: 'Admins Only', metadata: ['Project Name', 'Location', 'Date', 'Image Description', 'Tags'], status: 'Active', listUsers: []},
  {name: 'High-Rise Development', accessLevel: 'Everyone', metadata: ['Project Name', 'Location', 'Date', 'Tags'], status: 'Active', listUsers: []},
  {name: 'Highway Expansion', accessLevel: 'Selected Users', metadata: ['Project Name', 'Location', 'Date'], status: 'Inactive', listUsers: ['John Doe', 'Sarah Brown']}
]; */

/*
const users = [
  {name: 'John Doe', role: 'User', status: 'Active'},
  {name: 'Sarah Brown', role: 'Admin', status: 'Active'},
  {name: 'Michael Johnson', role: 'User', status: 'Inactive'}
];*/

const metadata = ["Project Name", "Location", "Date", "Image Description", "Tags"];

function PopupAccess(adminChecked, setAdminChecked, allChecked, setAllChecked, selectedChecked, setSelectedChecked, listUsers, setListUsers) {
  /*const [adminChecked, setAdminChecked] = useState(project.accessLevel === 'Admins Only');
  const [allChecked, setAllChecked] = useState(project.accessLevel === 'Everyone');
  const [selectedChecked, setSelectedChecked] = useState(project.accessLevel === 'Selected Users');
  const [listUsers, setListUsers] = useState(project.listUsers || []); */

  const onChange = (e) => {
    // change access level here
    console.log(`checked = ${e.target.checked}`);
  };

  const toggleAdminChecked = () => {
    setAdminChecked(!adminChecked);
    setAllChecked(false);
    setSelectedChecked(false);
    setListUsers([]);
  };

  const toggleAllChecked = () => {
    setAllChecked(!allChecked);
    setAdminChecked(false);
    setSelectedChecked(false);
    setListUsers([]);
  };

  const toggleUserChecked = (e, userName) => {
    const updatedUsers = e.target.checked ? 
      [...listUsers, userName]
      : listUsers.filter((name) => name !== userName);
    
    setSelectedChecked(!selectedChecked);
    setAdminChecked(false);
    setAllChecked(false);

    setListUsers(updatedUsers);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
    <table style={{width: '100%', borderCollapse: 'collapse'}}>
      <tr style={{height: '50px'}}>
        <td style={{ fontSize: '12px', textAlign: 'left', borderBottom:'1px solid black'}} >
          <Checkbox checked={adminChecked}
            onChange={toggleAdminChecked}>
              Admins Only
          </Checkbox>
          </td>
      </tr>
      <tr style={{height: '50px'}}>
        <td style={{ fontSize: '12px', textAlign: 'left', borderBottom:'1px solid black'}} >
          <Checkbox checked={allChecked && !adminChecked} 
          onChange={
            toggleAllChecked}>
            Everyone
        </Checkbox>
          </td>
      </tr>
      {users.map((user) => (
        <tr style={{height: '50px'}}>
          <td style={{ fontSize: '12px', textAlign: 'left', borderBottom:'1px solid black'}} >
            <Checkbox checked={listUsers.includes(user.name) && !allChecked && !adminChecked} 
              onChange={(e) => toggleUserChecked(e, user.name)}>
                {user.name}
            </Checkbox>
            </td>
        </tr>
      ))}
    </table>
    </div>
  );
}

function popupForm(project, setPopupFormOpen, adminChecked, setAdminChecked, allChecked, setAllChecked, selectedChecked, setSelectedChecked, listUsers, setListUsers) {

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'left',
        width: '80%',
        height: '100%',
        margin: '20px auto',
        marginTop: '0',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        padding: '20px',
        paddingTop: '0',
        paddingBottom: '10',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'auto'
      }}
    >
    <div style={{overflowY: 'auto', width: '100%', height: '100%'}}>
    <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <tr>
            <th colspan="2" style={{height: '40px', textAlign: 'center', borderBottom:'1px solid black', padding: '0px'}} >
              <h4>Edit {project.name} Project's Metadata Viewing</h4></th>
        </tr>
        <tr style={{height: '50px'}}>
            <td style={{ fontSize: '12px', width: '20%', textAlign: 'left', borderBottom:'1px solid black'}} >Access Level: </td>
            <td style={{ fontSize: '12px', width: '5%', textAlign: 'center', borderBottom:'1px solid black'}} >{
              // reload if status input differs from original user.status
              // popup breaks
               <Popover
                content={PopupAccess(adminChecked, setAdminChecked, 
                  allChecked, setAllChecked, 
                  selectedChecked, setSelectedChecked, 
                  listUsers, setListUsers)}

                trigger="click"
              >
              <Button color="default" variant="text" size={"default"} icon={<EditOutlined />}/>   
              </Popover>  
                
              }</td>
          </tr>
        {metadata.map((md) => (
          <tr style={{height: '50px'}}>
            <td style={{ fontSize: '12px', textAlign: 'left', borderBottom:'1px solid black'}} >{md}</td>
            <td style={{ fontSize: '12px', width: '5%', textAlign: 'center', borderBottom:'1px solid black'}} >{
              // reload if status input differs from original user.status
              <Popover
              content={
                <Radio.Group style={{ display: 'flex', flexDirection: 'column', marginTop: "0px" }}>
                  <Radio value="admin"> <p style={{fontSize:'12px', margin: '0px'}}>Admin Only</p> </Radio>
                  <Radio value="everyone"> <p style={{fontSize:'12px', margin: '0px'}}>Everyone</p> </Radio>
                </Radio.Group>}
                trigger="click"
              >
              <Button color="default" variant="text" size={"default"} icon={<EditOutlined />}/>   
              </Popover>          
              }</td>
          </tr>
        ))}
    </table>
    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', margin: '20px auto', marginBottom: '0'}}>
        <Button color="default" variant="text" size={"default"} icon={<CloseOutlined/>}
          onClick={(e) => {
            e.stopPropagation();
            setPopupFormOpen(false);
          }}/>
        <Button type="primary" size={"default"}
          onClick={(e) => {
            e.stopPropagation();
            setPopupFormOpen(false);

          }}>Submit</Button>
      </div>
    
    </div>
    
  </Box>
  );
}

export default function AdminProjectSecurity() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPopupFormOpen, setPopupFormOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [fetchedProjects, setFetchedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminChecked, setAdminChecked] = useState(false);
  const [allChecked, setAllChecked] = useState(false);
  const [selectedChecked, setSelectedChecked] = useState(false);
  const [listUsers, setListUsers] = useState([]);

    // Fetch projects
    useEffect(() => {
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

        getProjects();
    }, []);
    
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
          marginBottom: '0',
        }}
      >
        <Title level={1}>Project Security</Title>
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
    marginTop: '0',
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
      width: '50%',
      margin: '20px auto',
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
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'left',
        width: '100%',
        height: '100%',
        margin: '20px auto',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'auto',
      }}
    >

        {loading ? (
            <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }} />
        ) : (
            <div style={{ overflowY: 'auto', width: '100%', height: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: '10px' }}>
                    <tr style={{ height: '50px' }}>
                        <th style={{ width: '25%', textAlign: 'left', borderBottom: '1px solid black' }}>Project</th>
                        <th colSpan="2" style={{ width: '15%', textAlign: 'left', borderBottom: '1px solid black' }}>Access Level</th>
                    </tr>
                    {fetchedProjects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
                        <tr key={p.id}
                            onClick={() => {
                                setProject(p);
                                setPopupFormOpen(true);
                            }}
                            style={{ height: '50px', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fcfcfc'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}>
                            <td style={{ fontSize: '12px', width: '40%', textAlign: 'left', borderBottom: '1px solid black' }}>{p.name}</td>
                            <td style={{ fontSize: '12px', width: '30%', textAlign: 'left', borderBottom: '1px solid black' }}>{p.accessLevel}</td>
                            <td style={{ fontSize: '12px', width: '5%', textAlign: 'left', borderBottom: '1px solid black' }}></td>
                        </tr>
                                
                    ))}
                </table>
            </div>
        )}
  </Box>

  
  </Box>

  {/* right container with new users */}
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '40%',
      padding: '20px',
      paddingBottom: '10',
      paddingTop: '0'
    }}
  >
    {isPopupFormOpen && popupForm(project, setPopupFormOpen, adminChecked, setAdminChecked, allChecked, setAllChecked, selectedChecked, setSelectedChecked, listUsers, setListUsers)}

  </Box>
</Box>

    </Box>
  );
}