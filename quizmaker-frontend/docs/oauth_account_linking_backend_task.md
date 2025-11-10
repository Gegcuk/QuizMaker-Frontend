# OAuth Account Linking - Backend Implementation Task

## Overview
Implement secure OAuth account linking for authenticated users to connect Google/GitHub accounts to their existing QuizMaker account.

---

## Problem Statement

Currently, the OAuth flow only supports:
- **New user registration** (create account via OAuth)
- **Login** (authenticate with existing OAuth account)

We need to add:
- **Account linking** (connect OAuth to existing authenticated user)

---

## Security Requirements

### 1. **Authentication Verification**
- ✅ **MUST verify user is authenticated** before allowing account linking
- ✅ **MUST use the authenticated user's ID** from the current session/JWT token
- ❌ **MUST NOT trust any user ID from query parameters or form data**

### 2. **OAuth State Parameter**
- ✅ **MUST use OAuth `state` parameter** for CSRF protection
- ✅ **State should contain:**
  - Random nonce (to prevent replay attacks)
  - Action type (`link` or `login`)
  - Original return URL (for better UX)
  - Expiration timestamp
- ✅ **State should be signed/encrypted** (JWT or HMAC)
- ✅ **State should be validated** on OAuth callback

### 3. **Session Management**
- ✅ **MUST preserve user authentication** during OAuth redirect flow
- ✅ Use HTTP session or secure cookie to maintain authentication state
- ✅ Set appropriate session timeout (5-10 minutes for OAuth flow)

### 4. **Token Security**
- ✅ **Store OAuth tokens securely** in database (encrypted at rest)
- ✅ Store: `provider`, `provider_user_id`, `email`, `access_token` (encrypted), `refresh_token` (encrypted)
- ✅ **NEVER expose tokens** in API responses or logs

---

## Business Logic Requirements

### 1. **Duplicate Prevention**
- ✅ **Check if OAuth account is already linked** to ANY user
  - If linked to SAME user → inform "already connected"
  - If linked to DIFFERENT user → error "account already in use"
- ✅ **Check if email from OAuth provider** matches user's primary email
  - Warn if different (potential account confusion)

### 2. **Primary Account Enforcement**
- ✅ **User MUST have at least one authentication method** at all times
  - If user has only password → allow linking OAuth
  - If user has only OAuth → allow adding password
  - **MUST NOT allow unlinking last authentication method**

### 3. **Account Verification**
- ✅ If OAuth provider verifies email → mark user email as verified
- ✅ If OAuth email differs from user email → store separately, don't auto-update

### 4. **Audit Trail**
- ✅ Log all account linking/unlinking events with:
  - User ID
  - Provider
  - Timestamp
  - IP address
  - Action result (success/failure/reason)

---

## API Design

### 1. **OAuth Authorization Endpoint**
```
GET /oauth2/authorization/{provider}?action=link
```

**Parameters:**
- `action` (optional): `login` (default) or `link`

**Behavior:**
- If `action=link`:
  - Verify user is authenticated
  - Generate signed state parameter with action=link
  - Redirect to OAuth provider
- If `action=login` or no action:
  - Normal login/register flow

### 2. **OAuth Callback Endpoint**
```
GET /login/oauth2/code/{provider}?code=...&state=...
```

**Behavior:**
1. Validate state parameter (signature, expiration, nonce)
2. Extract action from state
3. Exchange code for OAuth tokens
4. Get user info from OAuth provider

**If action=link:**
- Verify user is STILL authenticated (check session)
- Get authenticated user ID from session/JWT
- Check if OAuth account already exists
- Link OAuth account to authenticated user
- Redirect to `/profile` or return URL from state

**If action=login:**
- Check if OAuth account exists → login
- If not exists → register new user
- Issue JWT tokens
- Redirect to dashboard

### 3. **Get Linked Accounts Endpoint**
```
GET /api/v1/auth/oauth/accounts
```

**Response:**
```json
{
  "accounts": [
    {
      "provider": "GOOGLE",
      "email": "user@gmail.com",
      "linkedAt": "2024-01-15T10:30:00Z",
      "isPrimary": false
    }
  ]
}
```

**Security:**
- ✅ Requires authentication
- ✅ Returns only current user's accounts
- ❌ NEVER return access tokens or refresh tokens

### 4. **Unlink Account Endpoint**
```
DELETE /api/v1/auth/oauth/accounts
Body: { "provider": "GOOGLE" }
```

**Validation:**
- ✅ Check user has at least ONE other authentication method
- ✅ Verify the OAuth account belongs to current user
- ✅ Soft delete (mark as deleted, don't actually delete for audit)

---

## Database Schema Requirements

### **oauth_accounts** table:
```
- id (PK)
- user_id (FK to users) [INDEXED]
- provider (GOOGLE, GITHUB, etc.) [INDEXED]
- provider_user_id (unique identifier from provider) [INDEXED]
- email (from OAuth provider)
- access_token (ENCRYPTED)
- refresh_token (ENCRYPTED)
- token_expires_at
- created_at
- updated_at
- deleted_at (for soft delete)
- UNIQUE constraint on (provider, provider_user_id)
- UNIQUE constraint on (user_id, provider) - one OAuth account per provider per user
```

### **oauth_link_events** table (audit log):
```
- id (PK)
- user_id (FK to users)
- provider
- action (LINKED, UNLINKED, LINK_FAILED)
- ip_address
- user_agent
- error_message (if failed)
- created_at
```

---

## Error Handling

### 1. **Account Linking Errors**
- `ACCOUNT_ALREADY_LINKED` - OAuth account linked to this user
- `ACCOUNT_IN_USE` - OAuth account linked to different user
- `NOT_AUTHENTICATED` - User not logged in for link action
- `SESSION_EXPIRED` - OAuth flow took too long
- `INVALID_STATE` - State parameter tampered with
- `PROVIDER_ERROR` - OAuth provider returned error

### 2. **Account Unlinking Errors**
- `LAST_AUTH_METHOD` - Cannot unlink last authentication method
- `ACCOUNT_NOT_FOUND` - OAuth account not linked to user
- `NOT_AUTHORIZED` - Trying to unlink another user's account

### 3. **User-Friendly Messages**
- Don't expose internal errors to frontend
- Return clear, actionable messages
- Log detailed errors server-side

---

## Testing Requirements

### 1. **Unit Tests**
- ✅ State parameter generation and validation
- ✅ Duplicate account detection
- ✅ Last authentication method protection
- ✅ Token encryption/decryption

### 2. **Integration Tests**
- ✅ Full OAuth linking flow (mocked OAuth provider)
- ✅ Session preservation during OAuth redirect
- ✅ Concurrent linking attempts
- ✅ Expired state parameter rejection

### 3. **Security Tests**
- ✅ CSRF protection (state parameter validation)
- ✅ Session fixation protection
- ✅ Replay attack prevention
- ✅ Privilege escalation (user A linking user B's OAuth)

### 4. **Edge Cases**
- ✅ User logs out during OAuth flow
- ✅ User deletes account during OAuth flow
- ✅ OAuth provider changes user's email
- ✅ Network timeout during OAuth callback

---

## Implementation Priority

### Phase 1 (MVP - Must Have):
1. ✅ Basic account linking with state parameter
2. ✅ Duplicate account prevention
3. ✅ Session-based authentication preservation
4. ✅ Get linked accounts endpoint
5. ✅ Unlink account endpoint with validation

### Phase 2 (Nice to Have):
1. ✅ Audit logging
2. ✅ Email verification via OAuth
3. ✅ Token refresh mechanism
4. ✅ Admin endpoints to view/manage linked accounts

### Phase 3 (Future):
1. ✅ Multiple accounts per provider (e.g., 2 Google accounts)
2. ✅ Transfer primary authentication method
3. ✅ Automatic account merging suggestions

---

## Configuration

### **application.yml** or **application.properties**:
```yaml
oauth:
  state:
    secret-key: "${OAUTH_STATE_SECRET_KEY}" # for signing state parameter
    expiration-minutes: 10
  token:
    encryption-key: "${OAUTH_TOKEN_ENCRYPTION_KEY}" # for encrypting stored tokens
  allowed-providers:
    - GOOGLE
    - GITHUB
  link-callback-url: "http://localhost:3000/profile"
```

---

## Success Criteria

### Functional:
- ✅ User can link Google/GitHub to existing account
- ✅ User can unlink OAuth account (if not last auth method)
- ✅ User can see all linked accounts
- ✅ Login/register still works normally

### Security:
- ✅ No CSRF vulnerabilities
- ✅ No privilege escalation
- ✅ Tokens stored encrypted
- ✅ All actions audited

### UX:
- ✅ User stays logged in during linking
- ✅ Clear error messages
- ✅ Redirects back to profile page after linking
- ✅ No confusing behavior if account already linked

---

## References

- **OAuth 2.0 RFC:** https://datatracker.ietf.org/doc/html/rfc6749
- **OAuth State Parameter:** https://tools.ietf.org/html/rfc6749#section-10.12
- **Spring Security OAuth2:** https://docs.spring.io/spring-security/reference/servlet/oauth2/index.html
- **OWASP OAuth Security:** https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html

---

## Notes for Implementation

1. **Don't Reinvent the Wheel**: Use Spring Security OAuth2 Client - it handles most of the heavy lifting (state parameter, CSRF, etc.)

2. **Session vs JWT**: If using JWT for API auth, you still need HTTP session for OAuth flow (redirects). Consider hybrid approach.

3. **Testing Locally**: Use ngrok or similar for testing with real OAuth providers (they need public callback URLs).

4. **Provider Differences**: Google and GitHub OAuth have slightly different flows and scopes - abstract common logic.

5. **Rate Limiting**: OAuth providers have rate limits - implement caching and backoff strategies.

6. **Documentation**: Document the frontend callback handling - what happens after `/profile?success=true` redirect.

---

## Acceptance Criteria Checklist

- [ ] User can click "Connect Google" on profile page
- [ ] User is redirected to Google OAuth consent screen
- [ ] User remains logged in after Google redirect
- [ ] Google account is linked to user's account
- [ ] User sees Google account listed as "Connected" on profile page
- [ ] User can unlink Google account (if password is set)
- [ ] User CANNOT unlink if it's their only auth method
- [ ] OAuth account can't be linked to multiple users
- [ ] Audit log shows linking event
- [ ] Same flow works for GitHub

---

**Estimated Effort:** 3-5 days for backend developer familiar with Spring Security OAuth2

**Risk Level:** Medium (OAuth flows are complex, testing requires external providers)

**Dependencies:** 
- Spring Security OAuth2 Client library
- Database migrations for oauth_accounts and oauth_link_events tables
- OAuth client credentials for Google/GitHub (production keys)

