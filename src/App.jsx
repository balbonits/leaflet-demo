import { useState } from 'react'
import Map from './components/Map';

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Map</h1>
      <div style={{
        width: '50vw',
        height: '400px',
        position: 'relative'
      }}>
        <Map />
      </div>
    </>
  )
}

export default App
