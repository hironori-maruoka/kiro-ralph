import Grid from './components/Grid'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Excel Lite</h1>
        <Grid rows={20} cols={10} />
      </div>
    </div>
  )
}

export default App
