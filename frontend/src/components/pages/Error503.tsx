// frontend/src/pages/Error503.tsx
import ErrorPage from '../../components/ErrorPage'

export default function Error503() {
  return (
    <ErrorPage
      code={503}
      title="Layanan Tidak Tersedia"
      description="Maaf, layanan sedang dalam pemeliharaan atau mengalami gangguan sementara."
      suggestion="Silakan coba beberapa saat lagi. Jika masalah berlanjut, hubungi administrator."
    />
  )
}