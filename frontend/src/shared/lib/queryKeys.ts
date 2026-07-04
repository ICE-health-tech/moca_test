export const queryKeys = {
  health: ['health'] as const,

  patient: {
    sessions: (patientId: string) =>
      ['patient', patientId, 'sessions'] as const,
    session: (patientId: string, sessionId: string) =>
      ['patient', patientId, 'sessions', sessionId] as const,
    appointments: (patientId: string) =>
      ['patient', patientId, 'appointments'] as const,
    clinicians: (patientId: string) =>
      ['patient', patientId, 'clinicians'] as const,
  },

  doctor: {
    reviews: (doctorId: string) => ['doctor', doctorId, 'reviews'] as const,
    patients: (doctorId: string) => ['doctor', doctorId, 'patients'] as const,
    review: (doctorId: string, sessionId: string) =>
      ['doctor', doctorId, 'reviews', sessionId] as const,
  },

  admin: {
    stats: ['admin', 'stats'] as const,
    clinicians: ['admin', 'clinicians'] as const,
  },
} as const
