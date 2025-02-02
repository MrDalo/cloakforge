'use client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import React from 'react'

const AccordionSection = (): React.ReactNode => {
  const accordion_data = [
    {
      title: 'What is SPL 2022 Token Creator?',
      content:
        'SPL 2022 Token Creator is an advanced tool that allows you to create and mint your own SPL tokens on the Solana blockchain without any coding skills. Customize metadata, supply, logo, and more—all in an intuitive interface.',
    },
    {
      title: 'What is an SPL token?',
      content:
        'SPL tokens are digital assets on the Solana blockchain, similar to ERC-20 tokens on Ethereum. They are designed for fast, secure, and scalable transactions with features like minting, transferring, and freezing.',
    },
    {
      title: 'What wallets can I use to create SPL tokens?',
      content:
        'You can connect popular Solana wallets such as Phantom, Solflare, or any other wallet compatible with the Solana blockchain.',
    },
    {
      title: 'How much does it cost to create SPL tokens?',
      content:
        'Our platform offers the lowest fees on the market, with the current price displayed at the bottom of the creation form.',
    },
    {
      title: 'How do I use SPL 2022 Token Creator?',
      content: (
        <ol>
          <li>Connect your Solana wallet. </li>
          <li>
            Fill in details about your token (name, symbol, decimals, supply,
            logo)
          </li>
          <li>
            Enable optional features like revoking mint/freeze authority or
            making metadata immutable.
          </li>
          <li>Press "Create Token" and confirm the transaction.</li>
          <li>Your token will be created and sent directly to your wallet!</li>
        </ol>
      ),
    },
    {
      title: 'Can I test the token creation process for free?',
      content:
        "Yes! You can simulate transactions or create tokens for free on Solana's devnet.",
    },
    {
      title: 'Can I create meme coins using this tool?',
      content:
        'Absolutely! Our platform is perfect for creating meme coins with large supplies and customizable metadata.',
    },
    {
      title: 'Is it safe to create tokens here?',
      content:
        'Yes, our application is designed with security in mind. Only you retain control over mint and freeze authority. We do not track or collect user data, ensuring complete privacy.',
    },
    {
      title: 'How long does it take to create a token?',
      content:
        "Token creation typically takes just a few seconds. The speed depends on Solana's network status (TPS), but delays are rare.",
    },
    {
      title: ' Is my privacy protected when using this tool?',
      content:
        'Yes, your privacy is our top priority. We do not use any trackers or analytical tools, ensuring that your activity remains completely anonymous. The only tool used to store and process your transactions is the Solana blockchain itself, providing a secure and decentralized environment for your token creation process.',
    },
  ]

  return (
    <section className='mx-auto flex w-full max-w-screen-md flex-col items-center justify-start gap-4'>
      <h3 className='text-2xl font-semibold'>FAQ</h3>
      {accordion_data.map((item, index) => (
        <Accordion
          className='w-full rounded-lg bg-card px-6 shadow-md'
          collapsible
          key={index}
          type='single'
        >
          <AccordionItem className='w-full border-b-0' value={item.title}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent className='w-full'>
              {item.content}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </section>
  )
}

export default AccordionSection
