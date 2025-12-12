# QuizMaker API Guide for AI Agents

## How to Navigate the Documentation

The QuizMaker API uses a **modular documentation structure** optimized for token efficiency. Follow this process:

### Step 1: Start with the Discovery Endpoint

```bash
GET https://quizzence.com/api/v1/api-summary
```

This returns a **2KB summary** of all 9 API groups with their sizes and descriptions. Use this to decide which groups you need.

### Step 2: Fetch Only Relevant Group Specs

```bash
# Instead of downloading 300KB+ full spec:
GET https://quizzence.com/v3/api-docs/{GROUP_NAME}

# Examples:
GET https://quizzence.com/v3/api-docs/questions  # ~18KB
GET https://quizzence.com/v3/api-docs/auth       # ~24KB
GET https://quizzence.com/v3/api-docs/ai         # ~4KB
GET https://quizzence.com/v3/api-docs/articles   # Articles (public + admin)
```

Available groups: `auth`, `quizzes`, `questions`, `attempts`, `documents`, `billing`, `articles`, `ai`, `admin`

### Step 3: Get Question Type Schemas (If Creating Questions)

```bash
# All 9 question types with schemas + examples:
GET https://quizzence.com/api/v1/questions/schemas

# Specific type:
GET https://quizzence.com/api/v1/questions/schemas/MCQ_SINGLE
```

---

## Critical: Question Content Validation

**⚠️ IMPORTANT**: Questions have a flexible `content` field (JSON) that varies by question type. Each type has different required fields.

**Before creating questions:**
1. Fetch the schema: `GET /api/v1/questions/schemas/{TYPE}`
2. Study the `schema` and `example` in the response
3. Validate your content against the schema locally
4. Then create the question via API

**Example mistake:**
```json
// ❌ WRONG - "FILL_GAP" doesn't use "template" and "blanks"
{"template": "...", "blanks": [...]}

// ✅ CORRECT - Use "text" and "gaps"
{"text": "...", "gaps": [...]}
```

**9 Question Types:**
- `MCQ_SINGLE`, `MCQ_MULTI`, `OPEN`, `FILL_GAP`, `COMPLIANCE`, `TRUE_FALSE`, `ORDERING`, `HOTSPOT`, `MATCHING`

Each has different content structure. Always check `/api/v1/questions/schemas` first.

---

## Authentication

Most endpoints require JWT authentication.

**Get token:**
```bash
POST https://quizzence.com/api/v1/auth/login
# Returns: {"token": "...", "user": {...}}
```

**Use token:**
```
Authorization: Bearer {token}
```

**Public endpoints (no auth needed):**
- `/api/v1/api-summary`
- `/api/v1/questions/schemas**`
- `/v3/api-docs**`
- `/swagger-ui/**`
- `/api/v1/articles/public` (search published articles; rate-limited)
- `/api/v1/articles/public/slug/{slug}` (get a published article by slug; rate-limited)
- `/api/v1/articles/sitemap`

---

## Best Practices

### 1. Use Modular Docs (Save Tokens)

❌ Don't: `GET /v3/api-docs` (306KB full spec)  
✅ Do: `GET /api/v1/api-summary` → then `GET /v3/api-docs/questions` (18KB)

### 2. Cache Aggressively

- Question schemas: Cache for 24 hours
- API group specs: Cache for 1 hour  
- API summary: Cache for 15 minutes

### 3. Validate Before Sending

Use a JSON Schema validator on question `content` before creating questions. Prevents 400/422 errors.

### 4. Handle Common Errors

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Invalid content structure | Check schema |
| 401 | Token expired | Re-authenticate |
| 422 | Content validation failed | Review schema requirements |

---

## Links

- **Discovery**: https://quizzence.com/api/v1/api-summary
- **Question Schemas**: https://quizzence.com/api/v1/questions/schemas
- **Human Docs**: https://quizzence.com/api/v1/docs
- **Swagger UI**: https://quizzence.com/swagger-ui/index.html

All API details (endpoints, parameters, responses) are in the OpenAPI specs. This guide only explains **how to navigate** them efficiently.
