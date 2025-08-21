# Scripts

## hash-password.js

Generates a bcrypt hash for the admin password.

### Usage

```bash
node scripts/hash-password.js "your-password"
```

### Example

```bash
node scripts/hash-password.js mySecurePassword123
```

This will output:
- The bcrypt hash
- The environment variable to add to your `.env` file