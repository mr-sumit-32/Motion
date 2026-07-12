import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PagePlaceholder from './components/PagePlaceholder';
import Login from './pages/Login';
import TaskTable from './components/TaskTable';
import DocumentEditor from './components/DocumentEditor';
import NoticeBoard from './components/NoticeBoard';
import DocumentHub from './components/DocumentHub';
import HomeDashboard from './components/HomeDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              {/* FIXED: Replaced PagePlaceholder with HomeDashboard */}
              <Route index element={<HomeDashboard />} />
              
              <Route path="notifications" element={<PagePlaceholder title="Notifications" />} />
              
              <Route path="private-tasks" element={<TaskTable />} />
              <Route path="tasks" element={<TaskTable />} />
              <Route path="by-status" element={<TaskTable />} />
              <Route path="tracker/:department" element={<TaskTable />} />
              <Route path="notice-board" element={<NoticeBoard />} />
              <Route path="document-hub" element={<DocumentHub />} />
              
              <Route path="page/:pageId" element={<DocumentEditor />} />
              <Route path="*" element={<PagePlaceholder title="404 Not Found" />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;