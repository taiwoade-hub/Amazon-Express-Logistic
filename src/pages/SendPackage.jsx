import ShipmentForm from '../components/ShipmentForm'

function SendPackage() {
  return (
    <main className="min-h-screen py-12 px-6 max-w-4xl mx-auto bg-background">
      <ShipmentForm
        title="Send a Package"
        description="Fill in the details below to create a new delivery request."
      />
    </main>
  )
}

export default SendPackage
