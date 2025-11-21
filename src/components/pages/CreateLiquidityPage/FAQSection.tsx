import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function FAQSection() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>What is an OpenBook Market?</AccordionTrigger>
          <AccordionContent>
            An OpenBook Market is the order book infrastructure required by Raydium to create a liquidity pool. It handles the matching of buy and sell orders.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>How much does it cost?</AccordionTrigger>
          <AccordionContent>
            Standard markets cost ~3 SOL in rent. Our optimized "Low Cost" option reduces this to ~0.3 SOL by using smaller event queues, which is sufficient for most new tokens.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
