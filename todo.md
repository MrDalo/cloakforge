## Instructions:

- Follow the process of the business logic of the Burn Token service to have similar achitecture and usage of the utility functions as Token Creator service
- Use all docs from the /docs folder
- Use github copilot instructions
- use useToolBase.ts, error handling strategies from ERROR_HANDLING_STRATEGY.md
- use Solana MCP server to get the best possible informations how to achieve the functional Butn token service

## Steps:

1. Create a utility function, which will get all SPL tokens form the connected wallet. This utility function should have the best performance (the less solana RPC blockchain calls = better performance). This utlity function will be reusable across other tools in my app
2. Display all tokens owned and potentially burned by the connected wallet in the form fo the Burn token page
3. Create custom hook which will call useToolBase hook and handle all states and checks (insufficient wallet balance, toaster showing, etc.)
4. Utility function for burning tokens.

## Other notes:

- Feel free to analyze architecture and modify my steps for the best business logic, architecture and clean code.
