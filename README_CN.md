# 文件加密与秘密共享系统
[English](README.md)

[![Test Coverage](https://img.shields.io/badge/coverage-69.54%25-brightgreen)](https://github.com/fanhousanbu/secret-sharing)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/fanhousanbu/secret-sharing/actions)
[![Deploy Status](https://img.shields.io/badge/deploy-success-brightgreen)](https://fanhousanbu.github.io/secret-sharing)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)

一个基于Web的文件加密和Shamir秘密共享系统，支持两种加密方案：

## ✨ 纯前端实现，最大化保护隐私

这是一个纯前端应用程序。**所有操作，包括文件选择、加密和秘密共享，都完全在您的浏览器中进行。**

- **无数据传输**：您的文件、密码或任何其他敏感信息**永远不会**被上传或发送到任何服务器。
- **客户端操作**：所有加密计算都使用标准的 Web Crypto API 在您的本地计算机上进行。
- **最高安全性**：此设计可确保您的私人数据永远不会离开您的计算机，从而提供最高级别的安全性和隐私性。您甚至可以在加载页面后断开与互联网的连接，然后继续使用该应用程序。

## 功能

### 🔐 两种加密方案
- **混合方案（推荐）**：使用AES加密文件，仅拆分密钥，存储效率高。
- **纯Shamir方案**：直接拆分文件数据，符合传统阈值加密理论。

### 🔒 安全特性
- 支持阈值加密（m-of-n方案）
- 可选密码保护（两种方案均支持）
- 使用Web Crypto API进行加密
- 实现Shamir秘密共享算法

### 📊 文件完整性验证
- **SHA256哈希计算**：自动为上传的原始文件计算SHA256哈希值
- **完整性验证**：恢复后自动验证文件完整性
- **哈希记录下载**：提供包含原始和恢复文件哈希值的记录文件
- **可视化验证状态**：在UI中清晰显示文件完整性验证结果

## 使用方法

### 文件加密
1. 选择要加密的文件
2. 选择加密方案（混合或纯Shamir）
3. 设置阈值参数（例如，5个中的3个）
4. （可选）设置密码保护
5. 下载生成的文件（加密文件/共享文件）

### 文件恢复
1. 上传所需文件：
   - 混合方案：加密文件 + 足够的共享文件
   - 纯Shamir方案：足够的共享文件
2. 如果设置了密码，请输入密码
3. 系统自动验证文件完整性
4. 下载恢复的文件和哈希记录

### 文件完整性验证
系统自动提供：
- 原始文件SHA256哈希值（加密时计算）
- 恢复文件SHA256哈希值（恢复时计算）
- 完整性验证结果（通过/失败）
- 哈希记录文件（JSON格式，带时间戳）

## 技术实现

- **前端**：React + TypeScript + Vite
- **样式**：Tailwind CSS
- **加密**：Web Crypto API
- **哈希算法**：SHA-256
- **秘密共享**：Shamir秘密共享算法
- **数学运算**：基于有限域的多项式插值

## 安全性

- **纯客户端**：所有加密操作都在您的浏览器本地执行。任何数据都不会发送到服务器，确保您的文件和密码保持私密。
- 使用强加密算法（AES-256-GCM）
- 密钥派生使用PBKDF2（100,000次迭代）
- 支持密码保护以实现双重安全
- 文件完整性验证确保数据准确性

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:cov

# 检查覆盖率阈值
npm run check:cov
```

## 测试

该项目通过自动化的CI/CD保持较高的测试覆盖率：

- **覆盖率阈值**: 
  - Statements: 65%
  - Branches: 50%
  - Functions: 55%
  - Lines: 65%

- **当前覆盖率**: 整体 69.54%
- **自动化测试**: 每次PR和push都会运行所有测试
- **覆盖率报告**: 可在CI/CD和本地查看

## 安全提醒

- 请妥善保管共享文件和密码
- 建议将共享文件分布式存储在不同位置
- 定期验证共享文件的完整性
- 重要文件应进行备份
