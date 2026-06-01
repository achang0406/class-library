import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { TeacherRoute } from './components/layout/TeacherRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import BookDetailPage from './pages/BookDetailPage.jsx';
import KioskPage from './pages/KioskPage.jsx';
import TeacherLoginPage from './pages/teacher/TeacherLoginPage.jsx';
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage.jsx';
import TeacherAddPage from './pages/teacher/TeacherAddPage.jsx';
import TeacherLabelsPage from './pages/teacher/TeacherLabelsPage.jsx';
import TeacherLabelsPrintPage from './pages/teacher/TeacherLabelsPrintPage.jsx';
import TeacherLabelsVerifyPage from './pages/teacher/TeacherLabelsVerifyPage.jsx';
import TeacherPeoplePage from './pages/teacher/TeacherPeoplePage.jsx';
import TeacherOverduePage from './pages/teacher/TeacherOverduePage.jsx';
import TeacherStudentPage from './pages/teacher/TeacherStudentPage.jsx';
import TeacherClassReadingPage from './pages/teacher/TeacherClassReadingPage.jsx';
import TeacherImportPage from './pages/teacher/TeacherImportPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<AppShell title="Browse Library" backTo="/" />}>
          <Route index element={<BrowsePage />} />
        </Route>
        <Route path="/books/:id" element={<AppShell title="Book Detail" backTo="/browse" />}>
          <Route index element={<BookDetailPage />} />
        </Route>
        <Route
          path="/kiosk"
          element={<AppShell title="Check Out / Return" backTo="/" showHeader={false} />}
        >
          <Route index element={<KioskPage />} />
        </Route>
        <Route path="/teacher" element={<TeacherLoginPage />} />
        <Route element={<TeacherRoute />}>
          <Route path="/teacher/dashboard" element={<AppShell title="Dashboard" backTo="/" />}>
            <Route index element={<TeacherDashboardPage />} />
          </Route>
          <Route
            path="/teacher/add"
            element={<AppShell title="Add Book" backTo="/teacher/dashboard" />}
          >
            <Route index element={<TeacherAddPage />} />
          </Route>
          <Route path="/teacher/labels/print" element={<TeacherLabelsPrintPage />} />
          <Route
            path="/teacher/labels/verify"
            element={<AppShell title="Validate Labels" backTo="/teacher/dashboard" />}
          >
            <Route index element={<TeacherLabelsVerifyPage />} />
          </Route>
          <Route
            path="/teacher/labels"
            element={<AppShell title="Print Labels" backTo="/teacher/dashboard" />}
          >
            <Route index element={<TeacherLabelsPage />} />
          </Route>
          <Route
            path="/teacher/people"
            element={<AppShell title="Manage People" backTo="/teacher/dashboard" />}
          >
            <Route index element={<TeacherPeoplePage />} />
          </Route>
          <Route
            path="/teacher/overdue"
            element={<AppShell title="Overdue" backTo="/teacher/dashboard" />}
          >
            <Route index element={<TeacherOverduePage />} />
          </Route>
          <Route
            path="/teacher/reading"
            element={<AppShell title="Class Reading" backTo="/teacher/dashboard" />}
          >
            <Route index element={<TeacherClassReadingPage />} />
          </Route>
          <Route
            path="/teacher/students/:id"
            element={<AppShell title="Student Profile" backTo="/teacher/people" />}
          >
            <Route index element={<TeacherStudentPage />} />
          </Route>
          <Route
            path="/teacher/import"
            element={<AppShell title="Import CSV" backTo="/teacher/dashboard" />}
          >
            <Route index element={<TeacherImportPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
