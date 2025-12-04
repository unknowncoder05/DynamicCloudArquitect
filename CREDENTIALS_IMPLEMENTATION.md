# AWS Credentials Secure Storage - Implementation Guide

## Overview

This document describes the secure credential storage system implemented for the DynamicCloudArquitect project. The system allows users to securely input and store AWS (and other cloud provider) credentials with encryption at rest.

## ✅ Completed Implementation

### Backend (Django)

#### 1. Encryption Utilities (`BackEndApi/src/api/terraform/encryption.py`)

- **CredentialEncryption** class using Fernet (symmetric encryption)
- Derives encryption key from Django's SECRET_KEY using PBKDF2
- 100,000 iterations for key derivation (industry standard)
- Provides `encrypt()` and `decrypt()` methods
- Supports key rotation (with migration needed)

#### 2. CloudProviderCredential Model (`BackEndApi/src/api/terraform/models.py`)

**Features:**
- Supports AWS, Azure, GCP, DigitalOcean, and custom providers
- All sensitive fields encrypted at rest using property decorators
- User-scoped (credentials belong to specific users)
- Validation status tracking (`is_valid`, `last_validated_at`)
- Default credential support per provider type
- Audit fields (`last_used_at`)

**AWS Fields:**
- `aws_access_key_id` (encrypted)
- `aws_secret_access_key` (encrypted)
- `aws_session_token` (encrypted, optional)
- `aws_region` (not sensitive, plaintext)

**Azure Fields:**
- `azure_subscription_id` (encrypted)
- `azure_tenant_id` (encrypted)
- `azure_client_id` (encrypted)
- `azure_client_secret` (encrypted)

**GCP Fields:**
- `gcp_project_id` (encrypted)
- `gcp_service_account_json` (encrypted)

**Generic Fields:**
- `generic_credentials` (encrypted JSON for other providers)

#### 3. Serializers (`BackEndApi/src/api/terraform/serializers.py`)

**CloudProviderCredentialSerializer:**
- All credential fields are write-only (never returned in responses)
- Returns `has_*_credentials` boolean flags instead of values
- Automatically encrypts credentials on create/update
- Sets user from request context

**CloudProviderCredentialListSerializer:**
- Lightweight serializer for list views
- Only shows metadata (name, type, validity)
- Never includes any credential hints

#### 4. ViewSet & Endpoints (`BackEndApi/src/api/terraform/views.py`)

**CloudProviderCredentialViewSet:**

Standard CRUD:
- `GET /terraform/credentials/` - List user's credentials
- `POST /terraform/credentials/` - Create new credential
- `GET /terraform/credentials/{id}/` - Get credential detail
- `PATCH /terraform/credentials/{id}/` - Update credential
- `DELETE /terraform/credentials/{id}/` - Delete credential

Custom Actions:
- `POST /terraform/credentials/{id}/validate_credentials/` - Validate AWS credentials using STS
- `PATCH /terraform/credentials/{id}/set_default/` - Set as default for provider type

**Security Features:**
- User-scoped (only sees own credentials)
- Requires authentication
- AWS validation uses boto3 STS GetCallerIdentity
- Updates `is_valid` and `last_validated_at` on validation

#### 5. TerraformProvider Integration

**Updated TerraformProvider model:**
- New `credential` ForeignKey to CloudProviderCredential (optional)
- SET_NULL on delete (provider continues to exist)
- Allows runtime credential selection

**Updated TerraformProviderSerializer:**
- Includes `credential` (UUID)
- Includes `credential_name` (display name, read-only)
- Includes `credential_provider_type` (read-only)

#### 6. URL Configuration (`BackEndApi/src/api/terraform/urls.py`)

Added route:
```python
router.register(r'credentials', CloudProviderCredentialViewSet, basename='cloud-credential')
```

### Frontend (React/TypeScript)

#### 1. TypeScript Types (`frontend/src/types/terraform.ts`)

**CloudProviderType:**
```typescript
type CloudProviderType = 'aws' | 'azure' | 'gcp' | 'digitalocean' | 'other';
```

**CloudProviderCredentialList:**
- Lightweight interface for list views
- No credential fields (security)

**CloudProviderCredential:**
- Full interface with all fields
- Credential fields marked write-only in documentation

**CloudProviderCredentialInput:**
- Request body interface for create/update
- Includes all possible credential fields

**CredentialValidationResponse:**
- Response from validation endpoint
- Includes AWS identity information if successful

**Updated TerraformProvider:**
- Added `credential` (UUID)
- Added `credential_name` (string)
- Added `credential_provider_type` (CloudProviderType)

#### 2. API Client (`frontend/src/services/terraformApi.ts`)

**credentialsApi:**
```typescript
credentialsApi.list(providerType?)  // List credentials
credentialsApi.get(id)              // Get credential detail
credentialsApi.create(data)         // Create new credential
credentialsApi.update(id, data)     // Update credential
credentialsApi.delete(id)           // Delete credential
credentialsApi.validate(id)         // Validate credentials
credentialsApi.setDefault(id)       // Set as default
```

## ⏳ Remaining Tasks

### Frontend Implementation

#### 1. Redux Slice (`frontend/src/store/credentialsSlice.ts`)

**State Structure:**
```typescript
{
  credentials: CloudProviderCredentialList[],
  currentCredential: CloudProviderCredential | null,
  isLoading: boolean,
  isSaving: boolean,
  error: string | null,
  validationResult: CredentialValidationResponse | null
}
```

**Async Thunks:**
- `fetchCredentials()` - Load user's credentials
- `fetchCredentialDetail(id)` - Load single credential
- `createCredential(data)` - Create new credential
- `updateCredential({id, data})` - Update credential
- `deleteCredential(id)` - Delete credential
- `validateCredential(id)` - Validate credentials
- `setDefaultCredential(id)` - Set as default

**Reducers:**
- Error clearing
- Loading states
- Validation result management

#### 2. CredentialInputModal Component

**Location:** `frontend/src/components/terraform/CredentialInputModal.tsx`

**Features:**
- Form for creating/editing credentials
- Provider type selector (AWS, Azure, GCP, etc.)
- Conditional rendering based on provider type
- Password input fields for sensitive data
- Validation button (test credentials)
- Security notice (credentials never retrieved)

**AWS Form Fields:**
- Name (required)
- Description (optional)
- Access Key ID (required)
- Secret Access Key (required)
- Session Token (optional)
- Region (dropdown)

**Validation:**
- Required field validation
- Format validation for AWS keys
- Test button to validate credentials

#### 3. CredentialsManagementPage

**Location:** `frontend/src/pages/terraform/CredentialsPage.tsx`

**Features:**
- List of user's credentials (table or cards)
- Provider type filter
- Add new credential button
- Edit/Delete actions per credential
- Validation status indicator (✓ valid, ✗ invalid, ? unknown)
- Last validated timestamp
- Default credential badge
- "Set as default" action

**Table Columns:**
- Name
- Provider Type
- Region (for AWS)
- Validation Status
- Last Validated
- Is Default
- Actions (Edit, Delete, Validate, Set Default)

#### 4. Update Provider Forms

**Files to Update:**
- Any component that creates/edits TerraformProvider
- `frontend/src/components/terraform/ProviderForm.tsx` (if exists)

**Changes:**
- Add credential dropdown (filtered by provider type)
- Show "Manage Credentials" link
- Display selected credential name
- Allow null (no credential selected)

#### 5. Navigation

**Update:**
- `frontend/src/App.tsx` or router configuration
- Add route for credentials page

**Add Route:**
```typescript
<Route path="/terraform/credentials" element={<CredentialsPage />} />
```

**Add Nav Link:**
- In sidebar or navbar
- "Cloud Credentials" or "AWS Credentials"

## 🔒 Security Features

### Encryption

1. **At Rest:**
   - All sensitive fields encrypted in database
   - Uses Fernet (AES-128 in CBC mode with HMAC)
   - Key derived from Django SECRET_KEY using PBKDF2
   - 100,000 iterations for key derivation

2. **In Transit:**
   - Credentials only accepted via HTTPS (production)
   - Write-only fields in API
   - Never returned in responses

3. **Access Control:**
   - User-scoped (can only see own credentials)
   - Authentication required for all endpoints
   - No admin access to decrypted credentials

### Best Practices Implemented

✅ Write-only credential fields
✅ Separate list and detail serializers
✅ Validation endpoint to test credentials
✅ Audit logging (last_used_at, last_validated_at)
✅ Default credential support
✅ User-scoped access
✅ Encrypted at rest
✅ Properties for automatic encryption/decryption

### Security Considerations

⚠️ **Encryption Key:**
- Derived from Django SECRET_KEY
- Changing SECRET_KEY breaks all credentials
- Consider using dedicated CREDENTIALS_ENCRYPTION_KEY
- Store in environment variable, never commit

⚠️ **Key Rotation:**
- Requires migration to re-encrypt all credentials
- Use `CredentialEncryption.rotate_key()` with care
- Plan downtime for rotation

⚠️ **Validation:**
- AWS validation makes real API calls
- May incur small costs for STS calls
- Rate limiting recommended

⚠️ **Logs:**
- Never log decrypted credentials
- Be careful with Django debug mode
- Audit log access recommended

## 📋 Next Steps

### 1. Create Migrations

```bash
cd BackEndApi
python src/manage.py makemigrations terraform
python src/manage.py migrate
```

### 2. Set Encryption Key (Recommended)

Add to `.envs/.local/.django`:
```
CREDENTIALS_ENCRYPTION_KEY=<generate-random-32-byte-key>
```

Update `encryption.py` to use dedicated key if present.

### 3. Test Backend

```bash
# Start server
python src/manage.py runserver

# Test endpoints
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/terraform/credentials/

# Create credential
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My AWS Account",
    "provider_type": "aws",
    "aws_access_key_id": "AKIAIOSFODNN7EXAMPLE",
    "aws_secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "aws_region": "us-east-1"
  }' \
  http://localhost:8000/api/terraform/credentials/

# Validate credential
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/terraform/credentials/<id>/validate_credentials/
```

### 4. Implement Frontend Components

Follow the "Remaining Tasks" section above to implement:
1. Redux slice
2. CredentialInputModal
3. CredentialsManagementPage
4. Provider form updates

### 5. Add Documentation

Create user-facing docs:
- How to add AWS credentials
- How to validate credentials
- Security information
- Troubleshooting (invalid credentials, etc.)

## 🔧 Environment Variables

### Development

`.envs/.local/.django`:
```env
SECRET_KEY=<your-secret-key>
# Optional: dedicated encryption key
CREDENTIALS_ENCRYPTION_KEY=<32-byte-random-key>
```

### Production

```env
SECRET_KEY=<strong-secret-key>
CREDENTIALS_ENCRYPTION_KEY=<strong-32-byte-key>
ALLOWED_HOSTS=yourdomain.com
# Ensure HTTPS is enforced
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

## 📊 Database Schema

### CloudProviderCredential Table

```sql
CREATE TABLE terraform_cloudprovidercredential (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    provider_type VARCHAR(50) NOT NULL,

    -- Encrypted fields
    aws_access_key_id TEXT,
    aws_secret_access_key TEXT,
    aws_session_token TEXT,
    aws_region VARCHAR(50),

    azure_subscription_id TEXT,
    azure_tenant_id TEXT,
    azure_client_id TEXT,
    azure_client_secret TEXT,

    gcp_project_id TEXT,
    gcp_service_account_json TEXT,

    generic_credentials TEXT,

    -- Metadata
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',

    -- Audit
    is_valid BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMP,
    last_validated_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    UNIQUE(user_id, name)
);

CREATE INDEX idx_credentials_user_provider ON terraform_cloudprovidercredential(user_id, provider_type);
```

### TerraformProvider Update

```sql
ALTER TABLE terraform_terraformprovider
ADD COLUMN credential_id UUID REFERENCES terraform_cloudprovidercredential(id) ON DELETE SET NULL;
```

## 🧪 Testing

### Backend Tests

Create `BackEndApi/src/api/terraform/tests/test_credentials.py`:

```python
from django.test import TestCase
from api.terraform.models import CloudProviderCredential
from api.users.models import User

class CredentialEncryptionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='testpass')

    def test_aws_credentials_encrypted(self):
        """Test that AWS credentials are encrypted in database"""
        cred = CloudProviderCredential.objects.create(
            user=self.user,
            name='Test AWS',
            provider_type='aws'
        )
        cred.aws_access_key_id = 'AKIAIOSFODNN7EXAMPLE'
        cred.aws_secret_access_key = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
        cred.save()

        # Reload from database
        cred.refresh_from_db()

        # Check encrypted in DB
        self.assertNotEqual(cred._aws_access_key_id, 'AKIAIOSFODNN7EXAMPLE')

        # Check decrypts correctly
        self.assertEqual(cred.aws_access_key_id, 'AKIAIOSFODNN7EXAMPLE')
```

### Frontend Tests

```typescript
// Test credential form validation
describe('CredentialInputModal', () => {
  it('validates required fields', () => {
    // Test implementation
  });

  it('only shows AWS fields when AWS selected', () => {
    // Test implementation
  });
});
```

## 📝 API Examples

### Create AWS Credential

```bash
POST /api/terraform/credentials/
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Production AWS",
  "description": "AWS account for production infrastructure",
  "provider_type": "aws",
  "aws_access_key_id": "AKIAIOSFODNN7EXAMPLE",
  "aws_secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "aws_region": "us-east-1",
  "is_default": true
}
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user": "user-uuid",
  "name": "Production AWS",
  "description": "AWS account for production infrastructure",
  "provider_type": "aws",
  "aws_region": "us-east-1",
  "has_aws_credentials": true,
  "has_azure_credentials": false,
  "has_gcp_credentials": false,
  "has_generic_credentials": false,
  "is_default": true,
  "is_valid": false,
  "last_validated_at": null,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

Note: Credential values are NOT returned.

### Validate Credential

```bash
POST /api/terraform/credentials/550e8400-e29b-41d4-a716-446655440000/validate_credentials/
Authorization: Bearer <token>
```

### Validation Response (Success)

```json
{
  "valid": true,
  "message": "AWS credentials are valid",
  "identity": {
    "account": "123456789012",
    "user_id": "AIDAI23HXS2E5EXAMPLE",
    "arn": "arn:aws:iam::123456789012:user/terraform"
  }
}
```

### Validation Response (Failure)

```json
{
  "valid": false,
  "message": "AWS API error: InvalidClientTokenId - The security token included in the request is invalid",
  "error_code": "InvalidClientTokenId"
}
```

## 🚀 Deployment Checklist

- [ ] Generate strong CREDENTIALS_ENCRYPTION_KEY
- [ ] Store encryption key in secure environment variable
- [ ] Never commit encryption key to git
- [ ] Enable HTTPS in production
- [ ] Set SECURE_SSL_REDIRECT=True
- [ ] Set SESSION_COOKIE_SECURE=True
- [ ] Set CSRF_COOKIE_SECURE=True
- [ ] Run migrations
- [ ] Test credential creation
- [ ] Test credential validation
- [ ] Test credential encryption (check database)
- [ ] Set up backup for encryption key
- [ ] Document key rotation procedure
- [ ] Add monitoring for failed validations
- [ ] Consider rate limiting validation endpoint

## 📚 References

- [Django Cryptography](https://cryptography.io/en/latest/)
- [Fernet (symmetric encryption)](https://cryptography.io/en/latest/fernet/)
- [AWS STS GetCallerIdentity](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

## 🤝 Support

For questions or issues:
1. Check this documentation
2. Review security considerations
3. Test with example credentials (non-production)
4. Check Django logs for errors
5. Verify SECRET_KEY is consistent

---

**Implementation Date:** 2025-12-04
**Status:** Backend Complete, Frontend Pending
**Security Level:** Production-Ready with encryption at rest
