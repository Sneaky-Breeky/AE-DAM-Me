import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/authApi';
import { useAuth } from '../contexts/AuthContext';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: '100vh',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
}));



export default function Login({ setLoggedIn }) {
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const userData = new FormData(event.currentTarget);
    const email = userData.get('email');
    const password = userData.get('password');

    setPasswordErrorMessage('');
    setEmailErrorMessage('');
    setPasswordError(false);
    setEmailError(false);

    try {
      const response = await loginUser(email, password);

      if (response.error) {
        if (response.error === "Invalid email or password") {
          setPasswordError(true);
          setPasswordErrorMessage("Incorrect email or password.");
        } else {
          setEmailError(true);
          setEmailErrorMessage(response.error || "Something went wrong.");
        }
        return;
      }

      login({
        id: response.id,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        role: response.role,
        status: response.status,
        favProjects: response.favProjects || []
      });

      setLoggedIn(true);

      const isAdmin = response.role === "admin"; // ✅ CHANGED: directly from response
      navigate(isAdmin ? "/admin/dashboard" : "/user/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      setEmailError(true);
      setEmailErrorMessage("Something went wrong. Please try again.");
    }
  };


  return (
    <SignInContainer direction="column" justifyContent="center">
      <CssBaseline />
      <Card variant="outlined">
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center' }}
        >
          Sign in
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}
        >
          <FormControl>
            <FormLabel htmlFor="email">Email</FormLabel>
            <TextField
              error={emailError}
              helperText={emailErrorMessage}
              id="email"
              type="email"
              name="email"
              placeholder="your@email.com"
              autoComplete="email"
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={emailError ? 'error' : 'primary'}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <TextField
              error={passwordError}
              helperText={passwordErrorMessage}
              name="password"
              placeholder="••••••"
              type="password"
              id="password"
              autoComplete="current-password"
              required
              fullWidth
              variant="outlined"
              color={passwordError ? 'error' : 'primary'}
            />
          </FormControl>
          <Button type="submit" fullWidth variant="contained" color="primary" style={{ marginTop: '16px' }}>
            Sign in
          </Button>
        </Box>
      </Card>
    </SignInContainer>
  );
}
