import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Announcements from "./pages/Announcements.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Profile from "./pages/Profile.jsx";
import ApplicationForm from "./pages/ApplicationForm.jsx";
import MyTasks from "./pages/MyTasks.jsx";
import InterviewerDashboard from "./pages/InterviewerDashboard.jsx";
import ManageAnnouncements from "./pages/ManageAnnouncements.jsx";
import CandidateList from "./pages/CandidateList.jsx";
import ManageTasks from "./pages/ManageTasks.jsx";
import UserDirectory from "./pages/UserDirectory.jsx";
import "./styles.css";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Announcements />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/directory"
          element={
            <ProtectedRoute>
              <UserDirectory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/application"
          element={
            <ProtectedRoute allowRoles={["interviewee"]}>
              <ApplicationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute allowRoles={["interviewee"]}>
              <MyTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviewer"
          element={
            <ProtectedRoute allowRoles={["interviewer"]}>
              <InterviewerDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="announcements" replace />} />
          <Route path="announcements" element={<ManageAnnouncements />} />
          <Route path="candidates" element={<CandidateList />} />
          <Route path="tasks" element={<ManageTasks />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
