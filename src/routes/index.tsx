import { createBrowserRouter } from "react-router-dom";

// Import pages
import { Landing } from "../pages/Landing";
import { Talk } from "../pages/Talk";
import { Dashboard } from "../pages/Dashboard";
import { Profile } from "../pages/Profile";
import { History } from "../pages/History";
import ErrorPage from "../pages/Error";
import Register from "../pages/Register";
import Login from "../pages/Login";
import ProtectedRoute from "./ProtectedRoutes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/talk",
    element: (
      <ProtectedRoute>
        <Talk />
      </ProtectedRoute>
    ),
  },
  {
    path: "/talk/:agentId?",
    element: (
      <ProtectedRoute>
        <Talk />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile/:agentId?",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/history",
    element: (
      <ProtectedRoute>
        <History />
      </ProtectedRoute>
    ),
  },
  {
    path: "/*",
    element: <ErrorPage />,
  },
]);
