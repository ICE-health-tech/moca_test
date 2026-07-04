import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DoctorSignupPage } from './features/auth/DoctorSignupPage'
import { LoginPage } from './features/auth/LoginPage'
import { AdminDashboardPage, AdminDoctorsPage } from './features/admin/AdminPages'
import {
  DoctorDashboardPage,
  DoctorPatientsPage,
} from './features/doctor/DoctorPages'
import { DoctorReviewPage } from './features/doctor/DoctorReviewPage'
import { PatientAppointmentsPage } from './features/patient/PatientAppointmentsPage'
import { PatientDoctorsPage } from './features/patient/PatientDoctorsPage'
import { PatientHomePage } from './features/patient/PatientHomePage'
import { PatientResultsPage } from './features/patient/PatientResultsPage'
import { PatientSettingsPage } from './features/patient/PatientSettingsPage'
import { PatientTestPage } from './features/patient/PatientTestPage'
import { PrivateRoute } from './shared/components/PrivateRoute'
import { LandingPage } from './features/patient/LandingPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<DoctorSignupPage />} />
        <Route path="/entry" element={<LandingPage/>}/>

        <Route element={<PrivateRoute roles={['PATIENT']} />}>
          <Route path="/patient" element={<PatientHomePage />} />
          <Route path="/patient/test" element={<PatientTestPage />} />
          <Route path="/patient/results" element={<PatientResultsPage />} />
          <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
          <Route path="/patient/doctors" element={<PatientDoctorsPage />} />
          <Route path="/patient/settings" element={<PatientSettingsPage />} />
        </Route>

        <Route element={<PrivateRoute roles={['DOCTOR']} />}>
          <Route path="/doctor" element={<DoctorDashboardPage />} />
          <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
          <Route path="/doctor/reviews/:id" element={<DoctorReviewPage />} />
        </Route>

        <Route element={<PrivateRoute roles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/entry" replace />} />
        <Route path="*" element={<Navigate to="/entry" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
