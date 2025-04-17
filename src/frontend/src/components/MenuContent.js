import React, { useState, useEffect } from 'react';
import {
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Button
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BackupTableIcon from '@mui/icons-material/BackupTable';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PostAddIcon from '@mui/icons-material/PostAdd';
import SecurityIcon from '@mui/icons-material/Security';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';

import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


var userPages = [
  { text: 'Dashboard', url: 'dashboard', icon: <HomeRoundedIcon /> },
  { text: 'Project Directory', url: 'projectDirectory', icon: <BackupTableIcon /> },
  { text: 'Upload Files', url: 'uploadFiles', icon: <CloudUploadIcon /> },
  { text: 'Activity Log', url: 'activityLog', icon: <AssignmentRoundedIcon /> },
];

var adminPages = [
  { text: 'Dashboard', url: 'dashboard', icon: <HomeRoundedIcon /> },
  { text: 'Project Management', url: 'projectManagement', icon: <FolderIcon /> },
  { text: 'User Management', url: 'userManagement', icon: <ManageAccountsIcon /> },
  { text: 'Metadata Management', url: 'metadataManagement', icon: <PostAddIcon /> },
  { text: 'File Metadata Management', url: 'fileManagement', icon: <FormatListBulletedIcon /> },
  { text: 'Project Security', url: 'projectSecurity', icon: <SecurityIcon /> },
];


// TODO: put this in utils?
const GetDirectoryPrefix = (isAdmin) => (isAdmin ? '/admin/' : '/user/');


export default function MenuContent({setLoggedIn}) {
  const { isAdmin, logout } = useAuth();
  const menuItems = isAdmin & (!sessionStorage.getItem('adminUser') || sessionStorage.getItem('adminUser') === "false") ? adminPages : userPages;
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (sessionStorage.getItem('menu') === null) {
      sessionStorage.setItem('menu', 0);
    }

    if (sessionStorage.getItem('adminUser') === null) {
      sessionStorage.setItem('adminUser', "false");
    }
  }, []);

  const handleLogout = () => {
    logout();
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
                navigate(GetDirectoryPrefix(isAdmin & sessionStorage.getItem('adminUser') === "false") + item.url)
              }}
            >
              <ListItemIcon sx={{ color: 'white' }} >{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: 'white' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <List dense>
        {isAdmin && 
            (<ListItem key={1} disablePadding sx={{ display: 'block' }}>
              <ListItemButton onClick={() => {
                console.log(sessionStorage.getItem('adminUser'));
                sessionStorage.setItem('adminUser', sessionStorage.getItem('adminUser') === "true" ? "false" : "true");
                console.log(sessionStorage.getItem('adminUser'));
                sessionStorage.setItem('menu', 0);
                navigate(GetDirectoryPrefix(isAdmin & sessionStorage.getItem('adminUser') === "false") + 'dashboard')
              }}>
                <ListItemIcon sx={{ color: 'white' }}>{sessionStorage.getItem('adminUser') === "true" ? <SupervisedUserCircleIcon /> : <AccountCircleIcon />}</ListItemIcon>
                <ListItemText primary={sessionStorage.getItem('adminUser') === "true" ? 'Admin Operations' : 'User Operations'} sx={{ color: 'white' }} />
              </ListItemButton>
            </ListItem>)
        }
            <ListItem key={0} disablePadding sx={{ display: 'block' }}>
              <ListItemButton onClick={() => setOpen(true)}>
                <ListItemIcon sx={{ color: 'white' }}>{<PeopleRoundedIcon />}</ListItemIcon>
                <ListItemText primary={'Logout'} sx={{ color: 'white' }} />
              </ListItemButton>
            </ListItem>

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
