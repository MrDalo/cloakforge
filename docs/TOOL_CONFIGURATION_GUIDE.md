# Tool Configuration System - Complete Implementation Guide

## 🎯 **System Overview**

This system allows you to **remotely control tool availability** from Contentful CMS without requiring code deployments. When you change the `isEnabled` flag in Contentful, it affects all users immediately (within the 5-minute cache window).

⚠️ **Important Note**: This guide covers the **Contentful Configuration System** for business logic. For UI configuration (title, icon, variant), see `ToolUIConfig` in `src/lib/config/toolConfigs.ts`.

## 🏗️ **Architecture**

```
Contentful CMS → Server Cache (5min TTL) → Zustand Store → ToolActionButton → Form Submission
```

### **Key Components:**

1. **Server-Side Cache** (`/src/lib/contentful/toolConfigCache.ts`)
2. **Client-Side Store** (`/src/stores/toolConfigStore.ts`)
3. **Smart Button Component** (`/src/components/common/ToolActionButton/`)
4. **Provider Integration** (`/src/providers/ToolConfigProvider.tsx`)

## 🚀 **How to Use**

### **1. Update Any Tool Form to Use Smart Buttons**

Replace any regular submit button with `ToolActionButton`:

```tsx
// ❌ Before (regular button)
<Button type="submit" disabled={!isValid}>
  Create Token
</Button>

// ✅ After (smart button with Contentful control)
<ToolActionButton
  toolId="token-creator"
  type="submit"
  disabled={!isValid}
>
  Create Token
</ToolActionButton>
```

### **2. Update UnifiedActionButtons Usage**

For forms using `UnifiedActionButtons`, just add the `toolId`:

```tsx
// ❌ Before
<UnifiedActionButtons
  form={form}
  submitConfig={{...}}
  fees={toolConfig.fees}
/>

// ✅ After
<UnifiedActionButtons
  form={form}
  submitConfig={{...}}
  fees={toolConfig.fees}
  toolId="token-creator"  // Add this line
/>
```

### **3. Control Tools from Contentful**

In your Contentful CMS:

```json
{
  "toolId": "token-creator",
  "isEnabled": false,
  "disabledMessage": "Token creation is temporarily disabled for maintenance.",
  "fees": {
    "baseFee": 0.1,
    "networkFee": 0.001,
    "priorityFee": 0.0001
  }
}
```

## 🔧 **Real-Time Updates**

### **How Updates Work:**

1. **Change in Contentful** → Updates immediately in CMS
2. **Server Cache** → Refreshes within 5 minutes automatically
3. **Client Store** → Can be refreshed manually or on page reload
4. **Button State** → Updates immediately when store refreshes

### **Manual Refresh (Optional):**

```tsx
import { useRefreshToolConfigs } from '@/providers/ToolConfigProvider'

const { refreshConfigs } = useRefreshToolConfigs()

// Refresh configs manually (e.g., on admin action)
await refreshConfigs()
```

## 📝 **Migration Guide for Existing Tools**

### **Step 1: Identify Submit Buttons**

Find all form submission buttons in your tool:

- `<Button type="submit">`
- `<UnifiedActionButtons>`
- Custom submit buttons

### **Step 2: Replace with ToolActionButton**

```tsx
// Example: Burn Tokens Page
const BurnTokenForm = () => {
  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}

      <ToolActionButton toolId='burn-tokens' type='submit' variant='destructive' disabled={!isValid} isLoading={isSubmitting}>
        🔥 Burn Tokens
      </ToolActionButton>
    </form>
  )
}
```

### **Step 3: Add Contentful Configuration**

Create tool configuration in Contentful with content type `toolConfiguration`:

```json
{
  "toolId": "burn-tokens",
  "isEnabled": true,
  "disabledMessage": "Token burning is temporarily unavailable.",
  "fees": {
    "baseFee": 0.05,
    "networkFee": 0.001
  }
}
```

## 🎨 **Button States & UX**

### **Enabled State:**

- ✅ Normal button appearance
- ✅ Fully functional
- ✅ Shows regular fees

### **Disabled State:**

- ⚠️ Grayed out appearance
- ⚠️ Warning icon (AlertTriangle)
- ⚠️ Tooltip with custom message
- ❌ Non-clickable

### **Loading State:**

- 🔄 Spinner animation
- 🔄 Loading text
- ❌ Disabled interaction

## 📊 **Tool IDs Reference**

Use these exact `toolId` values for consistency:

| Tool                    | Tool ID                   |
| ----------------------- | ------------------------- |
| Token Creator           | `token-creator`           |
| Burn Tokens             | `burn-tokens`             |
| Create Liquidity        | `create-liquidity`        |
| Transaction Multisender | `transaction-multisender` |
| Revoke Mint Authority   | `revoke-mint-authority`   |
| Revoke Freeze Authority | `revoke-freeze-authority` |
| Freeze Accounts         | `freeze-accounts`         |
| Unfreeze Accounts       | `unfreeze-accounts`       |

## 🔍 **Testing & Validation**

### **1. Test Enabled Tool:**

1. Set `isEnabled: true` in Contentful
2. Button should be fully functional
3. Form submission should work normally

### **2. Test Disabled Tool:**

1. Set `isEnabled: false` in Contentful
2. Wait 5 minutes (or refresh page)
3. Button should be grayed out with warning icon
4. Hover should show custom message
5. Click should do nothing

### **3. Test Cache Refresh:**

```tsx
// Check current configs
const configs = useToolConfigStore((state) => state.configs)
console.log('Current configs:', configs)

// Manual refresh
const { refreshConfigs } = useRefreshToolConfigs()
await refreshConfigs()
```

## 🚨 **Important Notes**

### **Cache Behavior:**

- **Server cache**: 5-minute TTL (reduces Contentful API calls)
- **Client store**: Persists until page refresh or manual update
- **Real-time**: Changes visible within 5 minutes maximum

### **Fallback Behavior:**

- If Contentful is down → Tools remain enabled (fail-safe)
- If no config exists → Tools default to enabled
- If API error → Cached configs used

### **Performance:**

- **First load**: Server-side data fetch (no delay)
- **Subsequent loads**: Cached data (instant)
- **API calls**: Minimal (5-minute intervals)

## 🔄 **Update Workflow**

### **For Emergency Disabling:**

1. Go to Contentful CMS
2. Find tool configuration
3. Set `isEnabled: false`
4. Add descriptive `disabledMessage`
5. Publish changes
6. Users see changes within 5 minutes

### **For Re-enabling:**

1. Set `isEnabled: true` in Contentful
2. Remove or update `disabledMessage`
3. Publish changes
4. Tool becomes available within 5 minutes

This system gives you **complete remote control** over tool availability without requiring code deployments or server restarts! 🎉
