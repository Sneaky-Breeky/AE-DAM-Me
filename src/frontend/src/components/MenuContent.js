import React, { useState } from 'react';
import {
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Button
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BackupTableIcon from '@mui/icons-material/BackupTable';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PostAddIcon from '@mui/icons-material/PostAdd';
import SecurityIcon from '@mui/icons-material/Security';
import { isAdmin } from '../utils/auth';
import { useNavigate } from 'react-router-dom';


var userPages = [
  { text: 'Dashboard', url: 'dashboard', icon: <HomeRoundedIcon /> },
  { text: 'Project Directory', url: 'projectDirectory', icon: <BackupTableIcon /> },
  { text: 'Upload Files', url: 'uploadFiles', icon: <CloudUploadIcon /> },
  { text: 'Activity Log', url: 'activityLog', icon: <AssignmentRoundedIcon /> },
];

var adminPages = [
  { text: 'Dashboard', url: 'dashboard', icon: <HomeRoundedIcon /> },
  { text: 'Project Creation', url: 'projectCreation', icon: <CreateNewFolderIcon /> },
  { text: 'User Management', url: 'userManagement', icon: <ManageAccountsIcon /> },
  { text: 'Metadata Management', url: 'metadataManagement', icon: <PostAddIcon /> },
  { text: 'Project Security', url: 'projectSecurity', icon: <SecurityIcon /> },
];


const secondaryListItems = [
  { text: 'Logout', icon: <PeopleRoundedIcon /> }
];

// TODO: put this in utils?
const GetDirectoryPrefix = (isAdmin) => (isAdmin ? '/admin/' : '/user/');


export default function MenuContent({setLoggedIn}) {
  const menuItems = isAdmin() ? adminPages : userPages;
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("authToken");
    localStorage.setItem("loggedIn", "false");
    localStorage.removeItem("userRole");
    setLoggedIn(false);
    navigate("/login");
  };

  return (
    <>
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton selected={index === parseInt(sessionStorage.getItem('menu'))}
              onClick={() => {
                sessionStorage.setItem('menu', index);
                navigate(GetDirectoryPrefix(isAdmin()) + item.url)
              }}
            >
              <ListItemIcon sx={{ color: 'white' }} >{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: 'white' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
          {secondaryListItems.map((item, index) => (
            <ListItem key={index} disablePadding sx={{ display: 'block' }}>
              <ListItemButton onClick={() => setOpen(true)}>
                <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} sx={{ color: 'white' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
    </Stack>

    {/* Logout confirm popup */}
    <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogout} color="error" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
