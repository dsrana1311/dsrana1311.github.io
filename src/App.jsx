import PlayheadScene from './components/PlayheadScene.jsx'
import Contact from './components/Contact.jsx'
import BackgroundMusic from './components/BackgroundMusic.jsx'

export default function App() {
  return (
    <>
      <div className="grid-overlay" aria-hidden="true" />
      <BackgroundMusic />
      <PlayheadScene />
      <main>
        <Contact />
      </main>
    </>
  )
}
