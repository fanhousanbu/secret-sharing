# File Encryption & Secret Sharing System

A web-based file encryption and Shamir secret sharing system that supports two encryption schemes:

## Features

### 🔐 Two Encryption Schemes
- **Hybrid Scheme (Recommended)**: Uses AES to encrypt files and only splits the key, providing high storage efficiency
- **Pure Shamir Scheme**: Directly splits file data, conforming to traditional threshold encryption theory

### 🔒 Security Features
- Supports threshold encryption (m-of-n scheme)
- Optional password protection (both schemes support)
- Uses Web Crypto API for encryption
- Implements Shamir secret sharing algorithm

### 📊 File Integrity Verification
- **SHA256 Hash Calculation**: Automatically calculates SHA256 hash for uploaded original files
- **Integrity Verification**: Automatically verifies file integrity after recovery
- **Hash Record Download**: Provides record files containing original and recovered file hashes
- **Visual Verification Status**: Clearly displays file integrity verification results in UI

## Usage

### File Encryption
1. Select the file to encrypt
2. Choose encryption scheme (hybrid or pure Shamir)
3. Set threshold parameters (e.g., 3-of-5)
4. Optionally set password protection
5. Download generated files (encrypted file/share files)

### File Recovery
1. Upload required files:
   - Hybrid scheme: encrypted file + sufficient share files
   - Pure Shamir scheme: sufficient share files
2. Enter password if set
3. System automatically verifies file integrity
4. Download recovered file and hash record

### File Integrity Verification
The system automatically provides:
- Original file SHA256 hash (calculated during encryption)
- Recovered file SHA256 hash (calculated during recovery)
- Integrity verification result (pass/fail)
- Hash record file (JSON format with timestamp)

## Technical Implementation

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Encryption**: Web Crypto API
- **Hash Algorithm**: SHA-256
- **Secret Sharing**: Shamir secret sharing algorithm
- **Mathematical Operations**: Polynomial interpolation based on finite fields

## Security

- All encryption operations performed on client-side
- Uses strong encryption algorithms (AES-256-GCM)
- Key derivation uses PBKDF2 (100,000 iterations)
- Supports password protection for dual security
- File integrity verification ensures data accuracy

## Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build
```

## Security Reminders

- Please keep share files and passwords secure
- Recommend storing share files in distributed locations
- Regularly verify integrity of share files
- Important files should be backed up 