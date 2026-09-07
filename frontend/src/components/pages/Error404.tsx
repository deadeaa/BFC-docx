// frontend/src/pages/Error404.tsx
import ErrorPage from '../../components/ErrorPage'

export default function Error404() {
  return (
    <ErrorPage
      code={404}
      title="Halaman Tidak Ditemukan"
      description="Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan."
      suggestion="Periksa kembali URL yang Anda masukkan, atau gunakan navigasi di atas."
    />
  )
}