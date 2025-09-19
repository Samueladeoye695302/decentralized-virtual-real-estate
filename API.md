# Smart Contract API Documentation

This document describes the public interface of our smart contracts.

## Core Functions

### Initialization

#### `initialize()`
- **Purpose**: Initialize the contract and set up initial state
- **Access**: Contract owner only
- **Returns**: `(ok true)` on success
- **Errors**: `ERR_UNAUTHORIZED` if not called by owner

### User Management

#### `authorize-user(user: principal)`
- **Purpose**: Grant authorization to a user
- **Access**: Authorized users and contract owner
- **Parameters**: 
  - `user`: Principal to authorize
- **Returns**: `(ok true)` on success
- **Errors**: 
  - `ERR_UNAUTHORIZED` if caller not authorized
  - `ERR_INVALID_PARAMS` if trying to authorize contract owner

#### `deauthorize-user(user: principal)`
- **Purpose**: Remove authorization from a user
- **Access**: Authorized users and contract owner
- **Parameters**: 
  - `user`: Principal to deauthorize
- **Returns**: `(ok true)` on success
- **Errors**: 
  - `ERR_UNAUTHORIZED` if caller not authorized
  - `ERR_INVALID_PARAMS` if trying to deauthorize contract owner

#### `create-user-profile()`
- **Purpose**: Create a profile for the calling user
- **Access**: Any user (when not in maintenance mode)
- **Returns**: `(ok true)` on success
- **Errors**: 
  - `ERR_INVALID_PARAMS` if profile already exists or in maintenance mode

#### `update-user-activity()`
- **Purpose**: Update the last activity timestamp for the calling user
- **Access**: Users with existing profiles (when not in maintenance mode)
- **Returns**: `(ok true)` on success
- **Errors**: 
  - `ERR_NOT_FOUND` if user profile doesn't exist
  - `ERR_INVALID_PARAMS` if in maintenance mode

### Contract Management

#### `emergency-pause()`
- **Purpose**: Immediately pause the contract
- **Access**: Contract owner only
- **Returns**: `(ok true)` on success
- **Errors**: `ERR_UNAUTHORIZED` if not called by owner

#### `toggle-contract()`
- **Purpose**: Toggle contract active state
- **Access**: Contract owner only
- **Returns**: `(ok bool)` current contract state
- **Errors**: `ERR_UNAUTHORIZED` if not called by owner

#### `set-maintenance-mode(enabled: bool)`
- **Purpose**: Enable or disable maintenance mode
- **Access**: Contract owner only
- **Parameters**: 
  - `enabled`: Boolean to enable/disable maintenance
- **Returns**: `(ok bool)` maintenance mode state
- **Errors**: `ERR_UNAUTHORIZED` if not called by owner

### Feature Flags

#### `set-feature-flag(flag: string-ascii, enabled: bool)`
- **Purpose**: Set a feature flag value
- **Access**: Authorized users and contract owner
- **Parameters**: 
  - `flag`: Feature flag name (max 32 characters)
  - `enabled`: Boolean flag state
- **Returns**: `(ok true)` on success
- **Errors**: `ERR_UNAUTHORIZED` if caller not authorized

## Read-Only Functions

### Contract State

#### `get-contract-status() -> bool`
Returns the current active status of the contract.

#### `get-contract-version() -> string-ascii`
Returns the current version of the contract.

#### `is-maintenance-mode() -> bool`
Returns whether the contract is in maintenance mode.

#### `get-contract-owner() -> principal`
Returns the contract owner principal.

#### `get-total-operations() -> uint`
Returns the total number of operations logged.

### User Information

#### `is-user-authorized(user: principal) -> bool`
Check if a user is authorized.

#### `get-user-profile(user: principal) -> (optional profile)`
Get a user's profile information including:
- `created-at`: Block height when profile was created
- `last-activity`: Block height of last activity
- `reputation-score`: Current reputation score

#### `get-user-reputation(user: principal) -> uint`
Get a user's current reputation score.

### Feature Flags

#### `get-feature-flag(flag: string-ascii) -> bool`
Get the current state of a feature flag.

### Operation Logs

#### `get-operation-log(operation-id: uint) -> (optional log-entry)`
Get details of a specific operation including:
- `operator`: Principal who performed the operation
- `action`: String describing the action
- `timestamp`: Block height when operation occurred

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| u100 | ERR_UNAUTHORIZED | Caller lacks required permissions |
| u101 | ERR_INVALID_PARAMS | Invalid parameters provided |
| u102 | ERR_NOT_FOUND | Requested resource not found |

## Usage Examples

### TypeScript/JavaScript (using @stacks/transactions)

```typescript
import { ContractCallTransaction, makeContractCall } from '@stacks/transactions';

// Initialize contract
const initTx = await makeContractCall({
  contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  contractName: 'my-contract',
  functionName: 'initialize',
  functionArgs: [],
  senderKey: privateKey,
  network: stacksNetwork
});

// Create user profile
const profileTx = await makeContractCall({
  contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  contractName: 'my-contract',
  functionName: 'create-user-profile',
  functionArgs: [],
  senderKey: userPrivateKey,
  network: stacksNetwork
});
```

### Clarity (for contract-to-contract calls)

```clarity
;; Call from another contract
(contract-call? .my-contract authorize-user tx-sender)

;; Read contract state
(contract-call? .my-contract get-contract-status)
```
