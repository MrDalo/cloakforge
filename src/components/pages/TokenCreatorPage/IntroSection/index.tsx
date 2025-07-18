import React from 'react'

const IntroSection = (): React.ReactNode => (
	<section className='mx-auto w-full max-w-(--breakpoint-md) px-4 pb-8 sm:pb-0'>
		<p>Use our cutting-edge tool to create tokens with ease:</p>
		<ul className='py-1'>
			<li>
				🏷️ <span className='text-primary/80 font-semibold'>Lowest fees on the market:</span> Save money while creating your token.
			</li>
			<li>
				🛠️ <span className='text-primary/80 font-semibold'>Seamless metadata integration:</span> Add token details like name, symbol, and
				logo easily.
			</li>
			<li>
				🔒 <span className='text-primary/80 font-semibold'>Advanced authority management:</span> Revoke freeze and mint authority with just
				a click.
			</li>
			<li>
				🛡️ <span className='text-primary/80 font-semibold'>Privacy-first approach:</span> No analytics or tracking—your activity remains
				anonymous.
			</li>
			<li>
				⚙️ <span className='text-primary/80 font-semibold'>Simulation mode:</span> Test the process or create tokens on devnet before going
				live.
			</li>
		</ul>
		Start now and bring your token vision to life in just a few clicks!
	</section>
)

export default IntroSection
