import { App as RoutedApp } from './app/App'
import { AuthSessionProvider } from './features/auth/session/AuthSessionProvider'

function App() {
  return (
    <AuthSessionProvider>
      <RoutedApp />
    </AuthSessionProvider>
  )
}

export default App
