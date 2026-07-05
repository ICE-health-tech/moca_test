import { Mail, MapPin, Phone, Star } from 'lucide-react'
import { MocaPatientLayout } from '../../shared/components/layout/MocaPatientLayout'
import { QueryState } from '../../shared/components/QueryState'
import { useDoctorOptions, usePickClinician } from './usePatientQueries'

export function PatientDoctorsPage() {
  const { data: doctors = [], isLoading, error } = useDoctorOptions()
  const pickClinician = usePickClinician()

  return (
    <MocaPatientLayout title="Bác sĩ của tôi">
      <p className="mb-3 shrink-0 text-sm text-on-surface-variant">
        Chọn bác sĩ phụ trách theo dõi kết quả MoCA của bạn.
      </p>
      <QueryState isLoading={isLoading} error={error}>
        <div className="space-y-3">
          {doctors.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                  {d.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-on-surface">{d.name}</p>
                    {d.isCurrent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        <Star size={10} />
                        Đang phụ trách
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant">{d.specialty}</p>
                </div>
              </div>

              {/* Details */}
              <div className="mt-3 space-y-2 border-t border-outline-variant/50 pt-3 text-sm">
                {d.workplace && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <MapPin size={14} className="shrink-0" />
                    <span>{d.workplace}</span>
                  </div>
                )}
                {d.experience && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Star size={14} className="shrink-0" />
                    <span>Kinh nghiệm: {d.experience}</span>
                  </div>
                )}
                {d.phone && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Phone size={14} className="shrink-0" />
                    <span>{d.phone}</span>
                  </div>
                )}
                {d.email && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Mail size={14} className="shrink-0" />
                    <a
                      href={`mailto:${d.email}`}
                      className="!min-h-0 py-0 text-sm leading-none text-primary hover:underline break-all"
                    >
                      {d.email}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-outline-variant/50 pt-3">
                {d.isCurrent ? (
                  <p className="text-sm font-medium text-on-surface-variant">
                    Bác sĩ đang phụ trách bạn
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={pickClinician.isPending}
                    onClick={() => pickClinician.mutate(d.id)}
                    className="min-h-12 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
                  >
                    {pickClinician.isPending ? 'Đang chọn…' : 'Chọn bác sĩ này'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </MocaPatientLayout>
  )
}
