# File Encryption & Secret Sharing System
[简体中文](README_CN.md)

[![Test Coverage](https://img.shields.io/badge/coverage-69.54%25-brightgreen)](https://github.com/fanhousanbu/secret-sharing)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/fanhousanbu/secret-sharing/actions)
[![Deploy Status](https://img.shields.io/badge/deploy-success-brightgreen)](https://fanhousanbu.github.io/secret-sharing)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)

A web-based file encryption and Shamir secret sharing system that supports two encryption schemes:

## ✨ Purely Front-End for Maximum Privacy

This is a pure front-end application. **All operations, including file selection, encryption, and secret sharing, are performed entirely within your browser.**

- **No Data Transmission**: Your files, passwords, or any other sensitive information are **never** uploaded or sent to any server.
- **Client-Side Operations**: All cryptographic calculations happen locally on your machine using the standard Web Crypto API.
- **Maximum Security**: This design ensures that your private data never leaves your computer, providing the highest level of security and privacy. You can even disconnect from the internet after loading the page and continue to use the application.

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

- **Client-Side Only**: All encryption operations are performed locally in your browser. No data is ever sent to a server, ensuring your files and passwords remain private.
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

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Check coverage thresholds
npm run check:cov
```

## Testing

This project maintains high test coverage with automated CI/CD:

- **Coverage Thresholds**: 
  - Statements: 65%
  - Branches: 50%
  - Functions: 55%
  - Lines: 65%

- **Current Coverage**: 69.54% overall
- **Automated Testing**: All tests run on every PR and push
- **Coverage Reports**: Available in CI/CD and locally

## Security Reminders

- Please keep share files and passwords secure
- Recommend storing share files in distributed locations
- Regularly verify integrity of share files
- Important files should be backed up
