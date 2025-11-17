import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login.jsx';
import RegisterV2 from './components/RegisterV2.jsx';
import EmailVerification from './components/EmailVerification.jsx';
import FormFilling from './components/FormFilling.jsx';
import MembershipRequest from './components/MembershipRequest.jsx';
import Profile from './components/Profile.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Header from './components/Header.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <>
      <Header />
      <Login />
    </>
  },
  {
    path: "/register",
    element:
    <>
      <Header />
      <RegisterV2 />
    </>
  },
  {
    path: "/verify-email",
    element: <>
      <Header />
      <EmailVerification />
    </>
  },
  {
    path: "/form",
    element: (
      <>
        <Header />
        <ProtectedRoute>
          <FormFilling />
        </ProtectedRoute>
      </>
    )
  },
  {
    path: "/membership-request",
    element: (
      <>
        <Header />
        <ProtectedRoute>
          <MembershipRequest />
        </ProtectedRoute>
      </>
    )
  },
  {
    path: "/profile",
    element: (
      <>
        <Header />
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </>
    )
  }
]);

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App;