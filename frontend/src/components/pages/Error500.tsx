// frontend/src/pages/Error500.tsx
import ErrorPage from '../../components/ErrorPage'

export default function Error500() {
  return (
    <ErrorPage
      code={500}
      title="Terjadi Kesalahan Server"
      description="Maaf, terjadi kesalahan pada server. Tim kami telah diberitahu dan sedang memperbaikinya."
      suggestion="Coba refresh halaman ini, atau kembali lagi nanti."
      showRefresh={true}
    />
  )
}