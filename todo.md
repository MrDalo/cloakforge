## Instructions:

- Use all docs from the /docs folder
- Use github copilot instructions
- use useToolBase.ts, error handling strategies from ERROR_HANDLING_STRATEGY.md
- use Solana MCP server to get the best possible informations how to achieve the functional Butn token service
- use already created utility functions from /src/lib and /src/hooks

## Steps:

1. Update my existing imports to import server side utility functions and logic
2. Rename new file names to have same same as the main exported function from that file -> naming consistency
3. In /src/lib/solana/burnToken I can see 'connection' as a parameter. Isn't it better to create a new connection with private RCP endpoint? Connection is passed from the client-side (public rpc endpoint). Also this /src/lib/solana/burnToken is server utility file with import 'server-only', but it is called in the useBurnTokensServerSide.ts which is client-side hook so I am getting this nextjs error:
   You're importing a component that needs "server-only". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components. Please handle it. Also check same issue for Create Token service
4. Feel free to do you own improvements
5. If you have idea of another Todos for the future, create them

## Other notes:

- Feel free to analyze architecture and modify my steps for the best business logic, architecture and clean code.
