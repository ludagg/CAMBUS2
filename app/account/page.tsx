import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AccountPage from '@/components/AccountPage'

export const metadata = {
  title: 'Mon compte — Easy Travel',
  description:
    'Gérez vos informations personnelles, changez votre mot de passe ou supprimez votre compte Easy Travel.',
}

export default function Page() {
  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1">
        <AccountPage />
      </main>
      <Footer />
    </div>
  )
}
