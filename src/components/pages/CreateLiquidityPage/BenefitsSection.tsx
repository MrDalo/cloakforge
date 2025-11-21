export function BenefitsSection() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">Low Cost</h3>
        <p className="text-sm text-muted-foreground">Optimized for minimal rent costs (~0.3 SOL vs ~3 SOL).</p>
      </div>
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">Secure</h3>
        <p className="text-sm text-muted-foreground">100% client-side signing. We never touch your private keys.</p>
      </div>
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">Fast</h3>
        <p className="text-sm text-muted-foreground">Automated process handles all complex steps for you.</p>
      </div>
    </div>
  )
}
