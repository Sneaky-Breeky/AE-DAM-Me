import * as React from 'react';
import { styled } from '@mui/material/styles';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuContent from './MenuContent';

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

const content = (setLoggedIn) => (
  <>
  <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '20px',
          paddingBottom: '40px',
        }}
      >
        <img
          src={`${process.env.PUBLIC_URL}/images/AE_logo.png`}
          alt="AE Logo"
          style={{
            width: '150px',
            height: 'auto',
            display: 'block',
          }}
        />
      </Box>
      <Divider />
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MenuContent setLoggedIn={setLoggedIn} />
      </Box>
      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
      </Stack>
      </>
);

export default function SideMenu({setLoggedIn}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  return (
    <>
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', sm: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: '#2c2c2c',
        },
      }}
      open
      ModalProps={{
        keepMounted: true,
      }}
    >
      {content(setLoggedIn)}
    </Drawer>

    {/* mobile drawer */}
    <Button onClick={handleDrawerToggle} variant="contained" color="inherit" sx={{
        display: { xs: 'block', sm: 'none', m: 0, p: 0, minWidth:'5%' },
        margin: '0',
        padding: '0',
        size: 'sm',  
        color:'white',
        height:'100%'
      }}
      
      style={{borderRadius: 1, position:'fixed'}}
      ><span style={{writingMode: 'vertical-rl', margin: '0', padding: '0'}}>Open Menu</span></Button>


    <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
      sx={{
        display: { xs: 'block', sm: 'none' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: '#2c2c2c',
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {content(setLoggedIn)}
    </Drawer>
    </>
  );
}
