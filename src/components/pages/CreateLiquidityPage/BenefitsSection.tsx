export const BenefitsSection = () => (
  <div className='grid gap-6 md:grid-cols-3'>
    <div className='bg-card rounded-lg border p-6'>
      <h3 className='mb-2 font-semibold'>Low Cost</h3>
      <p className='text-muted-foreground text-sm'>Optimized for minimal rent costs (~0.3 SOL vs ~3 SOL).</p>
    </div>
    <div className='bg-card rounded-lg border p-6'>
      <h3 className='mb-2 font-semibold'>Secure</h3>
      <p className='text-muted-foreground text-sm'>100% client-side signing. We never touch your private keys.</p>
    </div>
    <div className='bg-card rounded-lg border p-6'>
      <h3 className='mb-2 font-semibold'>Fast</h3>
      <p className='text-muted-foreground text-sm'>Automated process handles all complex steps for you.</p>
    </div>
  </div>
)
