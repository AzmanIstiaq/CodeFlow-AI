# CodeFlow-AI Development Guidelines

This document provides essential information for AI agents to effectively work with the CodeFlow-AI codebase.

## Project Structure

```
CodeFlow-AI/
├── client/           # Frontend application (to be implemented)
└── server/           # Backend services
    └── CodeFlowBackend/  # Main ASP.NET Core API
```

## Architecture Overview

- The project follows a client-server architecture with clear separation of concerns
- Backend: ASP.NET Core 8.0 Web API (.NET 8.0)
- Frontend: Client implementation pending

## Key Technical Details

### Backend (CodeFlowBackend)

- **Framework**: ASP.NET Core 8.0
- **Configuration**:
  - Development settings in `appsettings.Development.json`
  - Production settings in `appsettings.json`
- **Server Configuration**: 
  - HTTP: `http://localhost:5146`
  - HTTPS: `https://localhost:7176`
  - IIS Express: `https://localhost:44335`

### Development Workflows

1. **Building the Solution**:
   ```powershell
   dotnet build CodeFlow-AI.sln
   ```

2. **Running the Backend**:
   ```powershell
   cd server/CodeFlowBackend
   dotnet run
   ```

### Project Conventions

1. **Nullable Reference Types**: Enabled by default (`<Nullable>enable</Nullable>`)
2. **Implicit Usings**: Enabled for cleaner code (`<ImplicitUsings>enable</ImplicitUsings>`)
3. **Global Usings**:
   - Standard ASP.NET Core namespaces
   - Common System namespaces
   - HTTP-related namespaces

## Important Notes

1. When adding new API endpoints:
   - Follow the existing minimal API pattern in `Program.cs`
   - Group related endpoints logically
   - Consider security implications for public endpoints

2. Configuration management:
   - Use `appsettings.json` for default values
   - Override with `appsettings.Development.json` for local development
   - Use environment variables for sensitive information

3. Error handling:
   - Implement consistent error responses
   - Use appropriate HTTP status codes
   - Log errors appropriately using the built-in logging framework